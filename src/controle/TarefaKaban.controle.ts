import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { TarefaKanbanDao } from "../dao/TarefaKanban.dao";
import { TarefaKanbanDtoCreate } from "../dto/TarefaKanban.dto";
import { TarefaKanbanServico } from "../servico/TarefaKanban.servico";

export class TarefaKanbanControle {
  private readonly tarefaServico = new TarefaKanbanServico(new TarefaKanbanDao());

  public async adicionar(req: Request, res: Response) {
    const dto = plainToInstance(TarefaKanbanDtoCreate, req.body);
    const erros = await validate(dto);

    if (erros.length > 0) {
      return res.status(400).json({ errors: erros.map(err => err.constraints) });
    }

    try {
      const tarefa = await this.tarefaServico.salvar(dto);
      return res.status(201).json(tarefa);
    } catch (error) {
      return res.status(500).json({ mensagem: error });
    }
  }

  public async listar(req: Request, res: Response) {
    try {
      const tarefas = await this.tarefaServico.listar();
      return res.status(200).json(tarefas);
    } catch (error) {
      return res.status(500).json({ mensagem: error });
    }
  }

  public async buscar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tarefa = await this.tarefaServico.buscar(id);
      return res.status(200).json(tarefa);
    } catch (error) {
      return res.status(500).json({ mensagem: error });
    }
  }

  public async deletar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const deletado = await this.tarefaServico.deletar(id);

      if (!deletado) {
        return res.status(404).json({ mensagem: "Tarefa não encontrada" });
      }

      return res.status(200).json({ mensagem: "Tarefa deletada com sucesso" });
    } catch (error) {
      return res.status(500).json({ mensagem: error });
    }
  }

  public async atualizar(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const dto = plainToInstance(TarefaKanbanDtoCreate, req.body);
      const erros = await validate(dto);

      if (erros.length > 0) {
        return res.status(400).json({ errors: erros.map(err => err.constraints) });
      }

      const tarefaAtualizada = await this.tarefaServico.atualizar(id, dto);
      if (!tarefaAtualizada) {
        return res.status(404).json({ mensagem: "Tarefa não encontrada" });
      }

      return res.status(200).json(tarefaAtualizada);
    } catch (error) {
      return res.status(500).json({ mensagem: error });
      }
    }
}