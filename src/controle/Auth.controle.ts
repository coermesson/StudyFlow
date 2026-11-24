import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { UsuarioDtoLogin } from "../dto/Usuario.dto";
import { UsuarioServico } from "../servico/Usuario.servico";

type SessaoComUsuario = Request["session"] & { usuarioId?: string };

export class AuthController {
  constructor(private readonly usuarioServico: UsuarioServico) {}

  public login = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ erro: "Corpo da requisição inválido" });
      }

      const dto = plainToInstance(UsuarioDtoLogin, req.body);
      const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
      if (erros.length > 0) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: erros.flatMap((erro) => Object.entries(erro.constraints ?? {}).map(([tipo, mensagem]) =>
            tipo === "whitelistValidation" ? `O campo ${erro.property} não é permitido.` : mensagem)),
        });
      }

      const usuario = await this.usuarioServico.autenticar(dto.email, dto.senha);
      if (!usuario) {
        return res.status(401).json({ erro: "Credenciais inválidas" });
      }

      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((erro) => erro ? reject(erro) : resolve());
      });
      (req.session as SessaoComUsuario).usuarioId = usuario.id;
      await new Promise<void>((resolve, reject) => {
        req.session.save((erro) => erro ? reject(erro) : resolve());
      });

      return res.status(200).json(usuario);
    } catch (error) {
      console.error("Falha inesperada no login", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public logout = async (req: Request, res: Response): Promise<Response> => {
    try {
      await new Promise<void>((resolve, reject) => {
        req.session.destroy((erro) => erro ? reject(erro) : resolve());
      });
      res.clearCookie("connect.sid", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
      return res.status(204).send();
    } catch (error) {
      console.error("Falha inesperada no logout", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public me = async (_req: Request, res: Response): Promise<Response> => {
    try {
        const usuarioId = res.locals.usuarioId as string;

        const usuario = await this.usuarioServico.buscar(
            usuarioId,
            usuarioId
        );

        if (!usuario) {
            return res.status(404).json({
                erro: "Usuário não encontrado"
            });
        }

        return res.status(200).json(usuario);
    } catch (error) {
        console.error(
            "Falha inesperada ao consultar sessão",
            error instanceof Error ? error.name : "Erro desconhecido"
        );

        return res.status(500).json({
            erro: "Erro interno do servidor"
        });
    }
};
}
