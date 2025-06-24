import { ItemToDoControle } from "../controle/ItemToDo.controle";
import { ItemToDoDao } from "../dao/ItemToDo.dao";
import { ItemToDoServico } from "../servico/ItemToDo.servico";
import { Api } from "./api";

export class ItemToDoApi {
    readonly itemToDoControle: ItemToDoControle;

    private constructor(readonly api: Api) {
        this.itemToDoControle = new ItemToDoControle(
            new ItemToDoServico(new ItemToDoDao())
        );
    }

    public static build(api: Api) {
        const itemToDoApi = new ItemToDoApi(api);
        itemToDoApi.addRotas();
    }

    public addRotas() {
        this.api.addRota("/itens", "POST", this.itemToDoControle.adicionar.bind(this.itemToDoControle));
        this.api.addRota("/itens", "GET", this.itemToDoControle.listar.bind(this.itemToDoControle));
        this.api.addRota("/itens/:id", "GET", this.itemToDoControle.buscar.bind(this.itemToDoControle));
        //this.api.addRota("/itens/:id", "DELETE", this.itemToDoControle.deletar.bind(this.itemToDoControle));
        // Adicione aqui mais rotas se necessário, como PUT, PATCH, etc.
    }
}