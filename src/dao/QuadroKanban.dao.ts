import { ResultSetHeader, RowDataPacket } from "mysql2";
import { QuadroKanban } from "../modelo/QuadroKanban";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class QuadroKanbanDao implements GenericDao<QuadroKanban> {

  public async salvar(quadro: QuadroKanban, usuarioId?: string): Promise<boolean> {
    if (!usuarioId) return false;
    try {
      const { nome, materiaId } = quadro;
      const [result] = await conexao.query<ResultSetHeader>(
        `INSERT INTO QuadroKanban (id, nome, materiaId)
         SELECT ?, ?, materia.id FROM Materia materia
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE materia.id = ? AND curso.usuarioId = ?`,
        [quadro.id, nome, materiaId, usuarioId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Erro ao salvar QuadroKanban:", error);
      throw error;
    }
  }

  public async buscar(id: string, usuarioId?: string): Promise<QuadroKanban | null> {
    if (!usuarioId) return null;
    try {
      const [[result]] = await conexao.query<RowDataPacket[]>(
        `SELECT quadro.* FROM QuadroKanban quadro
         JOIN Materia materia ON materia.id = quadro.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE quadro.id = ? AND curso.usuarioId = ?`,
        [id, usuarioId]
      );

      if (!result) return null;

      const { nome, materiaId } = result;
      return QuadroKanban.assemble({
        id: result.id.toString(),
        nome,
        materiaId,
      });
    } catch (error) {
      console.error("Erro ao buscar QuadroKanban:", error);
      throw error;
    }
  }

  public async atualizar(id: string, item: Partial<QuadroKanban>, usuarioId?: string): Promise<QuadroKanban | null> {
    if (!usuarioId) return null;
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (item.nome !== undefined) {
        fields.push("quadro.nome = ?");
        values.push(item.nome);
      }

      if (item.materiaId !== undefined) {
        fields.push("quadro.materiaId = ?");
        values.push(item.materiaId);
      }

      if (fields.length === 0) {
        return await this.buscar(id, usuarioId);
      }

      values.push(id, usuarioId);
      const destinationCheck = item.materiaId !== undefined
        ? `AND EXISTS (SELECT 1 FROM Materia destino
                       JOIN Curso destinoCurso ON destinoCurso.id = destino.cursoId
                       WHERE destino.id = ? AND destinoCurso.usuarioId = ?)`
        : "";
      if (item.materiaId !== undefined) values.push(item.materiaId, usuarioId);
      await conexao.query(
        `UPDATE QuadroKanban quadro
         JOIN Materia materia ON materia.id = quadro.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         SET ${fields.join(", ")}
         WHERE quadro.id = ? AND curso.usuarioId = ? ${destinationCheck}`,
        values
      );

      const quadro = await this.buscar(id, usuarioId);
      if (item.materiaId !== undefined && quadro?.materiaId !== item.materiaId) return null;
      return quadro;
    } catch (error) {
      console.error("Erro ao atualizar QuadroKanban:", error);
      throw error;
    }
  }

  public async delete(id: string, usuarioId?: string): Promise<boolean> {
    if (!usuarioId) return false;
    try {
      const [result] = await conexao.query<ResultSetHeader>(
        `DELETE quadro FROM QuadroKanban quadro
         JOIN Materia materia ON materia.id = quadro.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE quadro.id = ? AND curso.usuarioId = ?`,
        [id, usuarioId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Erro ao deletar QuadroKanban:", error);
      throw error;
    }
  }

  public async listar(usuarioId?: string): Promise<QuadroKanban[] | null> {
    if (!usuarioId) return null;
    try {
      const [quadros] = await conexao.query<RowDataPacket[]>(
        `SELECT quadro.* FROM QuadroKanban quadro
         JOIN Materia materia ON materia.id = quadro.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE curso.usuarioId = ?`,
        [usuarioId]
      );

      if (quadros.length === 0) return null;

      return quadros.map((q) =>
        QuadroKanban.assemble({
          id: q.id.toString(),
          nome: q.nome,
          materiaId: q.materiaId,
        })
      );
    } catch (error) {
      console.error("Erro ao listar QuadrosKanban:", error);
      throw error;
    }
  }
}
