import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { CursoDtoCreate, CursoDtoUpdate } from "../dto/Curso.dto";
import { CursoServico } from "../servico/curso.servico";

export class CursoController {
  constructor(private readonly cursoServico: CursoServico) {}

  public salvar = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ erro: "Corpo da requisição inválido" });
      }

      const usuarioId = res.locals.usuarioId as string;
      const dto = plainToInstance(CursoDtoCreate, { ...req.body, usuarioId });
      const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
      if (erros.length > 0) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: erros.flatMap((erro) => Object.entries(erro.constraints ?? {}).map(([tipo, mensagem]) =>
            tipo === "whitelistValidation" ? `O campo ${erro.property} não é permitido.` : mensagem)),
        });
      }

      const curso = await this.cursoServico.salvar(dto, usuarioId);
      if (!curso) return res.status(404).json({ erro: "Usuário não encontrado" });
      return res.status(201).json(curso);
    } catch (error) {
      console.error("Falha inesperada ao cadastrar curso", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public listar = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const cursos = await this.cursoServico.listar(res.locals.usuarioId as string);
      return res.status(200).json(cursos ?? []);
    } catch (error) {
      console.error("Falha inesperada ao listar cursos", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public buscar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const curso = await this.cursoServico.buscar(id, res.locals.usuarioId as string);
      if (!curso) return res.status(404).json({ erro: "Curso não encontrado" });
      return res.status(200).json(curso);
    } catch (error) {
      console.error("Falha inesperada ao buscar curso", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public atualizar = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ erro: "Corpo da requisição inválido" });
      }

      const dto = plainToInstance(CursoDtoUpdate, req.body);
      const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
      if (erros.length > 0) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: erros.flatMap((erro) => Object.entries(erro.constraints ?? {}).map(([tipo, mensagem]) =>
            tipo === "whitelistValidation" ? `O campo ${erro.property} não é permitido.` : mensagem)),
        });
      }
      if (dto.nome === undefined) {
        return res.status(400).json({ erro: "Nenhum campo atualizável informado" });
      }

      const { id } = req.params;
      const curso = await this.cursoServico.atualizar(id, dto, res.locals.usuarioId as string);
      if (!curso) return res.status(404).json({ erro: "Curso não encontrado" });
      return res.status(200).json(curso);
    } catch (error) {
      console.error("Falha inesperada ao atualizar curso", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public deletar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const sucesso = await this.cursoServico.deletar(id, res.locals.usuarioId as string);
      if (!sucesso) return res.status(404).json({ erro: "Curso não encontrado" });
      return res.status(204).send();
    } catch (error) {
      console.error("Falha inesperada ao excluir curso", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };
}
