import { UsuarioController } from "../controle/Usuario.controle";
import { UsuarioDao } from "../dao/Usuario.dao";
import { UsuarioServico } from "../servico/Usuario.servico";
import { Api } from "./api";

export class UsuarioApi {
    readonly usuarioControle: UsuarioController;

    private constructor(readonly api: Api) {
        this.usuarioControle = new UsuarioController(new UsuarioServico(new UsuarioDao()));
    }

    public static build(api: Api) {
        const usuarioApi = new UsuarioApi(api);
        usuarioApi.addRotas();
    }

    public addRotas() {
        this.api.addRota("/usuarios", "POST", this.usuarioControle.salvar.bind(this.usuarioControle));
        this.api.addRota("/usuarios", "GET", this.usuarioControle.listar.bind(this.usuarioControle));
        this.api.addRota("/usuarios/:id", "GET", this.usuarioControle.buscar.bind(this.usuarioControle));
        this.api.addRota("/usuarios/:id", "PUT", this.usuarioControle.atualizar.bind(this.usuarioControle));
        this.api.addRota("/usuarios/:id", "DELETE", this.usuarioControle.deletar.bind(this.usuarioControle));
    }
}
