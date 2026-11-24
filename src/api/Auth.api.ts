import { AuthController } from "../controle/Auth.controle";
import { UsuarioDao } from "../dao/Usuario.dao";
import { UsuarioServico } from "../servico/Usuario.servico";
import { Api } from "./api";

export class AuthApi {
  private readonly authControle: AuthController;

  private constructor(private readonly api: Api) {
    this.authControle = new AuthController(new UsuarioServico(new UsuarioDao()));
  }

  public static build(api: Api): void {
    new AuthApi(api).addRotas();
  }

  private addRotas(): void {
    this.api.addRota("/auth/login", "POST", this.authControle.login.bind(this.authControle), true);
    this.api.addRota("/auth/logout", "POST", this.authControle.logout.bind(this.authControle));
    this.api.addRota(
    "/auth/me",
    "GET",
    this.authControle.me.bind(this.authControle)
);
  }
}
