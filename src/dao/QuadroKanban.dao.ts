import { RowDataPacket } from "mysql2";
import { QuadroKanban } from "../modelo/QuadroKanban";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class QuadroKanbanDao implements GenericDao<QuadroKanban> {

  public async salvar(quadro: QuadroKanban): Promise<boolean> {
    try {
      const { nome, materiaId } = quadro;
      await conexao.query(
        'INSERT INTO QuadroKanban (nome, materiaId) VALUES (?, ?)',
        [nome, materiaId]
      );
      return true;
    } catch (error) {
      console.error("Erro ao salvar QuadroKanban:", error);
      throw error;
    }
  }

  public async buscar(id: string): Promise<QuadroKanban | null> {
    try {
      const [[result]] = await conexao.query<RowDataPacket[]>(
        'SELECT * FROM QuadroKanban WHERE id = ?',
        [id]
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

  public async atualizar(id: string, item: Partial<QuadroKanban>): Promise<QuadroKanban | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (item.nome !== undefined) {
        fields.push("nome = ?");
        values.push(item.nome);
      }

      if (item.materiaId !== undefined) {
        fields.push("materiaId = ?");
        values.push(item.materiaId);
      }

      if (fields.length === 0) {
        return await this.buscar(id);
      }

      values.push(id);
      await conexao.query(
        `UPDATE QuadroKanban SET ${fields.join(", ")} WHERE id = ?`,
        values
      );

      return await this.buscar(id);
    } catch (error) {
      console.error("Erro ao atualizar QuadroKanban:", error);
      throw error;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await conexao.query('DELETE FROM QuadroKanban WHERE id = ?', [id]);
      return true;
    } catch (error) {
      console.error("Erro ao deletar QuadroKanban:", error);
      throw error;
    }
  }

  public async listar(): Promise<QuadroKanban[] | null> {
    try {
      const [quadros] = await conexao.query<RowDataPacket[]>(
        'SELECT * FROM QuadroKanban'
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