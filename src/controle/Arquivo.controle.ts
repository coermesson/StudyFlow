import { Request, Response } from "express";
import { ArquivoDtoCreate } from "../dto/Arquivo.dto";
import { ArquivoServico } from "../servico/arquivo.servico";

export class ArquivoController {
  constructor(private readonly arquivoServico: ArquivoServico) {}

  public salvar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const dto: ArquivoDtoCreate = req.body;
      const arquivo = await this.arquivoServico.salvar(dto);
      return res.status(201).json(arquivo);
    } catch (error: any) {
      return res.status(400).json({ erro: error.message });
    }
  };

  public listar = async (_req: Request, res: Response): Promise<Response> => {
    try {
      const arquivos = await this.arquivoServico.listar();
      return res.status(200).json(arquivos);
    } catch (error: any) {
      return res.status(500).json({ erro: error.message });
    }
  };

  public buscar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const arquivo = await this.arquivoServico.buscar(id);
      if (!arquivo) return res.status(404).json({ erro: "Arquivo não encontrado" });
      return res.status(200).json(arquivo);
    } catch (error: any) {
      return res.status(500).json({ erro: error.message });
    }
  };

  public atualizar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const dados = req.body;
      const arquivo = await this.arquivoServico.atualizar(id, dados);
      if (!arquivo) return res.status(404).json({ erro: "Arquivo não encontrado" });
      return res.status(200).json(arquivo);
    } catch (error: any) {
      return res.status(400).json({ erro: error.message });
    }
  };

  public deletar = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params;
      const sucesso = await this.arquivoServico.deletar(id);
      if (!sucesso) return res.status(404).json({ erro: "Arquivo não encontrado" });
      return res.status(204).send();
    } catch (error: any) {
      return res.status(500).json({ erro: error.message });
    }
  };
}
