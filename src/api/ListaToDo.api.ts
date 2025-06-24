import { ListaToDoControle } from "../controle/ListaToDo.controle";
import { ListaToDoDao } from "../dao/ListaToDo.dao";
import { ListaToDoServico } from "../servico/ListaToDo.servico";
import { Api } from "./api";

export class ListaToDoApi {
    readonly listaToDoControle: ListaToDoControle;

    private constructor(readonly api: Api) {
        this.listaToDoControle = new ListaToDoControle(
            new ListaToDoServico(new ListaToDoDao())
        );
    }

    public static build(api: Api) {
        const listaToDoApi = new ListaToDoApi(api);
        listaToDoApi.addRotas();
    }

    public addRotas() {
        this.api.addRota("/listas", "POST", this.listaToDoControle.adicionar.bind(this.listaToDoControle));
        this.api.addRota("/listas", "GET", this.listaToDoControle.listar.bind(this.listaToDoControle));
        this.api.addRota("/listas/:id", "GET", this.listaToDoControle.buscar.bind(this.listaToDoControle));
    }
}