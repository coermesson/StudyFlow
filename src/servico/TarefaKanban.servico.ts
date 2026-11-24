import { TarefaKanbanDao } from "../dao/TarefaKanban.dao";
import { TarefaKanbanDtoCreate } from "../dto/TarefaKanban.dto";
import { TarefaKanban, TarefaKanbanProps } from "../modelo/TarefaKanban";

export class TarefaKanbanServico {
    public constructor(private tarefaDao: TarefaKanbanDao) { }

    public async salvar(dto: TarefaKanbanDtoCreate, usuarioId: string): Promise<TarefaKanbanProps | null> {
        const tarefa = TarefaKanban.build(dto);
        const salva = await this.tarefaDao.salvar(tarefa, usuarioId);
        if (!salva) return null;
        return tarefa.props;
    }

    public async buscar(id: string, usuarioId: string): Promise<TarefaKanbanProps | null> {
        const tarefa = await this.tarefaDao.buscar(id, usuarioId);
        return tarefa?.props ?? null;
    }

    public async listar(usuarioId: string): Promise<TarefaKanbanProps[] | null> {
        const tarefas = await this.tarefaDao.listar(usuarioId);
        return tarefas?.map(t => t.props) ?? null;
    }

    public async atualizar(id: string, dados: Partial<TarefaKanbanProps>, usuarioId: string): Promise<TarefaKanbanProps | null> {
        const tarefa = await this.tarefaDao.atualizar(id, dados, usuarioId);
        return tarefa?.props ?? null;
    }

    public async deletar(id: string, usuarioId: string): Promise<boolean> {
        return this.tarefaDao.delete(id, usuarioId);
    }
}
