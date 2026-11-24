import { CursoDao } from "../dao/Cuso.dao";
import { ArquivoDao } from "../dao/Arquivo.dao";
import { CursoDtoCreate } from "../dto/Curso.dto";
import { Curso, CursoProps } from "../modelo/Curso";
import { arquivoArmazenamento } from "../util/arquivoArmazenamento";

export class CursoServico {
  public constructor(private cursoDao: CursoDao, private arquivoDao = new ArquivoDao()) {}

  public async salvar(dto: CursoDtoCreate, usuarioId: string): Promise<CursoProps | null> {
    const curso = Curso.build({ ...dto, usuarioId });
    const salvo = await this.cursoDao.salvar(curso, usuarioId);
    if (!salvo) return null;
    return curso.props; 
  }

  public async buscar(id: string, usuarioId: string): Promise<CursoProps | null> {
    const curso = await this.cursoDao.buscar(id, usuarioId);
    return curso?.props ?? null;
  }

  public async listar(usuarioId: string): Promise<CursoProps[] | null> {
    const cursos = await this.cursoDao.listar(usuarioId);
    return cursos?.map(c => ({ id: c.id, nome: c.nome, usuarioId: c.usuarioId })) ?? null;
  }

  public async atualizar(id: string, dados: Partial<CursoProps>, usuarioId: string): Promise<CursoProps | null> {
    const curso = await this.cursoDao.atualizar(id, dados, usuarioId);
    return curso?.props ?? null;
  }

  public async deletar(id: string, usuarioId: string): Promise<boolean> {
    const arquivos = await this.arquivoDao.listarIdsPorCurso(id, usuarioId);
    const deletado = await this.cursoDao.delete(id, usuarioId);
    if (deletado) await arquivoArmazenamento.remover(arquivos);
    return deletado;
  }
}

