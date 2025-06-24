import { MateriaDao } from "../dao/Materia.dao";
// Importe MateriaListarDto aqui, pois será o tipo de retorno do listar
import { MateriaDtoCreate, MateriaListarDto } from "../dto/Materia.dto";
// Assumindo que Materia e MateriaProps são o seu modelo de domínio
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

  /**
   * Lista todas as matérias.
   * Retorna um array de MateriaListarDto ou null se não houver matérias.
   */
  public async listar(): Promise<MateriaListarDto[] | null> { // <--- ALTEÇÃO AQUI NO TIPO DE RETORNO
    const materias = await this.materiaDao.listar(); // Isso já retorna MateriaListarDto[] | null
    return materias; // <--- ALTEÇÃO AQUI: Retorne diretamente o resultado, pois MateriaListarDto não tem 'props'
  }

  public async atualizar(id: string, dados: Partial<MateriaProps>): Promise<MateriaProps | null> {
    const materia = await this.materiaDao.atualizar(id, dados);
    return materia?.props ?? null;
  }

  public async deletar(id: string): Promise<boolean> {
    return this.materiaDao.delete(id);
  }
}