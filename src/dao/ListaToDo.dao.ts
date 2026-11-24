import { ResultSetHeader, RowDataPacket } from "mysql2";
import { ListaToDoListarDto } from "../dto/ListaToDo.dto";
import { ListaToDo } from "../modelo/ListaToDo";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class ListaToDoDao implements GenericDao<ListaToDo> {
    public async salvar(lista: ListaToDo, usuarioId?: string): Promise<boolean> {
        if (!usuarioId) return false;
        try {
            const { id, nome, materiaId } = lista;
            const [result] = await conexao.query<ResultSetHeader>(
                `INSERT INTO listatodo(id, nome, materiaId)
                 SELECT ?, ?, materia.id FROM Materia materia
                 JOIN Curso curso ON curso.id = materia.cursoId
                 WHERE materia.id = ? AND curso.usuarioId = ?`,
                [id, nome, materiaId, usuarioId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    public async buscar(id: string, usuarioId?: string): Promise<ListaToDo | null> {
        if (!usuarioId) return null;
        try {
            const [[result]] = await conexao.query<RowDataPacket[]>(
                `SELECT lista.* FROM listatodo lista
                 JOIN Materia materia ON materia.id = lista.materiaId
                 JOIN Curso curso ON curso.id = materia.cursoId
                 WHERE lista.id = ? AND curso.usuarioId = ?`,
                [id, usuarioId]
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

    public async atualizar(id: string, item: Partial<ListaToDo>, usuarioId?: string): Promise<ListaToDo | null> {
        if (!usuarioId) return null;
        try {
            const fields: string[] = [];
            const values: unknown[] = [];

            if (item.nome !== undefined) {
                fields.push("lista.nome = ?");
                values.push(item.nome);
            }

            if (item.materiaId !== undefined) {
                fields.push("lista.materiaId = ?");
                values.push(item.materiaId);
            }

            if (fields.length === 0) return this.buscar(id, usuarioId);

            values.push(id, usuarioId);
            const destinationCheck = item.materiaId !== undefined
                ? `AND EXISTS (SELECT 1 FROM Materia destino
                               JOIN Curso destinoCurso ON destinoCurso.id = destino.cursoId
                               WHERE destino.id = ? AND destinoCurso.usuarioId = ?)`
                : "";
            if (item.materiaId !== undefined) values.push(item.materiaId, usuarioId);

            await conexao.query(
                `UPDATE listatodo lista
                 JOIN Materia materia ON materia.id = lista.materiaId
                 JOIN Curso curso ON curso.id = materia.cursoId
                 SET ${fields.join(", ")}
                 WHERE lista.id = ? AND curso.usuarioId = ? ${destinationCheck}`,
                values
            );

            const lista = await this.buscar(id, usuarioId);
            if (item.materiaId !== undefined && lista?.materiaId !== item.materiaId) return null;
            return lista;
        } catch (error) {
            throw error;
        }
    }

    public async delete(id: string, usuarioId?: string): Promise<boolean> {
        if (!usuarioId) return false;
        try {
            const [result] = await conexao.query<ResultSetHeader>(
                `DELETE lista FROM listatodo lista
                 JOIN Materia materia ON materia.id = lista.materiaId
                 JOIN Curso curso ON curso.id = materia.cursoId
                 WHERE lista.id = ? AND curso.usuarioId = ?`,
                [id, usuarioId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    public async listar(usuarioId?: string): Promise<ListaToDoListarDto[] | null> {
        if (!usuarioId) return null;
        try {
            const [listasDto] = await conexao.query<ListaToDoListarDto[] & RowDataPacket[]>(
                `SELECT lista.id, lista.nome, lista.materiaId FROM listatodo lista
                 JOIN Materia materia ON materia.id = lista.materiaId
                 JOIN Curso curso ON curso.id = materia.cursoId
                 WHERE curso.usuarioId = ?`,
                [usuarioId]
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
