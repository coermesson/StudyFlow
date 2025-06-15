import { RowDataPacket } from "mysql2";
import { UsuarioListarDto } from "../dto/Usuario.dto";
import { Usuario } from "../modelo/Usuario";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class UsuarioDao implements GenericDao<Usuario> {
  public async salvar(usuario: Usuario): Promise<boolean> {
    try {
      const { id, nome, email, senha } = usuario;
      await conexao.query(
        `INSERT INTO Usuario (id, nome, email, senha) VALUES (?, ?, ?, ?)`,
        [id, nome, email, senha]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  public async buscar(id: string): Promise<Usuario | null> {
    try {
      const [[result]] = await conexao.query<RowDataPacket[]>(
        `SELECT * FROM Usuario WHERE id = ?`,
        [id]
      );
      if (!result) return null;

      const { nome, email, senha } = result;
      return Usuario.assemble(id, nome, email, senha);
    } catch (error) {
      throw error;
    }
  }

  public async atualizar(id: string, item: Partial<Usuario>): Promise<Usuario | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (item["nome"] !== undefined) {
        fields.push("nome = ?");
        values.push(item["nome"]);
      }

      if (item["email"] !== undefined) {
        fields.push("email = ?");
        values.push(item["email"]);
      }

      if (item["senha"] !== undefined) {
        fields.push("senha = ?");
        values.push(item["senha"]);
      }

      if (fields.length === 0) return await this.buscar(id);

      values.push(id);
      await conexao.query(
        `UPDATE Usuario SET ${fields.join(", ")} WHERE id = ?`,
        values
      );

      return await this.buscar(id);
    } catch (error) {
      throw error;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await conexao.query(`DELETE FROM Usuario WHERE id = ?`, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  public async listar(): Promise<UsuarioListarDto[] | null> {
    try {
      const [usuarios] = await conexao.query<UsuarioListarDto[] & RowDataPacket[]>(
        `SELECT id, nome, email FROM Usuario`
      );
      return usuarios.length > 0 ? usuarios : null;
    } catch (error) {
      throw error;
    }
  }
}
