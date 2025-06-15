import { ArquivoDao } from "../dao/Arquivo.dao";
import { ArquivoDtoCreate } from "../dto/Arquivo.dto";
import { Arquivo, ArquivoProps } from "../modelo/Arquivo";

export class ArquivoServico {
  constructor(private arquivoDao: ArquivoDao) {}

  public async salvar(dto: ArquivoDtoCreate): Promise<ArquivoProps> {
    const arquivo = Arquivo.build(dto);
    await this.arquivoDao.salvar(arquivo);
    return arquivo.props;
  }

  public async buscar(id: string): Promise<ArquivoProps | null> {
    const arquivo = await this.arquivoDao.buscar(id);
    return arquivo?.props ?? null;
  }

  public async listar(): Promise<ArquivoProps[] | null> {
    const arquivos = await this.arquivoDao.listar();
    return arquivos?.map(a => a.props) ?? null;
  }

  public async atualizar(id: string, dados: Partial<ArquivoProps>): Promise<ArquivoProps | null> {
    const arquivo = await this.arquivoDao.atualizar(id, dados);
    return arquivo?.props ?? null;
  }

  public async deletar(id: string): Promise<boolean> {
    return this.arquivoDao.delete(id);
  }
}
