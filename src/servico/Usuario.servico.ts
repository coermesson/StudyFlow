import { UsuarioDao } from "../dao/Usuario.dao";
import { UsuarioDtoCreate } from "../dto/Usuario.dto";
import { Usuario, UsuarioProps } from "../modelo/Usuario";

export class UsuarioServico {
  constructor(private usuarioDao: UsuarioDao) {}

  public async salvar(dto: UsuarioDtoCreate): Promise<UsuarioProps> {
    const usuario = Usuario.build(dto);
    await this.usuarioDao.salvar(usuario);
    return usuario.props;
  }

  public async buscar(id: string): Promise<UsuarioProps | null> {
    const usuario = await this.usuarioDao.buscar(id);
    return usuario?.props ?? null;
  }

  

  public async listar(): Promise<Pick<UsuarioProps, "id" | "email">[] | null> {
    const usuarios = await this.usuarioDao.listar();
    return usuarios;
  }

  public async atualizar(id: string, dados: Partial<UsuarioProps>): Promise<UsuarioProps | null> {
    const usuario = await this.usuarioDao.atualizar(id, dados);
    return usuario?.props ?? null;
  }

  public async deletar(id: string): Promise<boolean> {
    return this.usuarioDao.delete(id);
  }
}
