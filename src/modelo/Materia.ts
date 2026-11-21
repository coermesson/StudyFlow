import crypto from "crypto";
import { MateriaDtoCreate } from "../dto/Materia.dto";

export type MateriaProps = {
  id: string;
  nome: string;
  cursoId: string;
};

export class Materia {
  private constructor(readonly props: MateriaProps) {}

  public static build({ nome, cursoId }: MateriaDtoCreate) {
    const props: MateriaProps = {
      id: crypto.randomUUID(),
      nome,
      cursoId,
    };
    return new Materia(props);
  }

  public static assemble(id: string, nome: string, cursoId: string) {
    const props: MateriaProps = {
      id,
      nome,
      cursoId,
    };
    return new Materia(props);
  }

  public get id() {
    return this.props.id;
  }

  public get nome() {
    return this.props.nome;
  }

  public get cursoId() {
    return this.props.cursoId;
  }
}
