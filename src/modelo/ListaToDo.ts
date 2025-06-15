import { ItemToDo } from "./ItemToDo"

export type ListaToDoProps = {
    id: string,
    nome: string,
    materiaId: string,
    itens?: ItemToDo[],
    created_at?: Date,
    updated_at?: Date,
}

export class ListaToDo {

    private constructor(readonly props: ListaToDoProps) { }

    public static build({ nome, materiaId }: { nome: string, materiaId: string }) {
        return new ListaToDo({
            id: crypto.randomUUID().toString(),
            nome,
            materiaId
        })
    }

    public static assemble({
        id,
        nome,
        materiaId,
        itens,
        created_at,
        updated_at
    }: ListaToDoProps) {
        return new ListaToDo({
            id,
            nome,
            materiaId,
            itens,
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

    public get itens() {
        return this.props.itens
    }
}