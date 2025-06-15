import { Request, Response } from "express";
import { CursoDtoCreate } from "../dto/Curso.dto";
import { CursoServico } from "../servico/curso.servico";

export class CursoController {
  constructor(private readonly cursoServico: CursoServico) {}

  public salvar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dto: CursoDtoCreate = req.body;
      const curso = await this.cursoServico.salvar(dto);
      return res.status(201).json(curso);
    } catch (error: any) {
      return res.status(400).json({ erro: error.message });
    }
  };

  public listar = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const cursos = await this.cursoServico.listar();
      return res.status(200).json(cursos);
    } catch (error: any) {
      return res.status(500).json({ erro: error.message });
    }
  };

  public buscar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const curso = await this.cursoServico.buscar(id);
      if (!curso) return res.status(404).json({ erro: "Curso não encontrado" });
      return res.status(200).json(curso);
    } catch (error: any) {
      return res.status(500).json({ erro: error.message });
    }
  };

  public atualizar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const dados = req.body;
      const curso = await this.cursoServico.atualizar(id, dados);
      if (!curso) return res.status(404).json({ erro: "Curso não encontrado" });
      return res.status(200).json(curso);
    } catch (error: any) {
      return res.status(400).json({ erro: error.message });
    }
  };

  public deletar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const sucesso = await this.cursoServico.deletar(id);
      if (!sucesso) return res.status(404).json({ erro: "Curso não encontrado" });
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ erro: error.message });
    }
  };
}
