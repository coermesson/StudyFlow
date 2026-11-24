import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { QuadroKanbanDao } from "../dao/QuadroKanban.dao";
import { QuadroKanbanDtoCreate, QuadroKanbanDtoUpdate } from "../dto/QuadroKanban.dto";
import { QuadroKanbanServico } from "../servico/QuadroKanban.servico";

export class QuadroKanbanControle {
    private readonly quadroServico = new QuadroKanbanServico(new QuadroKanbanDao());

    public async adicionar(req: Request, res: Response) {
        try {
            if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
                return res.status(400).json({ erro: "Corpo da requisição inválido" });
            }

            const dto = plainToInstance(QuadroKanbanDtoCreate, req.body);
            const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
            if (erros.length > 0) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    detalhes: erros.flatMap((e) => Object.entries(e.constraints ?? {}).map(([tipo, mensagem]) =>
                        tipo === "whitelistValidation" ? `O campo ${e.property} não é permitido.` : mensagem)),
                });
            }

            const quadro = await this.quadroServico.salvar(dto, res.locals.usuarioId as string);
            if (!quadro) return res.status(404).json({ erro: "Matéria não encontrada" });
            return res.status(201).json(quadro);
        } catch (error) {
            console.error("Falha inesperada ao cadastrar quadro Kanban", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }

    public async listar(req: Request, res: Response) {
        try {
            const quadros = await this.quadroServico.listar(res.locals.usuarioId as string);
            return res.status(200).json(quadros ?? []);
        } catch (error) {
            console.error("Falha inesperada ao listar quadros Kanban", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }

    public async buscar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const quadro = await this.quadroServico.buscar(id, res.locals.usuarioId as string);
            if (!quadro) return res.status(404).json({ erro: "Quadro não encontrado" });
            return res.status(200).json(quadro);
        } catch (error) {
            console.error("Falha inesperada ao buscar quadro Kanban", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }

    public async deletar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const deletado = await this.quadroServico.deletar(id, res.locals.usuarioId as string);

            if (!deletado) {
                return res.status(404).json({ erro: "Quadro não encontrado" });
            }

            return res.status(204).send();
        } catch (error) {
            console.error("Falha inesperada ao excluir quadro Kanban", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }

    public async atualizar(req: Request, res: Response) {
        try {
            if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
                return res.status(400).json({ erro: "Corpo da requisição inválido" });
            }

            const dto = plainToInstance(QuadroKanbanDtoUpdate, req.body);
            const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
            if (erros.length > 0) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    detalhes: erros.flatMap((e) => Object.entries(e.constraints ?? {}).map(([tipo, mensagem]) =>
                        tipo === "whitelistValidation" ? `O campo ${e.property} não é permitido.` : mensagem)),
                });
            }
            if (dto.nome === undefined && dto.materiaId === undefined) {
                return res.status(400).json({ erro: "Nenhum campo atualizável informado" });
            }

            const { id } = req.params;
            const atualizado = await this.quadroServico.atualizar(id, dto, res.locals.usuarioId as string);

            if (!atualizado) {
                return res.status(404).json({ erro: "Quadro não encontrado" });
            }

            return res.status(200).json(atualizado);
        } catch (error) {
            console.error("Falha inesperada ao atualizar quadro Kanban", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }
}
