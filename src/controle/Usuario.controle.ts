import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { Request, Response } from "express";
import { UsuarioDtoCreate, UsuarioDtoUpdate } from "../dto/Usuario.dto";
import { UsuarioServico } from "../servico/Usuario.servico";

export class UsuarioController {
  constructor(private readonly usuarioServico: UsuarioServico) {}

  public salvar = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ erro: "Corpo da requisição inválido" });
      }

      const dto = plainToInstance(UsuarioDtoCreate, req.body);
      const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

      if (erros.length > 0) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: erros.flatMap((erro) => Object.entries(erro.constraints ?? {}).map(([tipo, mensagem]) =>
            tipo === "whitelistValidation" ? `O campo ${erro.property} não é permitido.` : mensagem)),
        });
      }

      const usuario = await this.usuarioServico.salvar(dto);
      return res.status(201).json(usuario);
    } catch (error: any) {
      if (error?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ erro: "Email já cadastrado" });
      }
      console.error("Falha inesperada ao cadastrar usuário", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public listar = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const usuarios = await this.usuarioServico.listar(res.locals.usuarioId as string);
      return res.status(200).json(usuarios ?? []);
    } catch (error: any) {
      console.error("Falha inesperada ao listar usuários", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public buscar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const usuario = await this.usuarioServico.buscar(id, res.locals.usuarioId as string);
      if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
      return res.status(200).json(usuario);
    } catch (error: any) {
      console.error("Falha inesperada ao buscar usuário", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public atualizar = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (req.body === null || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({ erro: "Corpo da requisição inválido" });
      }

      const dto = plainToInstance(UsuarioDtoUpdate, req.body);
      const erros = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });

      if (erros.length > 0) {
        return res.status(400).json({
          erro: "Dados inválidos",
          detalhes: erros.flatMap((erro) => Object.entries(erro.constraints ?? {}).map(([tipo, mensagem]) =>
            tipo === "whitelistValidation" ? `O campo ${erro.property} não é permitido.` : mensagem)),
        });
      }

      if (dto.nome === undefined && dto.email === undefined && dto.senha === undefined) {
        return res.status(400).json({ erro: "Nenhum campo atualizável informado" });
      }

      const { id } = req.params;
      const usuario = await this.usuarioServico.atualizar(id, dto, res.locals.usuarioId as string);
      if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
      return res.status(200).json(usuario);
    } catch (error: any) {
      if (error?.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ erro: "Email já cadastrado" });
      }
      console.error("Falha inesperada ao atualizar usuário", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };

  public deletar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const sucesso = await this.usuarioServico.deletar(id, res.locals.usuarioId as string);
      if (!sucesso) return res.status(404).json({ erro: "Usuário não encontrado" });

      try {
        await new Promise<void>((resolve, reject) => {
          req.session.destroy((erro) => erro ? reject(erro) : resolve());
        });
      } finally {
        res.clearCookie("connect.sid", {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });
      }

      return res.status(204).send();
    } catch (error: any) {
      console.error("Falha inesperada ao excluir usuário", error instanceof Error ? error.name : "Erro desconhecido");
      return res.status(500).json({ erro: "Erro interno do servidor" });
    }
  };
}
