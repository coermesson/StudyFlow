import { Request, Response } from "express";
import { ArquivoDtoCreate, ArquivoDtoUpdate } from "../dto/Arquivo.dto";
import { ArquivoServico } from "../servico/arquivo.servico";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { arquivoArmazenamento } from "../util/arquivoArmazenamento";

export class ArquivoController {
  constructor(private readonly arquivoServico: ArquivoServico) {}

  public salvar = async (req: Request, res: Response): Promise<Response> => {
    const arquivoRecebido = req.file;
    try {
      if (!arquivoRecebido) return res.status(400).json({ erro: "Envie um arquivo PDF no campo arquivo" });
      if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ erro: "Corpo da requisição inválido" });
      }

      const dto = plainToInstance(ArquivoDtoCreate, {
        ...req.body,
        nome: arquivoRecebido.originalname,
      });
      const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
      if (erros.length > 0) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: erros.flatMap((erro) => Object.entries(erro.constraints ?? {}).map(([tipo, mensagem]) =>
            tipo === "whitelistValidation" ? `O campo ${erro.property} não é permitido.` : mensagem)),
        });
      }
      if (!(await arquivoArmazenamento.validarAssinaturaPdf(arquivoRecebido.path))) {
        return res.status(400).json({ erro: "O conteúdo enviado não possui a assinatura PDF esperada" });
      }

      const arquivo = await this.arquivoServico.salvar(dto, arquivoRecebido.path, res.locals.usuarioId as string);
      if (!arquivo) return res.status(404).json({ erro: "Matéria não encontrada" });
      return res.status(201).json(arquivo);
    } catch (error) {
      console.error("Falha inesperada ao cadastrar arquivo", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    } finally {
      if (arquivoRecebido?.path) {
        try {
          await arquivoArmazenamento.removerTemporario(arquivoRecebido.path);
        } catch (error) {
          console.error("Falha ao remover upload temporário", error instanceof Error ? error.name : "Erro desconhecido");
        }
      }
    }
  };

  public listar = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const arquivos = await this.arquivoServico.listar(res.locals.usuarioId as string);
      return res.status(200).json(arquivos ?? []);
    } catch (error) {
      console.error("Falha inesperada ao listar arquivos", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public buscar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const arquivo = await this.arquivoServico.buscar(id, res.locals.usuarioId as string);
      if (!arquivo) return res.status(404).json({ erro: "Arquivo não encontrado" });
      return res.status(200).json(arquivo);
    } catch (error) {
      console.error("Falha inesperada ao buscar arquivo", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public baixar = async (req: Request, res: Response): Promise<void> => {
    try {
      const download = await this.arquivoServico.obterParaDownload(req.params.id, res.locals.usuarioId as string);
      if (!download || !(await arquivoArmazenamento.existe(download.arquivo.id))) {
        res.status(404).json({ erro: "Arquivo não encontrado" });
        return;
      }

      const nomeSeguro = download.arquivo.nome.replace(/[\\/\r\n"]/g, "_");
      const nomeDownload = /\.pdf$/i.test(nomeSeguro) ? nomeSeguro : `${nomeSeguro}.pdf`;
      res.type("application/pdf").download(download.caminho, nomeDownload, (error) => {
        if (error) {
          console.error("Falha ao enviar arquivo", error instanceof Error ? error.name : "Erro desconhecido");
          if (!res.headersSent) res.status(500).json({ erro: "Erro interno do servidor" });
        }
      });
    } catch (error) {
      console.error("Falha inesperada ao baixar arquivo", error instanceof Error ? error.name : "Erro desconhecido");
      if (!res.headersSent) res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public atualizar = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ erro: "Corpo da requisição inválido" });
      }

      const dto = plainToInstance(ArquivoDtoUpdate, req.body);
      const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
      if (erros.length > 0) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: erros.flatMap((erro) => Object.entries(erro.constraints ?? {}).map(([tipo, mensagem]) =>
            tipo === "whitelistValidation" ? `O campo ${erro.property} não é permitido.` : mensagem)),
        });
      }
      if (dto.nome === undefined && dto.materiaId === undefined) {
        return res.status(400).json({ erro: "Nenhum campo atualizável informado" });
      }

      const { id } = req.params;
      const arquivo = await this.arquivoServico.atualizar(id, dto, res.locals.usuarioId as string);
      if (!arquivo) return res.status(404).json({ erro: "Arquivo não encontrado" });
      return res.status(200).json(arquivo);
    } catch (error) {
      console.error("Falha inesperada ao atualizar arquivo", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public deletar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const sucesso = await this.arquivoServico.deletar(id, res.locals.usuarioId as string);
      if (!sucesso) return res.status(404).json({ erro: "Arquivo não encontrado" });
      return res.status(204).send();
    } catch (error) {
      console.error("Falha inesperada ao excluir arquivo", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };
}
