import { ResultSetHeader, RowDataPacket } from "mysql2";
import { UsuarioListarDto } from "../dto/Usuario.dto";
import { Usuario } from "../modelo/Usuario";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class UsuarioDao implements GenericDao<Usuario> {
  public async salvar(usuario: Usuario): Promise<boolean> {
    try {
      const { id, nome, email, senhaHash } = usuario;
      await conexao.query(
        `INSERT INTO Usuario (id, nome, email, senha) VALUES (?, ?, ?, ?)`,
        [id, nome, email, senhaHash]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  public async buscar(id: string, usuarioId?: string): Promise<Usuario | null> {
    if (!usuarioId) return null;
    try {
      const [[result]] = await conexao.query<RowDataPacket[]>(
        `SELECT * FROM Usuario WHERE id = ? AND id = ?`,
        [id, usuarioId]
      );
      if (!result) return null;

      const { nome, email, senha } = result;
      return Usuario.assemble(id, nome, email, senha);
    } catch (error) {
      throw error;
    }
  }

  public async buscarPorEmail(email: string): Promise<Usuario | null> {
    try {
      const [[result]] = await conexao.query<RowDataPacket[]>(
        `SELECT * FROM Usuario WHERE email = ?`,
        [email]
      );
      if (!result) return null;

      return Usuario.assemble(result.id, result.nome, result.email, result.senha);
    } catch (error) {
      throw error;
    }
  }

  public async atualizar(id: string, item: Partial<Usuario>, usuarioId?: string): Promise<Usuario | null> {
    if (!usuarioId) return null;
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

      if (item["senhaHash"] !== undefined) {
        fields.push("senha = ?");
        values.push(item["senhaHash"]);
      }

      if (fields.length === 0) return await this.buscar(id, usuarioId);

      values.push(id, usuarioId);
      await conexao.query(
        `UPDATE Usuario SET ${fields.join(", ")} WHERE id = ? AND id = ?`,
        values
      );

      return await this.buscar(id, usuarioId);
    } catch (error) {
      throw error;
    }
  }

  public async delete(id: string, usuarioId?: string): Promise<boolean> {
    if (!usuarioId) return false;
    try {
      const [resultado] = await conexao.query<ResultSetHeader>(
        `DELETE FROM Usuario WHERE id = ? AND id = ?`,
        [id, usuarioId]
      );
      return resultado.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  public async listar(usuarioId?: string): Promise<UsuarioListarDto[] | null> {
    if (!usuarioId) return null;
    try {
      const [usuarios] = await conexao.query<UsuarioListarDto[] & RowDataPacket[]>(
        `SELECT id, nome, email FROM Usuario WHERE id = ?`,
        [usuarioId]
      );
      return usuarios.length > 0 ? usuarios : null;
    } catch (error) {
      throw error;
    }
  }
}
