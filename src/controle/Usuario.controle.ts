import { Request, Response } from "express";
import { UsuarioDtoCreate } from "../dto/Usuario.dto";
import { UsuarioServico } from "../servico/Usuario.servico";

export class UsuarioController {
  constructor(private readonly usuarioServico: UsuarioServico) {}

  public salvar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dto: UsuarioDtoCreate = req.body;
      const usuario = await this.usuarioServico.salvar(dto);
      return res.status(201).json(usuario);
    } catch (error: any) {
      return res.status(400).json({ erro: error.message });
    }
  };

  public listar = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const usuarios = await this.usuarioServico.listar();
      return res.status(200).json(usuarios);
    } catch (error: any) {
      return res.status(500).json({ erro: error.message });
    }
  };

  public buscar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const usuario = await this.usuarioServico.buscar(id);
      if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
      return res.status(200).json(usuario);
    } catch (error: any) {
      return res.status(500).json({ erro: error.message });
    }
  };

  public atualizar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const dados = req.body;
      const usuario = await this.usuarioServico.atualizar(id, dados);
      if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
      return res.status(200).json(usuario);
    } catch (error: any) {
      return res.status(400).json({ erro: error.message });
    }
  };

  public deletar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const sucesso = await this.usuarioServico.deletar(id);
      if (!sucesso) return res.status(404).json({ erro: "Usuário não encontrado" });
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ erro: error.message });
    }
  };
}
