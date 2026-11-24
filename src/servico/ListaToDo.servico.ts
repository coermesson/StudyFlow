import { ListaToDoDao } from "../dao/ListaToDo.dao";
import { ListaToDoDtoCreate, ListaToDoDtoUpdate, ListaToDoListarDto } from "../dto/ListaToDo.dto";
import { ListaToDo, ListaToDoProps } from "../modelo/ListaToDo";

export class ListaToDoServico {
    public constructor(readonly listaToDoDao: ListaToDoDao) { }

    public async salvar(listaDto: ListaToDoDtoCreate, usuarioId: string) {
        try {
            const lista = ListaToDo.build(listaDto)
            const salva = await this.listaToDoDao.salvar(lista, usuarioId)
            if (!salva) return null;
            return lista.props;
        } catch (error) {
            throw error
        }
    }

    public async listar(usuarioId: string): Promise<ListaToDoListarDto[] | null> {
        const listasDto: ListaToDoListarDto[] | null = await this.listaToDoDao.listar(usuarioId)
        if (listasDto) {
            return listasDto
        }
        return null
    }

    public async buscar(id: string, usuarioId: string): Promise<ListaToDoProps | null> {
        const lista: ListaToDo | null = await this.listaToDoDao.buscar(id, usuarioId)
        return lista?.props ?? lista
    }

    public async atualizar(id: string, dados: ListaToDoDtoUpdate, usuarioId: string): Promise<ListaToDoProps | null> {
        const lista = await this.listaToDoDao.atualizar(id, dados, usuarioId)
        return lista?.props ?? null
    }

    public async deletar(id: string, usuarioId: string): Promise<boolean> {
        return this.listaToDoDao.delete(id, usuarioId)
    }
}
