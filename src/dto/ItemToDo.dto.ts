import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class ItemToDoDtoCreate {
  @IsNotEmpty()
  @IsString()
  descricao: string;

  @IsNotEmpty()
  @IsBoolean()
  feito: boolean;

  @IsNotEmpty()
  @IsString()
  listaId: string;
}

export type ItemToDoListarDto = {
  id: string;
  descricao: string;
  feito: boolean;
  listaId: string;
};