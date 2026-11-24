import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { MateriaDtoCreate, MateriaDtoUpdate } from "../dto/Materia.dto";
import { MateriaServico } from "../servico/materia.servico";

export class MateriaController {
  constructor(private readonly materiaServico: MateriaServico) {}

  public salvar = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ erro: "Corpo da requisição inválido" });
      }

      const dto = plainToInstance(MateriaDtoCreate, req.body);
      const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
      if (erros.length > 0) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: erros.flatMap((erro) => Object.entries(erro.constraints ?? {}).map(([tipo, mensagem]) =>
            tipo === "whitelistValidation" ? `O campo ${erro.property} não é permitido.` : mensagem)),
        });
      }

      const materia = await this.materiaServico.salvar(dto, res.locals.usuarioId as string);
      if (!materia) return res.status(404).json({ erro: "Curso não encontrado" });
      return res.status(201).json(materia);
    } catch (error) {
      console.error("Falha inesperada ao cadastrar matéria", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public listar = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const materias = await this.materiaServico.listar(res.locals.usuarioId as string);
      return res.status(200).json(materias ?? []);
    } catch (error) {
      console.error("Falha inesperada ao listar matérias", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public buscar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const materia = await this.materiaServico.buscar(id, res.locals.usuarioId as string);
      if (!materia) return res.status(404).json({ erro: "Matéria não encontrada" });
      return res.status(200).json(materia);
    } catch (error) {
      console.error("Falha inesperada ao buscar matéria", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public atualizar = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ erro: "Corpo da requisição inválido" });
      }

      const dto = plainToInstance(MateriaDtoUpdate, req.body);
      const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
      if (erros.length > 0) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: erros.flatMap((erro) => Object.entries(erro.constraints ?? {}).map(([tipo, mensagem]) =>
            tipo === "whitelistValidation" ? `O campo ${erro.property} não é permitido.` : mensagem)),
        });
      }
      if (dto.nome === undefined && dto.cursoId === undefined) {
        return res.status(400).json({ erro: "Nenhum campo atualizável informado" });
      }

      const { id } = req.params;
      const materia = await this.materiaServico.atualizar(id, dto, res.locals.usuarioId as string);
      if (!materia) return res.status(404).json({ erro: "Matéria não encontrada" });
      return res.status(200).json(materia);
    } catch (error) {
      console.error("Falha inesperada ao atualizar matéria", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public deletar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const sucesso = await this.materiaServico.deletar(id, res.locals.usuarioId as string);
      if (!sucesso) return res.status(404).json({ erro: "Matéria não encontrada" });
      return res.status(204).send();
    } catch (error) {
      console.error("Falha inesperada ao excluir matéria", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };
}
