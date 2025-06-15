import { RowDataPacket } from "mysql2";
import { ListaToDoListarDto } from "../dto/ListaToDo.dto";
import { ListaToDo } from "../modelo/ListaToDo";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class ListaToDoDao implements GenericDao<ListaToDo> {
    public async salvar(lista: ListaToDo): Promise<boolean> {
        try {
            const { id, nome, materiaId } = lista;
            await conexao.query(
                'INSERT INTO listaToDo(id, nome, materiaId) VALUES(?, ?, ?)',
                [id, nome, materiaId]
            );
        } catch (error) {
            throw error;
        }
        return true;
    }

    public async buscar(id: string): Promise<ListaToDo | null> {
        try {
            const [[result]] = await conexao.query<RowDataPacket[]>(
                'SELECT * FROM listaToDo WHERE id = ?',
                [id]
            );

            if (!result) {
                return null;
            }

            const { nome, materiaId } = result;
            const lista = ListaToDo.assemble({
                id,
                nome,
                materiaId
            });

            return lista;
        } catch (error) {
            throw error;
        }
    }

    public async atualizar(id: string, item: Partial<ListaToDo>): Promise<ListaToDo | null> {
        return null;
    }

    public async delete(id: string): Promise<boolean> {
        return true;
    }

    public async listar(): Promise<ListaToDoListarDto[] | null> {
        try {
            const [listasDto] = await conexao.query<ListaToDoListarDto[] & RowDataPacket[]>(
                'SELECT id, nome, materiaId FROM listaToDo'
            );

            if (listasDto.length === 0) {
                return null;
            }

            return listasDto;
        } catch (error) {
            throw error;
        }
    }
}