import { ArquivoController } from "../controle/Arquivo.controle";
import { ArquivoDao } from "../dao/Arquivo.dao";
import { ArquivoServico } from "../servico/arquivo.servico";
import { Api } from "./api";

export class ArquivoApi {
    readonly arquivoControle: ArquivoController;

    private constructor(readonly api: Api) {
        this.arquivoControle = new ArquivoController(new ArquivoServico(new ArquivoDao()));
    }

    public static build(api: Api) {
        const arquivoApi = new ArquivoApi(api);
        arquivoApi.addRotas();
    }

    public addRotas() {
        this.api.addRota("/arquivos", "POST", this.arquivoControle.salvar.bind(this.arquivoControle));
        this.api.addRota("/arquivos", "GET", this.arquivoControle.listar.bind(this.arquivoControle));
        this.api.addRota("/arquivos/:id", "GET", this.arquivoControle.buscar.bind(this.arquivoControle));
        this.api.addRota("/arquivos/:id", "PUT", this.arquivoControle.atualizar.bind(this.arquivoControle));
        this.api.addRota("/arquivos/:id", "DELETE", this.arquivoControle.deletar.bind(this.arquivoControle));
    }
}
