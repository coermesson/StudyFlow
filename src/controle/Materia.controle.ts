import { Request, Response } from "express";
import { MateriaDtoCreate } from "../dto/Materia.dto";
import { MateriaServico } from "../servico/materia.servico";

export class MateriaController {
  constructor(private readonly materiaServico: MateriaServico) {}

  public salvar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dto: MateriaDtoCreate = req.body;
      const materia = await this.materiaServico.salvar(dto);
      return res.status(201).json(materia);
    } catch (error: any) {
      return res.status(400).json({ erro: error.message });
    }
  };

  public listar = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const materias = await this.materiaServico.listar();
      return res.status(200).json(materias);
    } catch (error: any) {
      return res.status(500).json({ erro: error.message });
    }
  };

  public buscar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const materia = await this.materiaServico.buscar(id);
      if (!materia) return res.status(404).json({ erro: "Matéria não encontrada" });
      return res.status(200).json(materia);
    } catch (error: any) {
      return res.status(500).json({ erro: error.message });
    }
  };

  public atualizar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const dados = req.body;
      const materia = await this.materiaServico.atualizar(id, dados);
      if (!materia) return res.status(404).json({ erro: "Matéria não encontrada" });
      return res.status(200).json(materia);
    } catch (error: any) {
      return res.status(400).json({ erro: error.message });
    }
  };

  public deletar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const sucesso = await this.materiaServico.deletar(id);
      if (!sucesso) return res.status(404).json({ erro: "Matéria não encontrada" });
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ erro: error.message });
    }
  };
}
