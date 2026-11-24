import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { TarefaKanbanDao } from "../dao/TarefaKanban.dao";
import { TarefaKanbanDtoCreate, TarefaKanbanDtoUpdate } from "../dto/TarefaKanban.dto";
import { TarefaKanbanServico } from "../servico/TarefaKanban.servico";

export class TarefaKanbanControle {
  private readonly tarefaServico = new TarefaKanbanServico(new TarefaKanbanDao());

  public async adicionar(req: Request, res: Response) {
    try {
      if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ erro: "Corpo da requisição inválido" });
      }

      const dto = plainToInstance(TarefaKanbanDtoCreate, req.body);
      const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
      if (erros.length > 0) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: erros.flatMap((err) => Object.entries(err.constraints ?? {}).map(([tipo, mensagem]) =>
            tipo === "whitelistValidation" ? `O campo ${err.property} não é permitido.` : mensagem)),
        });
      }

      const tarefa = await this.tarefaServico.salvar(dto, res.locals.usuarioId as string);
      if (!tarefa) return res.status(404).json({ erro: "Quadro não encontrado" });
      return res.status(201).json(tarefa);
    } catch (error) {
      console.error("Falha inesperada ao cadastrar tarefa Kanban", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }

  public async listar(req: Request, res: Response) {
    try {
      const tarefas = await this.tarefaServico.listar(res.locals.usuarioId as string);
      return res.status(200).json(tarefas ?? []);
    } catch (error) {
      console.error("Falha inesperada ao listar tarefas Kanban", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }

  public async buscar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tarefa = await this.tarefaServico.buscar(id, res.locals.usuarioId as string);
      if (!tarefa) return res.status(404).json({ erro: "Tarefa não encontrada" });
      return res.status(200).json(tarefa);
    } catch (error) {
      console.error("Falha inesperada ao buscar tarefa Kanban", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }

  public async deletar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletado = await this.tarefaServico.deletar(id, res.locals.usuarioId as string);

      if (!deletado) {
        return res.status(404).json({ erro: "Tarefa não encontrada" });
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Falha inesperada ao excluir tarefa Kanban", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }

  public async atualizar(req: Request, res: Response) {
    try {
      if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ erro: "Corpo da requisição inválido" });
      }

      const dto = plainToInstance(TarefaKanbanDtoUpdate, req.body);
      const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
      if (erros.length > 0) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: erros.flatMap((err) => Object.entries(err.constraints ?? {}).map(([tipo, mensagem]) =>
            tipo === "whitelistValidation" ? `O campo ${err.property} não é permitido.` : mensagem)),
        });
      }
      if (dto.titulo === undefined && dto.descricao === undefined && dto.status === undefined &&
          dto.prioridade === undefined && dto.quadroId === undefined) {
        return res.status(400).json({ erro: "Nenhum campo atualizável informado" });
      }

      const { id } = req.params;
      const atualizado = await this.tarefaServico.atualizar(id, dto, res.locals.usuarioId as string);

      if (!atualizado) {
        return res.status(404).json({ erro: "Tarefa não encontrada" });
      }

      return res.status(200).json(atualizado);
    } catch (error) {
      console.error("Falha inesperada ao atualizar tarefa Kanban", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  }
}
