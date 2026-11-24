import { ResultSetHeader, RowDataPacket } from "mysql2";
import { TarefaKanban } from "../modelo/TarefaKanban";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class TarefaKanbanDao implements GenericDao<TarefaKanban> {
  
  public async salvar(tarefa: TarefaKanban, usuarioId?: string): Promise<boolean> {
    if (!usuarioId) return false;
    try {
      const { titulo, descricao, status, prioridade, quadroId } = tarefa;
      const [result] = await conexao.query<ResultSetHeader>(
        `INSERT INTO TarefaKanban (id, titulo, descricao, status, prioridade, quadroId)
         SELECT ?, ?, ?, ?, ?, quadro.id FROM QuadroKanban quadro
         JOIN Materia materia ON materia.id = quadro.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE quadro.id = ? AND curso.usuarioId = ?`,
        [tarefa.id, titulo, descricao, status, prioridade, quadroId, usuarioId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Erro ao salvar TarefaKanban:", error);
      throw error;
    }
  }

  public async buscar(id: string, usuarioId?: string): Promise<TarefaKanban | null> {
    if (!usuarioId) return null;
    try {
      const [[result]] = await conexao.query<RowDataPacket[]>(
        `SELECT tarefa.* FROM TarefaKanban tarefa
         JOIN QuadroKanban quadro ON quadro.id = tarefa.quadroId
         JOIN Materia materia ON materia.id = quadro.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE tarefa.id = ? AND curso.usuarioId = ?`,
        [id, usuarioId]
      );

      if (!result) return null;

      return TarefaKanban.assemble({
        id: result.id.toString(),
        titulo: result.titulo,
        descricao: result.descricao,
        status: result.status,
        prioridade: result.prioridade,
        quadroId: result.quadroId,
      });
    } catch (error) {
      console.error("Erro ao buscar TarefaKanban:", error);
      throw error;
    }
  }

  public async atualizar(id: string, item: Partial<TarefaKanban>, usuarioId?: string): Promise<TarefaKanban | null> {
    if (!usuarioId) return null;
    try {
      const campos: string[] = [];
      const valores: any[] = [];

      if (item.titulo !== undefined) {
        campos.push("titulo = ?");
        valores.push(item.titulo);
      }

      if (item.descricao !== undefined) {
        campos.push("descricao = ?");
        valores.push(item.descricao);
      }

      if (item.status !== undefined) {
        campos.push("status = ?");
        valores.push(item.status);
      }

      if (item.prioridade !== undefined) {
        campos.push("prioridade = ?");
        valores.push(item.prioridade);
      }

      if (item.quadroId !== undefined) {
        campos.push("quadroId = ?");
        valores.push(item.quadroId);
      }

      if (campos.length === 0) return null;

      valores.push(id, usuarioId);
      const destinationCheck = item.quadroId !== undefined
        ? `AND EXISTS (SELECT 1 FROM QuadroKanban destino
                      JOIN Materia destinoMateria ON destinoMateria.id = destino.materiaId
                      JOIN Curso destinoCurso ON destinoCurso.id = destinoMateria.cursoId
                      WHERE destino.id = ? AND destinoCurso.usuarioId = ?)` : "";
      if (item.quadroId !== undefined) valores.push(item.quadroId, usuarioId);

      await conexao.query(
        `UPDATE TarefaKanban tarefa JOIN QuadroKanban quadro ON quadro.id = tarefa.quadroId
         JOIN Materia materia ON materia.id = quadro.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         SET ${campos.join(", ")} WHERE tarefa.id = ? AND curso.usuarioId = ? ${destinationCheck}`,
        valores
      );

      const atualizado = await this.buscar(id, usuarioId);
      if (item.quadroId !== undefined && atualizado?.quadroId !== item.quadroId) return null;
      return atualizado;
    } catch (error) {
      console.error("Erro ao atualizar TarefaKanban:", error);
      throw error;
    }
  }

  public async delete(id: string, usuarioId?: string): Promise<boolean> {
    if (!usuarioId) return false;
    try {
      const [result] = await conexao.query<any>(
        `DELETE tarefa FROM TarefaKanban tarefa
         JOIN QuadroKanban quadro ON quadro.id = tarefa.quadroId
         JOIN Materia materia ON materia.id = quadro.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE tarefa.id = ? AND curso.usuarioId = ?`, [id, usuarioId]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error("Erro ao deletar TarefaKanban:", error);
      throw error;
    }
  }

  public async listar(usuarioId?: string): Promise<TarefaKanban[] | null> {
    if (!usuarioId) return null;
    try {
      const [tarefas] = await conexao.query<RowDataPacket[]>(
        `SELECT tarefa.* FROM TarefaKanban tarefa
         JOIN QuadroKanban quadro ON quadro.id = tarefa.quadroId
         JOIN Materia materia ON materia.id = quadro.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId WHERE curso.usuarioId = ?`, [usuarioId]
      );

      if (tarefas.length === 0) return null;

      return tarefas.map((t) =>
        TarefaKanban.assemble({
          id: t.id.toString(),
          titulo: t.titulo,
          descricao: t.descricao,
          status: t.status,
          prioridade: t.prioridade,
          quadroId: t.quadroId,
        })
      );
    } catch (error) {
      console.error("Erro ao listar TarefasKanban:", error);
      throw error;
    }
  }
}
