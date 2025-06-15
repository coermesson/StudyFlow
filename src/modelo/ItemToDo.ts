import { ListaToDo } from "./ListaToDo"

export type ItemToDoProps = {
    id: string,
    descricao: string,
    feito: boolean,
    listaId: string,
    lista?: ListaToDo,
    created_at?: Date,
    updated_at?: Date,
}

export class ItemToDo {

    private constructor(readonly props: ItemToDoProps) { }

    public static build({ descricao, listaId }: { descricao: string, listaId: string }) {
        return new ItemToDo({
            id: crypto.randomUUID().toString(),
            descricao,
            feito: false,
            listaId
        })
    }

    public static assemble({
        id,
        descricao,
        feito,
        listaId,
        lista,
        created_at,
        updated_at
    }: ItemToDoProps) {
        return new ItemToDo({
            id,
            descricao,
            feito,
            listaId,
            lista,
            created_at,
            updated_at
        })
    }

    public get id() {
        return this.props.id
    }

    public get descricao() {
        return this.props.descricao
    }

    public get feito() {
        return this.props.feito
    }

    public get listaId() {
        return this.props.listaId
    }

    public get lista() {
        return this.props.lista
    }
}