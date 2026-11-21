// src/dto/Materia.dto.ts

import { IsNotEmpty, IsString, IsUUID } from 'class-validator';


export class MateriaDtoCreate {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsUUID()
  cursoId: string;
}


export type MateriaListarDto = {
  id: string;
  nome: string;
  cursoId: string;
};
