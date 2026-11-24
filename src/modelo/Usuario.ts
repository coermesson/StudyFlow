import crypto from 'crypto';

export type UsuarioProps = {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
};

export class Usuario {
  private constructor(readonly props: UsuarioProps) {}

  public static build({ nome, email, senhaHash }: Omit<UsuarioProps, "id">): Usuario {
    const props: UsuarioProps = {
      id: crypto.randomUUID(),
      nome,
      email,
      senhaHash,
    };
    return new Usuario(props);
  }

  public static assemble(id: string, nome: string, email: string, senhaHash: string): Usuario {
    const props: UsuarioProps = {
      id,
      nome,
      email,
      senhaHash,
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

  public get senhaHash(): string {
    return this.props.senhaHash;
  }
}
