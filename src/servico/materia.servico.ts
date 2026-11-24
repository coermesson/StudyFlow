import { MateriaDao } from "../dao/Materia.dao";
import { ArquivoDao } from "../dao/Arquivo.dao";

import { MateriaDtoCreate, MateriaListarDto } from "../dto/Materia.dto";

import { Materia, MateriaProps } from "../modelo/Materia";
import { arquivoArmazenamento } from "../util/arquivoArmazenamento";

export class MateriaServico {
  public constructor(private materiaDao: MateriaDao, private arquivoDao = new ArquivoDao()) {}

  public async salvar(dto: MateriaDtoCreate, usuarioId: string): Promise<MateriaProps | null> {
    const materia = Materia.build(dto);
    const salva = await this.materiaDao.salvar(materia, usuarioId);
    if (!salva) return null;
    return materia.props;
  }

  public async buscar(id: string, usuarioId: string): Promise<MateriaProps | null> {
    const materia = await this.materiaDao.buscar(id, usuarioId);
    return materia?.props ?? null;
  }

  
  public async listar(usuarioId: string): Promise<MateriaListarDto[] | null> {
    const materias = await this.materiaDao.listar(usuarioId);
    return materias;
  }

  public async atualizar(id: string, dados: Partial<MateriaProps>, usuarioId: string): Promise<MateriaProps | null> {
    const materia = await this.materiaDao.atualizar(id, dados, usuarioId);
    return materia?.props ?? null;
  }

  public async deletar(id: string, usuarioId: string): Promise<boolean> {
    const arquivos = await this.arquivoDao.listarIdsPorMateria(id, usuarioId);
    const deletada = await this.materiaDao.delete(id, usuarioId);
    if (deletada) await arquivoArmazenamento.remover(arquivos);
    return deletada;
  }
}
