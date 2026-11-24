import { ItemToDoDao } from "../dao/ItemToDo.dao";
import { ItemToDoDtoCreate, ItemToDoDtoUpdate, ItemToDoListarDto } from "../dto/ItemToDo.dto";
import { ItemToDo, ItemToDoProps } from "../modelo/ItemToDo";

export class ItemToDoServico {
    public constructor(readonly itemToDoDao: ItemToDoDao) { }

    public async salvar(itemDto: ItemToDoDtoCreate, usuarioId: string) {
        try {
            const item = ItemToDo.build(itemDto)
            const salvo = await this.itemToDoDao.salvar(item, usuarioId)
            if (!salvo) return null;
            return item.props;
        } catch (error) {
            throw error
        }
    }

    public async listar(usuarioId: string): Promise<ItemToDoListarDto[] | null> {
        const itensDto: ItemToDoListarDto[] | null = await this.itemToDoDao.listar(usuarioId)
        if (itensDto) {
            return itensDto
        }
        return null
    }

    public async buscar(id: string, usuarioId: string): Promise<ItemToDoProps | null> {
        const item: ItemToDo | null = await this.itemToDoDao.buscar(id, usuarioId)
        return item?.props ?? item
    }

    public async atualizar(id: string, dados: ItemToDoDtoUpdate, usuarioId: string): Promise<ItemToDoProps | null> {
        const item = await this.itemToDoDao.atualizar(id, dados, usuarioId)
        return item?.props ?? null
    }

    public async deletar(id: string, usuarioId: string): Promise<boolean> {
        return this.itemToDoDao.delete(id, usuarioId)
    }
}
