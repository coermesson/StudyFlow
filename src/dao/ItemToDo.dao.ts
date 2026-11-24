import { ResultSetHeader, RowDataPacket } from "mysql2";
import { ItemToDoListarDto } from "../dto/ItemToDo.dto";
import { ItemToDo } from "../modelo/ItemToDo";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class ItemToDoDao implements GenericDao<ItemToDo> {
    public async salvar(item: ItemToDo, usuarioId?: string): Promise<boolean> {
        if (!usuarioId) return false;
        try {
            const { id, descricao, feito, listaId } = item;
            const [result] = await conexao.query<ResultSetHeader>(
                `INSERT INTO itemToDo(id, descricao, feito, listaId)
                 SELECT ?, ?, ?, lista.id FROM listatodo lista
                 JOIN Materia materia ON materia.id = lista.materiaId
                 JOIN Curso curso ON curso.id = materia.cursoId
                 WHERE lista.id = ? AND curso.usuarioId = ?`,
                [id, descricao, feito, listaId, usuarioId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    public async buscar(id: string, usuarioId?: string): Promise<ItemToDo | null> {
        if (!usuarioId) return null;
        try {
            const [[result]] = await conexao.query<RowDataPacket[]>(
                `SELECT item.* FROM itemToDo item
                 JOIN listatodo lista ON lista.id = item.listaId
                 JOIN Materia materia ON materia.id = lista.materiaId
                 JOIN Curso curso ON curso.id = materia.cursoId
                 WHERE item.id = ? AND curso.usuarioId = ?`,
                [id, usuarioId]
            );

            if (!result) {
                return null;
            }

            const { descricao, feito, listaId } = result;
            const item = ItemToDo.assemble({
                id,
                descricao,
                feito: Number(feito) === 1,
                listaId
            });

            return item;
        } catch (error) {
            throw error;
        }
    }

    public async atualizar(id: string, item: Partial<ItemToDo>, usuarioId?: string): Promise<ItemToDo | null> {
        if (!usuarioId) return null;
        try {
            const fields: string[] = [];
            const values: unknown[] = [];

            if (item.descricao !== undefined) {
                fields.push("item.descricao = ?");
                values.push(item.descricao);
            }

            if (item.feito !== undefined) {
                fields.push("item.feito = ?");
                values.push(item.feito);
            }

            if (item.listaId !== undefined) {
                fields.push("item.listaId = ?");
                values.push(item.listaId);
            }

            if (fields.length === 0) return this.buscar(id, usuarioId);

            values.push(id, usuarioId);
            const destinationCheck = item.listaId !== undefined
                ? `AND EXISTS (SELECT 1 FROM listatodo destino
                               JOIN Materia destinoMateria ON destinoMateria.id = destino.materiaId
                               JOIN Curso destinoCurso ON destinoCurso.id = destinoMateria.cursoId
                               WHERE destino.id = ? AND destinoCurso.usuarioId = ?)`
                : "";
            if (item.listaId !== undefined) values.push(item.listaId, usuarioId);

            await conexao.query(
                `UPDATE itemToDo item
                 JOIN listatodo lista ON lista.id = item.listaId
                 JOIN Materia materia ON materia.id = lista.materiaId
                 JOIN Curso curso ON curso.id = materia.cursoId
                 SET ${fields.join(", ")}
                 WHERE item.id = ? AND curso.usuarioId = ? ${destinationCheck}`,
                values
            );

            const updated = await this.buscar(id, usuarioId);
            if (item.listaId !== undefined && updated?.listaId !== item.listaId) return null;
            return updated;
        } catch (error) {
            throw error;
        }
    }

    public async delete(id: string, usuarioId?: string): Promise<boolean> {
        if (!usuarioId) return false;
        try {
            const [result] = await conexao.query<ResultSetHeader>(
                `DELETE item FROM itemToDo item
                 JOIN listatodo lista ON lista.id = item.listaId
                 JOIN Materia materia ON materia.id = lista.materiaId
                 JOIN Curso curso ON curso.id = materia.cursoId
                 WHERE item.id = ? AND curso.usuarioId = ?`,
                [id, usuarioId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    public async listar(usuarioId?: string): Promise<ItemToDoListarDto[] | null> {
        if (!usuarioId) return null;
        try {
            const [itensDto] = await conexao.query<ItemToDoListarDto[] & RowDataPacket[]>(
                `SELECT item.id, item.descricao, item.feito, item.listaId FROM itemToDo item
                 JOIN listatodo lista ON lista.id = item.listaId
                 JOIN Materia materia ON materia.id = lista.materiaId
                 JOIN Curso curso ON curso.id = materia.cursoId
                 WHERE curso.usuarioId = ?`,
                [usuarioId]
            );

            if (itensDto.length === 0) {
                return null;
            }

            return itensDto.map(item => ({
                ...item,
                feito: Number(item.feito) === 1
            }));
        } catch (error) {
            throw error;
        }
    }
}
