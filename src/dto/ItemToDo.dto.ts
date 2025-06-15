import { IsBoolean, IsInt, IsNotEmpty, IsString } from 'class-validator';

export class ItemToDoDtoCreate {
  @IsNotEmpty()
  @IsString()
  descricao: string;

  @IsNotEmpty()
  @IsBoolean()
  feito: boolean;

  @IsNotEmpty()
  @IsInt()
  listaId: string;
}

export type ItemToDoListarDto = {
  id: string;
  descricao: string;
  feito: boolean;
  listaId: string;
};