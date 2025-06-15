import { QuadroKanbanDtoCreate } from "../dto/QuadroKanban.dto"

export type QuadroKanbanProps = {
    id: string,
    nome: string,
    materiaId: number,
    created_at?: Date,
    updated_at?: Date
}

export class QuadroKanban {

    private constructor(readonly props: QuadroKanbanProps) { }

    public static build({ nome, materiaId }: QuadroKanbanDtoCreate) {
        return new QuadroKanban({
            id: crypto.randomUUID().toString(),
            nome,
            materiaId
        })
    }

    public static assemble({ id, nome, materiaId, created_at, updated_at }: QuadroKanbanProps) {
        return new QuadroKanban({
            id,
            nome,
            materiaId,
            created_at,
            updated_at
        })
    }

    public get id() {
        return this.props.id
    }

    public get nome() {
        return this.props.nome
    }

    public get materiaId() {
        return this.props.materiaId
    }
}