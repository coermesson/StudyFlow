import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class MateriaDtoCreate {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsInt()
  cursoId: number;
}

export type MateriaListarDto = {
  props: any;
  id: string;
  nome: string;
  cursoId: number;
};