// src/dao/Materia.dao.ts

import { ResultSetHeader, RowDataPacket } from "mysql2";
import { MateriaListarDto } from "../dto/Materia.dto";
import { Materia } from "../modelo/Materia";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";


interface MateriaDBRow extends RowDataPacket {
  id: string;
  nome: string;
  cursoId: string;
}

type MateriaUpdate = {
  nome?: string;
  cursoId?: string;
};

export class MateriaDao implements GenericDao<Materia> {
  public async salvar(materia: Materia, usuarioId?: string): Promise<boolean> {
    if (!usuarioId) return false;
    try {
      const { id, nome, cursoId } = materia;
      const [result] = await conexao.query<ResultSetHeader>(
        `INSERT INTO Materia (id, nome, cursoId)
         SELECT ?, ?, curso.id FROM Curso curso
         WHERE curso.id = ? AND curso.usuarioId = ?`,
        [id, nome, cursoId, usuarioId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }

  public async buscar(id: string, usuarioId?: string): Promise<Materia | null> {
    if (!usuarioId) return null;
    try {
    
      const [[result]] = await conexao.query<MateriaDBRow[]>(
        `SELECT materia.* FROM Materia materia
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE materia.id = ? AND curso.usuarioId = ?`,
        [id, usuarioId]
      );
      if (!result) return null;

      const { nome, cursoId } = result;

      return Materia.assemble(id, nome, cursoId);
    } catch (error) {
      throw error;
    }
  }

  public async atualizar(id: string, item: MateriaUpdate, usuarioId?: string): Promise<Materia | null> {
    if (!usuarioId) return null;
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (item.nome !== undefined) {
        fields.push("materia.nome = ?");
        values.push(item.nome);
      }

      if (item.cursoId !== undefined) {
        fields.push("materia.cursoId = ?");
        values.push(item.cursoId);
      }

      if (fields.length === 0) {
        return await this.buscar(id, usuarioId);
      }

      values.push(id, usuarioId);
      const destinationCheck = item.cursoId !== undefined
        ? "AND EXISTS (SELECT 1 FROM Curso destino WHERE destino.id = ? AND destino.usuarioId = ?)"
        : "";
      if (item.cursoId !== undefined) values.push(item.cursoId, usuarioId);
      await conexao.query(
        `UPDATE Materia materia JOIN Curso curso ON curso.id = materia.cursoId
         SET ${fields.join(", ")}
         WHERE materia.id = ? AND curso.usuarioId = ? ${destinationCheck}`,
        values
      );

      const materia = await this.buscar(id, usuarioId);
      if (item.cursoId !== undefined && materia?.cursoId !== item.cursoId) return null;
      return materia;
    } catch (error) {
      throw error;
    }
  }

  public async delete(id: string, usuarioId?: string): Promise<boolean> {
    if (!usuarioId) return false;
    try {
      const [result] = await conexao.query<ResultSetHeader>(
        `DELETE materia FROM Materia materia
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE materia.id = ? AND curso.usuarioId = ?`,
        [id, usuarioId]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }


  public async listar(usuarioId?: string): Promise<MateriaListarDto[] | null> {
    if (!usuarioId) return null;
    try {

      const [materias] = await conexao.query<MateriaDBRow[]>(
        `SELECT materia.id, materia.nome, materia.cursoId FROM Materia materia
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE curso.usuarioId = ?`,
        [usuarioId]
      );

      if (!materias || materias.length === 0) return null;


      const materiasConvertidas: MateriaListarDto[] = materias.map(m => ({
        id: m.id,
        nome: m.nome,
        cursoId: m.cursoId,
      }));

      return materiasConvertidas;
    } catch (error) {
      throw error;
    }
  }
}
