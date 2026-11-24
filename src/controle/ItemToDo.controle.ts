import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { ItemToDoDtoCreate, ItemToDoDtoUpdate } from "../dto/ItemToDo.dto";
import { ItemToDoServico } from "../servico/ItemToDo.servico";

export class ItemToDoControle {
    public constructor(private readonly itemService: ItemToDoServico) { }

    public async adicionar(req: Request, res: Response): Promise<Response> {
        try {
            if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
                return res.status(400).json({ erro: "Corpo da requisição inválido" });
            }

            const itemDto = plainToInstance(ItemToDoDtoCreate, req.body);
            const erros = await validate(itemDto, { whitelist: true, forbidNonWhitelisted: true });
            if (erros.length > 0) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    detalhes: erros.flatMap((err) => Object.entries(err.constraints ?? {}).map(([tipo, mensagem]) =>
                        tipo === "whitelistValidation" ? `O campo ${err.property} não é permitido.` : mensagem)),
                });
            }

            const item = await this.itemService.salvar(itemDto, res.locals.usuarioId as string);
            if (!item) return res.status(404).json({ erro: "Lista não encontrada" });
            return res.status(201).json(item);
        } catch (error) {
            console.error("Falha inesperada ao cadastrar item ToDo", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }

    public async listar(_req: Request, res: Response): Promise<Response> {
        try {
            const items = await this.itemService.listar(res.locals.usuarioId as string);
            return res.status(200).json(items ?? []);
        } catch (error) {
            console.error("Falha inesperada ao listar itens ToDo", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }

    public async buscar(req: Request, res: Response): Promise<Response> {
        try {
            const item = await this.itemService.buscar(req.params.id, res.locals.usuarioId as string);
            if (!item) return res.status(404).json({ erro: "Item não encontrado" });
            return res.status(200).json(item);
        } catch (error) {
            console.error("Falha inesperada ao buscar item ToDo", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }

    public async atualizar(req: Request, res: Response): Promise<Response> {
        try {
            if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
                return res.status(400).json({ erro: "Corpo da requisição inválido" });
            }

            const dto = plainToInstance(ItemToDoDtoUpdate, req.body);
            const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
            if (erros.length > 0) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    detalhes: erros.flatMap((err) => Object.entries(err.constraints ?? {}).map(([tipo, mensagem]) =>
                        tipo === "whitelistValidation" ? `O campo ${err.property} não é permitido.` : mensagem)),
                });
            }
            if (dto.descricao === undefined && dto.feito === undefined && dto.listaId === undefined) {
                return res.status(400).json({ erro: "Nenhum campo atualizável informado" });
            }

            const item = await this.itemService.atualizar(req.params.id, dto, res.locals.usuarioId as string);
            if (!item) return res.status(404).json({ erro: "Item não encontrado" });
            return res.status(200).json(item);
        } catch (error) {
            console.error("Falha inesperada ao atualizar item ToDo", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }

    public async deletar(req: Request, res: Response): Promise<Response> {
        try {
            const deletado = await this.itemService.deletar(req.params.id, res.locals.usuarioId as string);
            if (!deletado) return res.status(404).json({ erro: "Item não encontrado" });
            return res.status(204).send();
        } catch (error) {
            console.error("Falha inesperada ao excluir item ToDo", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }
}
