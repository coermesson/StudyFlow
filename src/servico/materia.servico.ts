import { MateriaDao } from "../dao/Materia.dao";
import { MateriaDtoCreate } from "../dto/Materia.dto";
import { Materia, MateriaProps } from "../modelo/Materia";

export class MateriaServico {
  public constructor(private materiaDao: MateriaDao) {}

  public async salvar(dto: MateriaDtoCreate): Promise<MateriaProps> {
    const materia = Materia.build(dto);
    await this.materiaDao.salvar(materia);
    return materia.props;
  }

  public async buscar(id: string): Promise<MateriaProps | null> {
    const materia = await this.materiaDao.buscar(id);
    return materia?.props ?? null;
  }

  public async listar(): Promise<MateriaProps[] | null> {
    const materias = await this.materiaDao.listar();
    return materias?.map(m => m.props) ?? null;
  }

  public async atualizar(id: string, dados: Partial<MateriaProps>): Promise<MateriaProps | null> {
    const materia = await this.materiaDao.atualizar(id, dados);
    return materia?.props ?? null;
  }

  public async deletar(id: string): Promise<boolean> {
    return this.materiaDao.delete(id);
  }
}
