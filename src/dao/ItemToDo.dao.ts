import { RowDataPacket } from "mysql2";
import { ItemToDoListarDto } from "../dto/ItemToDo.dto";
import { ItemToDo } from "../modelo/ItemToDo";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class ItemToDoDao implements GenericDao<ItemToDo> {
    public async salvar(item: ItemToDo): Promise<boolean> {
        try {
            const { id, descricao, feito, listaId } = item;
            await conexao.query(
                'INSERT INTO itemToDo(id, descricao, feito, listaId) VALUES(?, ?, ?, ?)',
                [id, descricao, feito, listaId]
            );
        } catch (error) {
            throw error;
        }
        return true;
    }

    public async buscar(id: string): Promise<ItemToDo | null> {
        try {
            const [[result]] = await conexao.query<RowDataPacket[]>(
                'SELECT * FROM itemToDo WHERE id = ?',
                [id]
            );

            if (!result) {
                return null;
            }

            const { descricao, feito, listaId } = result;
            const item = ItemToDo.assemble({
                id,
                descricao,
                feito,
                listaId
            });

            return item;
        } catch (error) {
            throw error;
        }
    }

    public async atualizar(id: string, item: Partial<ItemToDo>): Promise<ItemToDo | null> {
        return null;
    }

    public async delete(id: string): Promise<boolean> {
        return true;
    }

    public async listar(): Promise<ItemToDoListarDto[] | null> {
        try {
            const [itensDto] = await conexao.query<ItemToDoListarDto[] & RowDataPacket[]>(
                'SELECT id, descricao, feito, listaId FROM itemToDo'
            );

            if (itensDto.length === 0) {
                return null;
            }

            return itensDto;
        } catch (error) {
            throw error;
        }
    }
}