import { constants } from "node:fs";
import { copyFile, mkdir, open, stat, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function diretorioRaiz(): string {
  const configurado = process.env.UPLOAD_DIR ?? path.join(os.homedir(), ".studyflow", "uploads");
  const raiz = path.resolve(configurado);
  const diretorioPublico = path.resolve(process.cwd(), "public");
  const relativoAoPublico = path.relative(diretorioPublico, raiz);
  if (relativoAoPublico === "" || (!relativoAoPublico.startsWith("..") && !path.isAbsolute(relativoAoPublico))) {
    throw new Error("UPLOAD_DIR deve ficar fora do diretório público");
  }
  return raiz;
}

function validarId(id: string): void {
  if (!UUID_PATTERN.test(id)) throw new Error("Identificador de arquivo inválido");
}

function estaDentro(diretorio: string, arquivo: string): boolean {
  const relativo = path.relative(diretorio, arquivo);
  return relativo !== "" && !relativo.startsWith("..") && !path.isAbsolute(relativo);
}

export const arquivoArmazenamento = {
  async diretorioTemporarioUpload(): Promise<string> {
    const diretorio = path.join(diretorioRaiz(), "temporarios", "uploads");
    await mkdir(diretorio, { recursive: true });
    return diretorio;
  },

  caminhoDoArquivo(id: string): string {
    validarId(id);
    return path.join(diretorioRaiz(), "arquivos", `${id}.pdf`);
  },

  async salvarTemporario(caminhoTemporario: string, id: string): Promise<void> {
    validarId(id);
    const diretorioTemporario = await this.diretorioTemporarioUpload();
    const caminhoOrigem = path.resolve(caminhoTemporario);
    if (!estaDentro(diretorioTemporario, caminhoOrigem)) {
      throw new Error("Arquivo temporário fora do diretório de upload");
    }

    const diretorioFinal = path.join(diretorioRaiz(), "arquivos");
    await mkdir(diretorioFinal, { recursive: true });
    const caminhoFinal = this.caminhoDoArquivo(id);
    await copyFile(caminhoOrigem, caminhoFinal, constants.COPYFILE_EXCL);
    try {
      await unlink(caminhoOrigem);
    } catch (error) {
      try {
        await unlink(caminhoFinal);
      } catch {
        // Preserve the original error; the upload controller also cleans the temporary file.
      }
      throw error;
    }
  },

  async validarAssinaturaPdf(caminho: string): Promise<boolean> {
    const diretorioTemporario = await this.diretorioTemporarioUpload();
    const caminhoResolvido = path.resolve(caminho);
    if (!estaDentro(diretorioTemporario, caminhoResolvido)) return false;

    const arquivo = await open(caminhoResolvido, "r");
    try {
      const assinaturaPdf = Buffer.from("%PDF-");
      const inicio = Buffer.alloc(assinaturaPdf.length);
      const { bytesRead } = await arquivo.read(inicio, 0, inicio.length, 0);
      return bytesRead === assinaturaPdf.length && inicio.equals(assinaturaPdf);
    } finally {
      await arquivo.close();
    }
  },

  async existe(id: string): Promise<boolean> {
    try {
      await stat(this.caminhoDoArquivo(id));
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
      throw error;
    }
  },

  async removerTemporario(caminho: string): Promise<void> {
    const diretorioTemporario = await this.diretorioTemporarioUpload();
    const caminhoResolvido = path.resolve(caminho);
    if (!estaDentro(diretorioTemporario, caminhoResolvido)) return;
    try {
      await unlink(caminhoResolvido);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  },

  async remover(ids: string[]): Promise<void> {
    await Promise.all(ids.map(async (id) => {
      try {
        await unlink(this.caminhoDoArquivo(id));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          console.error(
            "Falha ao remover arquivo físico",
            id,
            error instanceof Error ? error.name : "Erro desconhecido"
          );
        }
      }
    }));
  }
};
