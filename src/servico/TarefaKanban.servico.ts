import { TarefaKanbanDao } from "../dao/TarefaKanban.dao";
import { TarefaKanbanDtoCreate } from "../dto/TarefaKanban.dto";
import { TarefaKanban, TarefaKanbanProps } from "../modelo/TarefaKanban";

export class TarefaKanbanServico {
    public constructor(private tarefaDao: TarefaKanbanDao) { }

    public async salvar(dto: TarefaKanbanDtoCreate): Promise<TarefaKanbanProps> {
        const tarefa = TarefaKanban.build(dto);
        await this.tarefaDao.salvar(tarefa);
        return tarefa.props;
    }

    public async buscar(id: string): Promise<TarefaKanbanProps | null> {
        const tarefa = await this.tarefaDao.buscar(id);
        return tarefa?.props ?? null;
    }

    public async listar(): Promise<TarefaKanbanProps[] | null> {
        const tarefas = await this.tarefaDao.listar();
        return tarefas?.map(t => t.props) ?? null;
    }

    public async atualizar(id: string, dados: Partial<TarefaKanbanProps>): Promise<TarefaKanbanProps | null> {
        const tarefa = await this.tarefaDao.atualizar(id, dados);
        return tarefa?.props ?? null;
    }

    public async deletar(id: string): Promise<boolean> {
        return this.tarefaDao.delete(id);
    }
}