import { TarefaKanbanControle } from "../controle/TarefaKaban.controle";
import { Api } from "./api";

export class TarefaKanbanApi {
    readonly tarefaControle: TarefaKanbanControle;

    private constructor(readonly api: Api) {
        this.tarefaControle = new TarefaKanbanControle();
    }

    public static build(api: Api) {
        const apiTarefa = new TarefaKanbanApi(api);
        apiTarefa.addRotas();
    }

    public addRotas() {
        this.api.addRota("/tarefa", "POST", this.tarefaControle.adicionar.bind(this.tarefaControle));
        this.api.addRota("/tarefa", "GET", this.tarefaControle.listar.bind(this.tarefaControle));
        this.api.addRota("/tarefa/:id", "GET", this.tarefaControle.buscar.bind(this.tarefaControle));
        this.api.addRota("/tarefa/:id", "DELETE", this.tarefaControle.deletar.bind(this.tarefaControle));
    }
}