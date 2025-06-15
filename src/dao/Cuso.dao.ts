import { RowDataPacket } from "mysql2";
import { CursoListarDto } from "../dto/Curso.dto";
import { Curso } from "../modelo/Curso";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class CursoDao implements GenericDao<Curso> {
  public async salvar(curso: Curso): Promise<boolean> {
    try {
      const { id, nome, usuarioId } = curso;
      await conexao.query(
        'INSERT INTO Curso (id, nome, usuarioId) VALUES (?, ?, ?)',
        [id, nome, usuarioId]
      );
    } catch (error) {
      throw error;
    }
    return true;
  }

  public async buscar(id: string): Promise<Curso | null> {
    try {
      const [[result]] = await conexao.query<RowDataPacket[]>(
        'SELECT * FROM Curso WHERE id = ?',
        [id]
      );

      if (!result) {
        return null;
      }

      const { nome, usuarioId } = result;
      return Curso.assemble(id, nome, usuarioId);
    } catch (error) {
      throw error;
    }
  }

  public async atualizar(id: string, item: Partial<Curso>): Promise<Curso | null> {
    try {
      const campos = [];
      const valores = [];

      if (item.nome) {
        campos.push("nome = ?");
        valores.push(item.nome);
      }

      if (item.usuarioId !== undefined) {
        campos.push("usuarioId = ?");
        valores.push(item.usuarioId);
      }

      if (campos.length === 0) return null;

      valores.push(id);

      await conexao.query(
        `UPDATE Curso SET ${campos.join(", ")} WHERE id = ?`,
        valores
      );

      return this.buscar(id);
    } catch (error) {
      throw error;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await conexao.query('DELETE FROM Curso WHERE id = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  public async listar(): Promise<CursoListarDto[] | null> {
    try {
      const [cursosDto] = await conexao.query<CursoListarDto[] & RowDataPacket[]>(
        'SELECT id, nome, usuarioId FROM Curso'
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
