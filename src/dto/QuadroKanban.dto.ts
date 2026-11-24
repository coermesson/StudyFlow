import { IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';

export class QuadroKanbanDtoCreate {
  @IsNotEmpty({ message: "O nome do quadro não pode ficar vazio." })
  @IsString({ message: "O nome do quadro deve ser um texto." })
  nome: string;

  @IsNotEmpty({ message: "O ID da matéria não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de matéria válido." })
  materiaId: string;
}

export class QuadroKanbanDtoUpdate {
  @ValidateIf((_quadro, valor) => valor !== undefined)
  @IsString({ message: "O nome do quadro deve ser um texto." })
  @IsNotEmpty({ message: "O nome do quadro não pode ficar vazio." })
  nome?: string;

  @ValidateIf((_quadro, valor) => valor !== undefined)
  @IsNotEmpty({ message: "O ID da matéria não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de matéria válido." })
  materiaId?: string;
}

export type QuadroKanbanListarDto = {
  id: string;
  nome: string;
  materiaId: string;
};
