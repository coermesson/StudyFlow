import { PrioridadeTarefa, StatusTarefa, TarefaKanbanDtoCreate } from "../dto/TarefaKanban.dto"
import { QuadroKanban } from "./QuadroKanban"

export type TarefaKanbanProps = {
    id: string,
    titulo: string,
    descricao: string,
    status: StatusTarefa,
    prioridade: PrioridadeTarefa,
    quadroId: number,
    quadro?: QuadroKanban,
    created_at?: Date,
    updated_at?: Date
}

export class TarefaKanban {

    private constructor(readonly props: TarefaKanbanProps) { }

    public static build({ titulo, descricao, status, prioridade, quadroId }: TarefaKanbanDtoCreate) {
        return new TarefaKanban({
            id: crypto.randomUUID().toString(),
            titulo,
            descricao,
            status,
            prioridade,
            quadroId
        })
    }

    public static assemble({ id, titulo, descricao, status, prioridade, quadroId, quadro, created_at, updated_at }: TarefaKanbanProps) {
        return new TarefaKanban({
            id,
            titulo,
            descricao,
            status,
            prioridade,
            quadroId,
            quadro,
            created_at,
            updated_at
        })
    }

    public get id() {
        return this.props.id
    }

    public get titulo() {
        return this.props.titulo
    }

    public get descricao() {
        return this.props.descricao
    }

    public get status() {
        return this.props.status
    }

    public get prioridade() {
        return this.props.prioridade
    }

    public get quadroId() {
        return this.props.quadroId
    }

    public get quadro() {
        return this.props.quadro
    }
}