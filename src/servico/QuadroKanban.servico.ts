import { QuadroKanbanDao } from "../dao/QuadroKanban.dao";
import { QuadroKanbanDtoCreate } from "../dto/QuadroKanban.dto";
import { QuadroKanban, QuadroKanbanProps } from "../modelo/QuadroKanban";

export class QuadroKanbanServico {
  constructor(private quadroDao: QuadroKanbanDao) {}

  public async salvar(dto: QuadroKanbanDtoCreate, usuarioId: string): Promise<QuadroKanbanProps | null> {
    const quadro = QuadroKanban.build(dto);
    const salvo = await this.quadroDao.salvar(quadro, usuarioId);
    if (!salvo) return null;
    return quadro.props;
  }

  public async buscar(id: string, usuarioId: string): Promise<QuadroKanbanProps | null> {
    const quadro = await this.quadroDao.buscar(id, usuarioId);
    return quadro?.props ?? null;
  }

  public async listar(usuarioId: string): Promise<QuadroKanbanProps[] | null> {
    const quadros = await this.quadroDao.listar(usuarioId);
    return quadros?.map(q => q.props) ?? null;
  }

  public async atualizar(id: string, dados: Partial<QuadroKanbanProps>, usuarioId: string): Promise<QuadroKanbanProps | null> {
    const quadro = await this.quadroDao.atualizar(id, dados, usuarioId);
    return quadro?.props ?? null;
  }

  public async deletar(id: string, usuarioId: string): Promise<boolean> {
    return this.quadroDao.delete(id, usuarioId);
  }
}
