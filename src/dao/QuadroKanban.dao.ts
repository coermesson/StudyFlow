import { RowDataPacket } from "mysql2";
import { QuadroKanban } from "../modelo/QuadroKanban";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class QuadroKanbanDao implements GenericDao<QuadroKanban> {
  atualizar(id: string, item: Partial<QuadroKanban>): Promise<QuadroKanban | null> {
    throw new Error("Method not implemented.");
  }
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
        id: result.id.toString(), // convertendo para string por causa do model
        nome,
        materiaId,
      });
    } catch (error) {
      console.error("Erro ao buscar QuadroKanban:", error);
      throw error;
    }
  }

  /*public async atualizar(id: string, item: Partial<QuadroKanban>): Promise<QuadroKanban | null> {
    try {
      const campos: string[] = [];
      const valores: any[] = [];

      if (item.nome) {
        campos.push("nome = ?");
        valores.push(item.nome);
      }

      if (item.materiaId !== undefined) {
        campos.push("materiaId = ?");
        valores.push(item.materiaId);
      }

      if (campos.length === 0) return null;

      valores.push(id);

      await conexao.query(
        UPDATE QuadroKanban SET ${campos.join(", ")} WHERE id = ?,
        valores
      );

      return this.buscar(id);
    } catch (error) {
      console.error("Erro ao atualizar QuadroKanban:", error);
      throw error;
    }
  }*/

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