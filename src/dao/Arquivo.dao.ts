import { ResultSetHeader, RowDataPacket } from "mysql2";
import { Arquivo, ArquivoProps } from "../modelo/Arquivo";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

export class ArquivoDao implements GenericDao<Arquivo> {
  public async listarIdsPorMateria(materiaId: string, usuarioId: string): Promise<string[]> {
    const [rows] = await conexao.query<RowDataPacket[]>(
      `SELECT arquivo.id FROM Arquivo arquivo
       JOIN Materia materia ON materia.id = arquivo.materiaId
       JOIN Curso curso ON curso.id = materia.cursoId
       WHERE materia.id = ? AND curso.usuarioId = ?`,
      [materiaId, usuarioId]
    );
    return rows.map((row) => row.id);
  }

  public async listarIdsPorCurso(cursoId: string, usuarioId: string): Promise<string[]> {
    const [rows] = await conexao.query<RowDataPacket[]>(
      `SELECT arquivo.id FROM Arquivo arquivo
       JOIN Materia materia ON materia.id = arquivo.materiaId
       JOIN Curso curso ON curso.id = materia.cursoId
       WHERE curso.id = ? AND curso.usuarioId = ?`,
      [cursoId, usuarioId]
    );
    return rows.map((row) => row.id);
  }

  public async listarIdsPorUsuario(usuarioId: string): Promise<string[]> {
    const [rows] = await conexao.query<RowDataPacket[]>(
      `SELECT arquivo.id FROM Arquivo arquivo
       JOIN Materia materia ON materia.id = arquivo.materiaId
       JOIN Curso curso ON curso.id = materia.cursoId
       WHERE curso.usuarioId = ?`,
      [usuarioId]
    );
    return rows.map((row) => row.id);
  }

  public async salvar(arquivo: Arquivo, usuarioId?: string): Promise<boolean> {
    if (!usuarioId) return false;
    try {
      const [result] = await conexao.query<ResultSetHeader>(
        `INSERT INTO Arquivo (id, nome, materiaId)
         SELECT ?, ?, materia.id FROM Materia materia
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE materia.id = ? AND curso.usuarioId = ?`,
        [arquivo.id, arquivo.nome, arquivo.materiaId, usuarioId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  public async buscar(id: string, usuarioId?: string): Promise<Arquivo | null> {
    if (!usuarioId) return null;
    try {
      const [[result]] = await conexao.query<RowDataPacket[]>(
        `SELECT arquivo.* FROM Arquivo arquivo
         JOIN Materia materia ON materia.id = arquivo.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE arquivo.id = ? AND curso.usuarioId = ?`,
        [id, usuarioId]
      );

      if (!result) return null;

      return Arquivo.assemble(result.id, result.nome, result.materiaId);
    } catch (error) {
      throw error;
    }
  }

  public async listar(usuarioId?: string): Promise<Arquivo[] | null> {
    if (!usuarioId) return null;
    try {
      const [resultados] = await conexao.query<RowDataPacket[]>(
        `SELECT arquivo.* FROM Arquivo arquivo
         JOIN Materia materia ON materia.id = arquivo.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE curso.usuarioId = ?`,
        [usuarioId]
      );

      if (resultados.length === 0) return null;

      return resultados.map((r) =>
        Arquivo.assemble(r.id, r.nome, r.materiaId)
      );
    } catch (error) {
      throw error;
    }
  }

  public async atualizar(id: string, dados: Partial<ArquivoProps>, usuarioId?: string): Promise<Arquivo | null> {
    if (!usuarioId) return null;
    try {
      const campos: string[] = [];
      const valores: any[] = [];

      if (dados.nome !== undefined) {
        campos.push("arquivo.nome = ?");
        valores.push(dados.nome);
      }

      if (dados.materiaId !== undefined) {
        campos.push("arquivo.materiaId = ?");
        valores.push(dados.materiaId);
      }

      if (campos.length === 0) return null;

      valores.push(id, usuarioId);
      const destinationCheck = dados.materiaId !== undefined
        ? `AND EXISTS (SELECT 1 FROM Materia destino
                       JOIN Curso destinoCurso ON destinoCurso.id = destino.cursoId
                       WHERE destino.id = ? AND destinoCurso.usuarioId = ?)`
        : "";
      if (dados.materiaId !== undefined) valores.push(dados.materiaId, usuarioId);

      await conexao.query(
        `UPDATE Arquivo arquivo
         JOIN Materia materia ON materia.id = arquivo.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         SET ${campos.join(", ")}
         WHERE arquivo.id = ? AND curso.usuarioId = ? ${destinationCheck}`,
        valores
      );

      const arquivo = await this.buscar(id, usuarioId);
      if (dados.materiaId !== undefined && arquivo?.materiaId !== dados.materiaId) return null;
      return arquivo;
    } catch (error) {
      throw error;
    }
  }

  public async delete(id: string, usuarioId?: string): Promise<boolean> {
    if (!usuarioId) return false;
    try {
      const [result] = await conexao.query<ResultSetHeader>(
        `DELETE arquivo FROM Arquivo arquivo
         JOIN Materia materia ON materia.id = arquivo.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE arquivo.id = ? AND curso.usuarioId = ?`,
        [id, usuarioId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}
