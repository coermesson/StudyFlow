import { QuadroKanbanControle } from "../controle/QuadroKanban.controle";
import { QuadroKanbanDao } from "../dao/QuadroKanban.dao";
import { QuadroKanbanServico } from "../servico/QuadroKanban.servico";
import { Api } from "./api";

export class QuadroKanbanApi {
  readonly quadroKanbanControle: QuadroKanbanControle;

  private constructor(readonly api: Api) {
    const dao = new QuadroKanbanDao();
    const servico = new QuadroKanbanServico(dao);
    this.quadroKanbanControle = new QuadroKanbanControle(servico);
  }

  public static build(api: Api) {
    const apiQuadro = new QuadroKanbanApi(api);
    apiQuadro.addRotas();
  }

  public addRotas() {
    this.api.addRota("/quadros-kanban", "POST", this.quadroKanbanControle.adicionar.bind(this.quadroKanbanControle));
    this.api.addRota("/quadros-kanban", "GET", this.quadroKanbanControle.listar.bind(this.quadroKanbanControle));
    this.api.addRota("/quadros-kanban/:id", "GET", this.quadroKanbanControle.buscar.bind(this.quadroKanbanControle));
    /*this.api.addRota("/quadros-kanban/:id", "PUT", this.quadroKanbanControle.atualizar.bind(this.quadroKanbanControle));*/
    this.api.addRota("/quadros-kanban/:id", "DELETE", this.quadroKanbanControle.deletar.bind(this.quadroKanbanControle));
  }
}
