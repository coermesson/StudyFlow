import { MateriaController } from "../controle/Materia.controle";
import { MateriaDao } from "../dao/Materia.dao";
import { MateriaServico } from "../servico/materia.servico";
import { Api } from "./api";

export class MateriaApi {
    readonly materiaControle: MateriaController;

    private constructor(readonly api: Api) {
        this.materiaControle = new MateriaController(new MateriaServico(new MateriaDao()));
    }

    public static build(api: Api) {
        const materiaApi = new MateriaApi(api);
        materiaApi.addRotas();
    }

    public addRotas() {
        this.api.addRota("/materias", "POST", this.materiaControle.salvar.bind(this.materiaControle));
        this.api.addRota("/materias", "GET", this.materiaControle.listar.bind(this.materiaControle));
        this.api.addRota("/materias/:id", "GET", this.materiaControle.buscar.bind(this.materiaControle));
        this.api.addRota("/materias/:id", "PUT", this.materiaControle.atualizar.bind(this.materiaControle));
        this.api.addRota("/materias/:id", "DELETE", this.materiaControle.deletar.bind(this.materiaControle));
    }
}
