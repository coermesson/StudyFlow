import { ResultSetHeader, RowDataPacket } from "mysql2";
import { CursoListarDto } from "../dto/Curso.dto";
import { Curso } from "../modelo/Curso";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class CursoDao implements GenericDao<Curso> {
  public async salvar(curso: Curso, usuarioId?: string): Promise<boolean> {
    if (!usuarioId) return false;
    try {
      const { id, nome } = curso;
      const [result] = await conexao.query<ResultSetHeader>(
        `INSERT INTO Curso (id, nome, usuarioId)
         SELECT ?, ?, usuario.id FROM Usuario usuario WHERE usuario.id = ?`,
        [id, nome, usuarioId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  public async buscar(id: string, usuarioId?: string): Promise<Curso | null> {
    if (!usuarioId) return null;
    try {
      const [[result]] = await conexao.query<RowDataPacket[]>(
        'SELECT * FROM Curso WHERE id = ? AND usuarioId = ?',
        [id, usuarioId]
      );

      if (!result) {
        return null;
      }

      const { nome, usuarioId: ownerId } = result;
      return Curso.assemble(id, nome, ownerId);
    } catch (error) {
      throw error;
    }
  }

  public async atualizar(id: string, item: Partial<Curso>, usuarioId?: string): Promise<Curso | null> {
    if (!usuarioId) return null;
    try {
      const campos = [];
      const valores = [];

      if (item.nome) {
        campos.push("nome = ?");
        valores.push(item.nome);
      }

      if (campos.length === 0) return this.buscar(id, usuarioId);

      valores.push(id);

      await conexao.query(
        `UPDATE Curso SET ${campos.join(", ")} WHERE id = ? AND usuarioId = ?`,
        [...valores, usuarioId]
      );

      return this.buscar(id, usuarioId);
    } catch (error) {
      throw error;
    }
  }

  public async delete(id: string, usuarioId?: string): Promise<boolean> {
    if (!usuarioId) return false;
    try {
      const [result] = await conexao.query<ResultSetHeader>(
        'DELETE FROM curso WHERE id = ? AND usuarioId = ?',
        [id, usuarioId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  public async listar(usuarioId?: string): Promise<CursoListarDto[] | null> {
    if (!usuarioId) return null;
    try {
      const [cursosDto] = await conexao.query<CursoListarDto[] & RowDataPacket[]>(
        'SELECT id, nome, usuarioId FROM Curso WHERE usuarioId = ?',
        [usuarioId]
      );
      if (cursosDto.length === 0) {
        return null;
      }

      return cursosDto;
    } catch (error) {
      console.error('Erro ao listar cursos:', error);
      throw error;
    }
  }
}
