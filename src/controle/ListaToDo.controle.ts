import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Request, Response } from "express";
import { ListaToDoDtoCreate } from "../dto/ListaToDo.dto";
import { ListaToDoServico } from "../servico/ListaToDo.servico";

export class ListaToDoControle {

    public constructor(private readonly listaService: ListaToDoServico) { }

    public async adicionar(req: Request, res: Response) {
        const listaDto = plainToInstance(ListaToDoDtoCreate, req.body);
        const erros = await validate(listaDto);

        if (erros.length > 0) {
            return res.status(400).json({ errors: erros.map(err => err.constraints) });
        }

        try {
            const lista = await this.listaService.salvar(listaDto);
            res.status(201).json(lista).send();
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }

    public async listar(req: Request, res: Response) {
        try {
            const listas = await this.listaService.listar();
            res.status(200).json(listas).send();
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }

    public async buscar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const lista = await this.listaService.buscar(id);
            res.status(200).json(lista).send();
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }

    /*public async delete(req: Request, res: Response) {
        const { id } = req.params;
        try {
            const linhasAfetadas = await this.listaService.delete(id);
            if (linhasAfetadas === 0) {
                return res.status(404).json({ mensagem: "Lista não encontrada" });
            }
            return res.status(200).json({ mensagem: "Lista deletada com sucesso" });
        } catch (error) {
            return res.status(500).json({ mensagem: error });
        }
    }*/
}