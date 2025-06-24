// src/dto/Materia.dto.ts

import { IsInt, IsNotEmpty, IsString } from 'class-validator';

// Seu DTO para criar/atualizar matéria (sem problemas aqui, exceto o nome da coluna)
export class MateriaDtoCreate {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsInt()
  cursoId: number; // No DTO, usa-se camelCase
}

// Seu DTO para LISTAR matérias: deve ser simples e sem 'props'
export type MateriaListarDto = {
  id: string;
  nome: string;
  cursoId: number; // No DTO, também usa-se camelCase
};