import { MateriaDtoCreate } from "../dto/Materia.dto";

export type MateriaProps = {
  id: string;
  nome: string;
  cursoId: number;
};

export class Materia {
  private constructor(readonly props: MateriaProps) {}

  public static build({ nome, cursoId }: MateriaDtoCreate) {
    const props: MateriaProps = {
      id: "",  // ID será gerado pelo banco
      nome,
      cursoId,
    };
    return new Materia(props);
  }

  public static assemble(id: string, nome: string, cursoId: number) {
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
