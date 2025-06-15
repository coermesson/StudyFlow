import { CursoDao } from "../dao/Cuso.dao";
import { CursoDtoCreate } from "../dto/Curso.dto";
import { Curso, CursoProps } from "../modelo/Curso";

export class CursoServico {
  public constructor(private cursoDao: CursoDao) {}

  public async salvar(dto: CursoDtoCreate): Promise<CursoProps> {
    const curso = Curso.build(dto);
    await this.cursoDao.salvar(curso);
    return curso.props; // props deve ser público ou ter um getter
  }

  public async buscar(id: string): Promise<CursoProps | null> {
    const curso = await this.cursoDao.buscar(id);
    return curso?.props ?? null;
  }

  public async listar(): Promise<CursoProps[] | null> {
    const cursos = await this.cursoDao.listar();
    return cursos?.map(c => c.props) ?? null;
  }

  public async atualizar(id: string, dados: Partial<CursoProps>): Promise<CursoProps | null> {
    const curso = await this.cursoDao.atualizar(id, dados);
    return curso?.props ?? null;
  }

  public async deletar(id: string): Promise<boolean> {
    return this.cursoDao.delete(id);
  }
}

