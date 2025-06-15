import { ListaToDoDao } from "../dao/ListaToDo.dao";
import { ListaToDoDtoCreate, ListaToDoListarDto } from "../dto/ListaToDo.dto";
import { ListaToDo, ListaToDoProps } from "../modelo/ListaToDo";

export class ListaToDoServico {
    public constructor(readonly listaToDoDao: ListaToDoDao) { }

    public async salvar(listaDto: ListaToDoDtoCreate) {
        try {
            const lista = ListaToDo.build(listaDto)
            await this.listaToDoDao.salvar(lista)
            return lista.props;
        } catch (error) {
            throw error
        }
    }

    public async listar(): Promise<ListaToDoListarDto[] | null> {
        const listasDto: ListaToDoListarDto[] | null = await this.listaToDoDao.listar()
        if (listasDto) {
            return listasDto
        }
        return null
    }

    public async buscar(id: string): Promise<ListaToDoProps | null> {
        const lista: ListaToDo | null = await this.listaToDoDao.buscar(id)
        return lista?.props ?? lista
    }
}