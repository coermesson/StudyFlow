import { RowDataPacket } from "mysql2";
import { MateriaListarDto } from "../dto/Materia.dto";
import { Materia } from "../modelo/Materia";
import conexao from "../util/conexao";
import { GenericDao } from "./Generic.dao";

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
      const [[result]] = await conexao.query<RowDataPacket[]>(
        `SELECT * FROM Materia WHERE id = ?`,
        [id]
      );
      if (!result) return null;

      const { nome, curso_id } = result;
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
        fields.push("curso_id = ?");
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

  public async listar(): Promise<MateriaListarDto[] | null> {
    try {
      const [materias] = await conexao.query<MateriaListarDto[] & RowDataPacket[]>(
        `SELECT id, nome, curso_id FROM Materia`
      );

      // Aqui convertendo curso_id para cursoId para o DTO
      if (!materias || materias.length === 0) return null;

      const materiasConvertidas = materias.map(m => ({
        id: m.id,
        nome: m.nome,
        cursoId: (m as any).curso_id, // cast para acessar a propriedade curso_id
      }));

      return materiasConvertidas;
    } catch (error) {
      throw error;
    }
  }
}
