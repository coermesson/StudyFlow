import crypto from 'crypto';
import { UsuarioDtoCreate } from "../dto/Usuario.dto";

export type UsuarioProps = {
  id: string;
  nome: string;
  email: string;
  senha: string;
};

export class Usuario {
  private constructor(readonly props: UsuarioProps) {}

  public static build({ nome, email, senha }: UsuarioDtoCreate): Usuario {
    const props: UsuarioProps = {
      id: crypto.randomUUID(),
      nome,
      email,
      senha,
    };
    return new Usuario(props);
  }

  public static assemble(id: string, nome: string, email: string, senha: string): Usuario {
    const props: UsuarioProps = {
      id,
      nome,
      email,
      senha,
    };
    return new Usuario(props);
  }

  public get id(): string {
    return this.props.id;
  }

  public get nome(): string {
    return this.props.nome;
  }

  public get email(): string {
    return this.props.email;
  }

  public get senha(): string {
    return this.props.senha;
  }
}
