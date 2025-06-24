// src/dao/Materia.dao.ts

import { RowDataPacket } from "mysql2";
import { MateriaListarDto } from "../dto/Materia.dto"; // Importa o DTO corrigido
import { Materia } from "../modelo/Materia"; // Assumindo que Materia é seu modelo de domínio
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

// 1. Interface para o formato EXATO dos dados que vêm do banco de dados
// Isso é crucial porque o banco retorna 'curso_id' (snake_case).
interface MateriaDBRow extends RowDataPacket {
  id: string;
  nome: string;
  curso_id: number; // <- Nome da coluna do banco de dados
}

type MateriaUpdate = {
  nome?: string;
  cursoId?: number;
};

export class MateriaDao implements GenericDao<Materia> {
  public async salvar(materia: Materia): Promise<boolean> {
    try {
      const { nome, cursoId } = materia;
      await conexao.query(
        `INSERT INTO Materia (nome, curso_id) VALUES (?, ?)`,
        [nome, cursoId]
      );
      return true;
    } catch (error) {
      throw error;
    }
  }

  public async buscar(id: string): Promise<Materia | null> {
    try {
      // Use MateriaDBRow[] para tipar o resultado da busca no banco
      const [[result]] = await conexao.query<MateriaDBRow[]>(
        `SELECT * FROM Materia WHERE id = ?`,
        [id]
      );
      if (!result) return null;

      const { nome, curso_id } = result;
      // Certifique-se de que Materia.assemble aceita curso_id
      return Materia.assemble(id, nome, curso_id);
    } catch (error) {
      throw error;
    }
  }

  public async atualizar(id: string, item: MateriaUpdate): Promise<Materia | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (item.nome !== undefined) {
        fields.push("nome = ?");
        values.push(item.nome);
      }

      if (item.cursoId !== undefined) {
        fields.push("curso_id = ?"); // Use 'curso_id' para o banco de dados
        values.push(item.cursoId);
      }

      if (fields.length === 0) {
        return await this.buscar(id);
      }

      values.push(id);
      await conexao.query(
        `UPDATE Materia SET ${fields.join(", ")} WHERE id = ?`,
        values
      );

      return await this.buscar(id);
    } catch (error) {
      throw error;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await conexao.query(`DELETE FROM Materia WHERE id = ?`, [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }

  // O método listar() corrigido e robusto
  public async listar(): Promise<MateriaListarDto[] | null> {
    try {
      // 2. A consulta agora é tipada com MateriaDBRow[], pois é o que realmente vem do DB.
      const [materias] = await conexao.query<MateriaDBRow[]>(
        `SELECT id, nome, curso_id FROM Materia`
      );

      if (!materias || materias.length === 0) return null;

      // 3. O mapeamento faz a conversão de MateriaDBRow (curso_id) para MateriaListarDto (cursoId).
      // Agora, 'm' é do tipo MateriaDBRow, então 'm.curso_id' é reconhecido e o objeto final
      // corresponde *exatamente* a MateriaListarDto.
      const materiasConvertidas: MateriaListarDto[] = materias.map(m => ({
        id: m.id,
        nome: m.nome,
        cursoId: m.curso_id, // Acesso direto e seguro, sem 'as any'
      }));

      return materiasConvertidas;
    } catch (error) {
      throw error;
    }
  }
}