import { IsNotEmpty, IsString } from 'class-validator';

export class ListaToDoDtoCreate {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsString()
  materiaId: string;
}

export type ListaToDoListarDto = {
  id: string;
  nome: string;
  materiaId: string;
};