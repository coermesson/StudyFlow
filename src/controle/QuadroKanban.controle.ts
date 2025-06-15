import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { QuadroKanbanDao } from "../dao/QuadroKanban.dao";
import { QuadroKanbanDtoCreate } from "../dto/QuadroKanban.dto";
import { QuadroKanbanServico } from "../servico/QuadroKanban.servico";

export class QuadroKanbanControle {
    private readonly quadroServico = new QuadroKanbanServico(new QuadroKanbanDao());

    public async adicionar(req: Request, res: Response) {
        const dto = plainToInstance(QuadroKanbanDtoCreate, req.body);
        const erros = await validate(dto);

        if (erros.length > 0) {
            return res.status(400).json({ erros: erros.map(e => e.constraints) });
        }

        try {
            const quadro = await this.quadroServico.salvar(dto);
            return res.status(201).json(quadro);
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }

    public async listar(req: Request, res: Response) {
        try {
            const quadros = await this.quadroServico.listar();
            return res.status(200).json(quadros);
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }

    public async buscar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const quadro = await this.quadroServico.buscar(id);
            return res.status(200).json(quadro);
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }

    public async deletar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deletado = await this.quadroServico.deletar(id);

            if (!deletado) {
                return res.status(404).json({ mensagem: "Quadro não encontrado" });
            }

            return res.status(200).json({ mensagem: "Quadro deletado com sucesso" });
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }

    /*public async atualizar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { nome, materiaId } = req.body;

            const atualizado = await this.quadroServico.atualizar({ id, nome, materiaId });

            if (!atualizado) {
                return res.status(404).json({ mensagem: "Quadro não encontrado" });
            }

            return res.status(200).json({ mensagem: "Quadro atualizado com sucesso" });
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }*/
}