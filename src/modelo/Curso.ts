import crypto from 'crypto';
import { CursoDtoCreate } from '../dto/Curso.dto';

export type CursoProps = {
  id: string;
  nome: string;
  usuarioId: number;
};

export class Curso {
  private constructor(readonly props: CursoProps) {}

  public static build({ nome, usuarioId }: CursoDtoCreate) {
    const props: CursoProps = {
      id: crypto.randomUUID().toString(),
      nome,
      usuarioId,
    };
    return new Curso(props);
  }

  public static assemble(id: string, nome: string, usuarioId: number) {
    const props: CursoProps = {
      id,
      nome,
      usuarioId,
    };
    return new Curso(props);
  }

  public get id() {
    return this.props.id;
  }

  public get nome() {
    return this.props.nome;
  }

  public get usuarioId() {
    return this.props.usuarioId;
  }
}
