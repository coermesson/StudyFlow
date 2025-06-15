import crypto from "crypto";

export type ArquivoProps = {
  id: string;
  nome: string;
  materiaId: string;
};

export class Arquivo {
  private constructor(private readonly _props: ArquivoProps) {}

  /**
   * Cria uma nova instância de Arquivo com UUID gerado automaticamente.
   */
  public static build({ nome, materiaId }: Omit<ArquivoProps, "id">): Arquivo {
    const props: ArquivoProps = {
      id: crypto.randomUUID(),
      nome,
      materiaId,
    };
    return new Arquivo(props);
  }

  /**
   * Remonta a instância de Arquivo a partir dos dados vindos do banco de dados.
   */
  public static assemble(id: string, nome: string, materiaId: string): Arquivo {
    return new Arquivo({ id, nome, materiaId });
  }

  // ✅ Getters públicos para acesso externo
  public get id(): string {
    return this._props.id;
  }

  public get nome(): string {
    return this._props.nome;
  }

  public get materiaId(): string {
    return this._props.materiaId;
  }

  // ✅ Caso queira retornar todos os props de uma vez
  public get props(): ArquivoProps {
    return this._props;
  }
}
