import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class QuadroKanbanDtoCreate {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsUUID()
  materiaId: string;
}

export type QuadroKanbanListarDto = {
  id: string;
  nome: string;
  materiaId: string;
};
