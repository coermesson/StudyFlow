import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class QuadroKanbanDtoCreate {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsInt()
  materiaId: number;
}

export type QuadroKanbanListarDto = {
  id: string;
  nome: string;
  materiaId: number;
};