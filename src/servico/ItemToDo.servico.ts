import { ItemToDoDao } from "../dao/ItemToDo.dao";
import { ItemToDoDtoCreate, ItemToDoListarDto } from "../dto/ItemToDo.dto";
import { ItemToDo, ItemToDoProps } from "../modelo/ItemToDo";

export class ItemToDoServico {
    public constructor(readonly itemToDoDao: ItemToDoDao) { }

    public async salvar(itemDto: ItemToDoDtoCreate) {
        try {
            const item = ItemToDo.build(itemDto)
            await this.itemToDoDao.salvar(item)
            return item.props;
        } catch (error) {
            throw error
        }
    }

    public async listar(): Promise<ItemToDoListarDto[] | null> {
        const itensDto: ItemToDoListarDto[] | null = await this.itemToDoDao.listar()
        if (itensDto) {
            return itensDto
        }
        return null
    }

    public async buscar(id: string): Promise<ItemToDoProps | null> {
        const item: ItemToDo | null = await this.itemToDoDao.buscar(id)
        return item?.props ?? item
    }
}