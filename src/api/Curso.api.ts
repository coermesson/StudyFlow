import { CursoController } from "../controle/Curso.controle";
import { CursoDao } from "../dao/Cuso.dao";
import { CursoServico } from "../servico/curso.servico";
import { Api } from "./api";

export class CursoApi {
    readonly cursoControle: CursoController;

    private constructor(readonly api: Api) {
        this.cursoControle = new CursoController(new CursoServico(new CursoDao()));
    }

    public static build(api: Api) {
        const cursoApi = new CursoApi(api);
        cursoApi.addRotas();
    }

    public addRotas() {
        this.api.addRota("/cursos", "POST", this.cursoControle.salvar.bind(this.cursoControle));
        this.api.addRota("/cursos", "GET", this.cursoControle.listar.bind(this.cursoControle));
        this.api.addRota("/cursos/:id", "GET", this.cursoControle.buscar.bind(this.cursoControle));
        this.api.addRota("/cursos/:id", "PUT", this.cursoControle.atualizar.bind(this.cursoControle));
        this.api.addRota("/cursos/:id", "DELETE", this.cursoControle.deletar.bind(this.cursoControle));
    }
}
