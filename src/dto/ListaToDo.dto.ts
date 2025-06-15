import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class ListaToDoDtoCreate {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsInt()
  materiaId: string;
}

export type ListaToDoListarDto = {
  id: string;
  nome: string;
  materiaId: string;
};