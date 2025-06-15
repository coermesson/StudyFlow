import { RowDataPacket } from "mysql2";
import { TarefaKanban } from "../modelo/TarefaKanban";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class TarefaKanbanDao implements GenericDao<TarefaKanban> {
  atualizar(id: string, item: Partial<TarefaKanban>): Promise<TarefaKanban | null> {
    throw new Error("Method not implemented.");
  }
  public async salvar(tarefa: TarefaKanban): Promise<boolean> {
    try {
      const { titulo, descricao, status, prioridade, quadroId } = tarefa;
      await conexao.query(
        'INSERT INTO TarefaKanban (titulo, descricao, status, prioridade, quadroId) VALUES (?, ?, ?, ?, ?)',
        [titulo, descricao, status, prioridade, quadroId]
      );
      return true;
    } catch (error) {
      console.error("Erro ao salvar TarefaKanban:", error);
      throw error;
    }
  }

  public async buscar(id: string): Promise<TarefaKanban | null> {
    try {
      const [[result]] = await conexao.query<RowDataPacket[]>(
        'SELECT * FROM TarefaKanban WHERE id = ?',
        [id]
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

  /*public async atualizar(id: string, item: Partial<TarefaKanban>): Promise<TarefaKanban | null> {
    try {
      const campos: string[] = [];
      const valores: any[] = [];

      if (item.titulo) {
        campos.push("titulo = ?");
        valores.push(item.titulo);
      }

      if (item.descricao) {
        campos.push("descricao = ?");
        valores.push(item.descricao);
      }

      if (item.status) {
        campos.push("status = ?");
        valores.push(item.status);
      }

      if (item.prioridade) {
        campos.push("prioridade = ?");
        valores.push(item.prioridade);
      }

      if (item.quadroId !== undefined) {
        campos.push("quadroId = ?");
        valores.push(item.quadroId);
      }

      if (campos.length === 0) return null;

      valores.push(id);

      await conexao.query(
        UPDATE TarefaKanban SET ${campos.join(", ")} WHERE id = ?,
        valores
      );

      return this.buscar(id);
    } catch (error) {
      console.error("Erro ao atualizar TarefaKanban:", error);
      throw error;
    }
  }*/

  public async delete(id: string): Promise<boolean> {
    try {
      await conexao.query('DELETE FROM TarefaKanban WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error("Erro ao deletar TarefaKanban:", error);
      throw error;
    }
  }

  public async listar(): Promise<TarefaKanban[] | null> {
    try {
      const [tarefas] = await conexao.query<RowDataPacket[]>(
        'SELECT * FROM TarefaKanban'
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