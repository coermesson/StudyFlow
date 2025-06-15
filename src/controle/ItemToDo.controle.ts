import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response } from "express";
import { ItemToDoDtoCreate } from "../dto/ItemToDo.dto";
import { ItemToDoServico } from "../servico/ItemToDo.servico";

export class ItemToDoControle {

    public constructor(private readonly itemService: ItemToDoServico) { }

    public async adicionar(req: Request, res: Response) {
        const itemDto = plainToInstance(ItemToDoDtoCreate, req.body);
        const erros = await validate(itemDto);

        if (erros.length > 0) {
            return res.status(400).json({ errors: erros.map(err => err.constraints) });
        }

        try {
            const item = await this.itemService.salvar(itemDto);
            res.status(201).json(item).send();
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }

    public async listar(req: Request, res: Response) {
        try {
            const items = await this.itemService.listar();
            res.status(200).json(items).send();
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }

    public async buscar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const item = await this.itemService.buscar(id);
            res.status(200).json(item).send();
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }
 /*
    public async deletar(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const linhasAfetadas = await this.itemService.deletar(id);
            if (linhasAfetadas === 0) {
                return res.status(404).json({ mensagem: "Item não encontrado" });
            }
            return res.status(200).json({ mensagem: "Item deletado com sucesso" });
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }*/
}