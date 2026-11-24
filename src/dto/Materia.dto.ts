// src/dto/Materia.dto.ts

import { IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';


export class MateriaDtoCreate {
  @IsNotEmpty({ message: "O nome da matéria não pode ficar vazio." })
  @IsString({ message: "O nome da matéria deve ser um texto." })
  nome: string;

  @IsNotEmpty({ message: "O ID do curso não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de curso válido." })
  cursoId: string;
}

export class MateriaDtoUpdate {
  @ValidateIf((_materia, valor) => valor !== undefined)
  @IsString({ message: "O nome da matéria deve ser um texto." })
  @IsNotEmpty({ message: "O nome da matéria não pode ficar vazio." })
  nome?: string;

  @ValidateIf((_materia, valor) => valor !== undefined)
  @IsNotEmpty({ message: "O ID do curso não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de curso válido." })
  cursoId?: string;
}


export type MateriaListarDto = {
  id: string;
  nome: string;
  cursoId: string;
};
