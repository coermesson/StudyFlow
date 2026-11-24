import { ArquivoDao } from "../dao/Arquivo.dao";
import { ArquivoDtoCreate } from "../dto/Arquivo.dto";
import { Arquivo, ArquivoProps } from "../modelo/Arquivo";
import { arquivoArmazenamento } from "../util/arquivoArmazenamento";

export class ArquivoServico {
  constructor(private arquivoDao: ArquivoDao) {}

  public async salvar(dto: ArquivoDtoCreate, caminhoTemporario: string, usuarioId: string): Promise<ArquivoProps | null> {
    const arquivo = Arquivo.build(dto);
    await arquivoArmazenamento.salvarTemporario(caminhoTemporario, arquivo.id);
    try {
      const salvo = await this.arquivoDao.salvar(arquivo, usuarioId);
      if (!salvo) {
        await arquivoArmazenamento.remover([arquivo.id]);
        return null;
      }
      return arquivo.props;
    } catch (error) {
      await arquivoArmazenamento.remover([arquivo.id]);
      throw error;
    }
  }

  public async buscar(id: string, usuarioId: string): Promise<ArquivoProps | null> {
    const arquivo = await this.arquivoDao.buscar(id, usuarioId);
    return arquivo?.props ?? null;
  }

  public async listar(usuarioId: string): Promise<ArquivoProps[] | null> {
    const arquivos = await this.arquivoDao.listar(usuarioId);
    return arquivos?.map(a => a.props) ?? null;
  }

  public async atualizar(id: string, dados: Partial<ArquivoProps>, usuarioId: string): Promise<ArquivoProps | null> {
    const arquivo = await this.arquivoDao.atualizar(id, dados, usuarioId);
    return arquivo?.props ?? null;
  }

  public async deletar(id: string, usuarioId: string): Promise<boolean> {
    const arquivo = await this.arquivoDao.buscar(id, usuarioId);
    if (!arquivo) return false;
    const deletado = await this.arquivoDao.delete(id, usuarioId);
    if (!deletado) return false;
    await arquivoArmazenamento.remover([id]);
    return true;
  }

  public async obterParaDownload(id: string, usuarioId: string): Promise<{ arquivo: ArquivoProps; caminho: string } | null> {
    const arquivo = await this.arquivoDao.buscar(id, usuarioId);
    if (!arquivo) return null;
    return { arquivo: arquivo.props, caminho: arquivoArmazenamento.caminhoDoArquivo(arquivo.id) };
  }
}
