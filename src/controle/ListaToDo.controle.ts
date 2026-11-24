import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { ListaToDoDtoCreate, ListaToDoDtoUpdate } from "../dto/ListaToDo.dto";
import { ListaToDoServico } from "../servico/ListaToDo.servico";

export class ListaToDoControle {
    public constructor(private readonly listaService: ListaToDoServico) { }

    public async adicionar(req: Request, res: Response): Promise<Response> {
        try {
            if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
                return res.status(400).json({ erro: "Corpo da requisição inválido" });
            }

            const listaDto = plainToInstance(ListaToDoDtoCreate, req.body);
            const erros = await validate(listaDto, { whitelist: true, forbidNonWhitelisted: true });
            if (erros.length > 0) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    detalhes: erros.flatMap((err) => Object.entries(err.constraints ?? {}).map(([tipo, mensagem]) =>
                        tipo === "whitelistValidation" ? `O campo ${err.property} não é permitido.` : mensagem)),
                });
            }

            const lista = await this.listaService.salvar(listaDto, res.locals.usuarioId as string);
            if (!lista) return res.status(404).json({ erro: "Matéria não encontrada" });
            return res.status(201).json(lista);
        } catch (error) {
            console.error("Falha inesperada ao cadastrar lista ToDo", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }

    public async listar(_req: Request, res: Response): Promise<Response> {
        try {
            const listas = await this.listaService.listar(res.locals.usuarioId as string);
            return res.status(200).json(listas ?? []);
        } catch (error) {
            console.error("Falha inesperada ao listar listas ToDo", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }

    public async buscar(req: Request, res: Response): Promise<Response> {
        try {
            const lista = await this.listaService.buscar(req.params.id, res.locals.usuarioId as string);
            if (!lista) return res.status(404).json({ erro: "Lista não encontrada" });
            return res.status(200).json(lista);
        } catch (error) {
            console.error("Falha inesperada ao buscar lista ToDo", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }

    public async atualizar(req: Request, res: Response): Promise<Response> {
        try {
            if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
                return res.status(400).json({ erro: "Corpo da requisição inválido" });
            }

            const dto = plainToInstance(ListaToDoDtoUpdate, req.body);
            const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
            if (erros.length > 0) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    detalhes: erros.flatMap((err) => Object.entries(err.constraints ?? {}).map(([tipo, mensagem]) =>
                        tipo === "whitelistValidation" ? `O campo ${err.property} não é permitido.` : mensagem)),
                });
            }
            if (dto.nome === undefined && dto.materiaId === undefined) {
                return res.status(400).json({ erro: "Nenhum campo atualizável informado" });
            }

            const lista = await this.listaService.atualizar(req.params.id, dto, res.locals.usuarioId as string);
            if (!lista) return res.status(404).json({ erro: "Lista não encontrada" });
            return res.status(200).json(lista);
        } catch (error) {
            console.error("Falha inesperada ao atualizar lista ToDo", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }

    public async deletar(req: Request, res: Response): Promise<Response> {
        try {
            const deletada = await this.listaService.deletar(req.params.id, res.locals.usuarioId as string);
            if (!deletada) return res.status(404).json({ erro: "Lista não encontrada" });
            return res.status(204).send();
        } catch (error) {
            console.error("Falha inesperada ao excluir lista ToDo", error instanceof Error ? error.name : "Erro desconhecido");
            return res.status(500).json({ erro: "Erro interno do servidor" });
        }
    }
}
