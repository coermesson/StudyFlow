import { RowDataPacket } from "mysql2";
import { Arquivo, ArquivoProps } from "../modelo/Arquivo";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class ArquivoDao implements GenericDao<Arquivo> {
  public async salvar(arquivo: Arquivo): Promise<boolean> {
    try {
      await conexao.query(
        "INSERT INTO Arquivo (id, nome, materiaId) VALUES (?, ?, ?)",
        [arquivo.id, arquivo.nome, arquivo.materiaId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  public async buscar(id: string): Promise<Arquivo | null> {
    try {
      const [[result]] = await conexao.query<RowDataPacket[]>(
        "SELECT * FROM Arquivo WHERE id = ?",
        [id]
      );

      if (!result) return null;

      return Arquivo.assemble(result.id, result.nome, result.materiaId);
    } catch (error) {
      throw error;
    }
  }

  public async listar(): Promise<Arquivo[] | null> {
    try {
      const [resultados] = await conexao.query<RowDataPacket[]>(
        "SELECT * FROM Arquivo"
      );

      if (resultados.length === 0) return null;

      return resultados.map((r) =>
        Arquivo.assemble(r.id, r.nome, r.materiaId)
      );
    } catch (error) {
      throw error;
    }
  }

  public async atualizar(id: string, dados: Partial<ArquivoProps>): Promise<Arquivo | null> {
    try {
      const campos: string[] = [];
      const valores: any[] = [];

      if (dados.nome) {
        campos.push("nome = ?");
        valores.push(dados.nome);
      }

      if (dados.materiaId) {
        campos.push("materiaId = ?");
        valores.push(dados.materiaId);
      }

      if (campos.length === 0) return null;

      valores.push(id); // O ID é sempre o último

      await conexao.query(
        `UPDATE Arquivo SET ${campos.join(", ")} WHERE id = ?`,
        valores
      );

      return this.buscar(id);
    } catch (error) {
      throw error;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await conexao.query("DELETE FROM Arquivo WHERE id = ?", [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
}
