import { QuadroKanbanDao } from "../dao/QuadroKanban.dao";
import { QuadroKanbanDtoCreate } from "../dto/QuadroKanban.dto";
import { QuadroKanban, QuadroKanbanProps } from "../modelo/QuadroKanban";

export class QuadroKanbanServico {
    public constructor(private quadroDao: QuadroKanbanDao) { }

    public async salvar(dto: QuadroKanbanDtoCreate): Promise<QuadroKanbanProps> {
        const quadro = QuadroKanban.build(dto);
        await this.quadroDao.salvar(quadro);
        return quadro.props;
    }

    public async buscar(id: string): Promise<QuadroKanbanProps | null> {
        const quadro = await this.quadroDao.buscar(id);
        return quadro?.props ?? null;
    }

    public async listar(): Promise<QuadroKanbanProps[] | null> {
        const quadros = await this.quadroDao.listar();
        return quadros?.map(q => q.props) ?? null;
    }

    public async atualizar(id: string, dados: Partial<QuadroKanbanProps>): Promise<QuadroKanbanProps | null> {
        const quadro = await this.quadroDao.atualizar(id, dados);
        return quadro?.props ?? null;
    }

    public async deletar(id: string): Promise<boolean> {
        return this.quadroDao.delete(id);
    }
}