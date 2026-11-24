import { IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';

export class ListaToDoDtoCreate {
  @IsNotEmpty({ message: "O nome da lista não pode ficar vazio." })
  @IsString({ message: "O nome da lista deve ser um texto." })
  nome: string;

  @IsNotEmpty({ message: "O ID da matéria não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de matéria válido." })
  materiaId: string;
}

export class ListaToDoDtoUpdate {
  @ValidateIf((_lista, valor) => valor !== undefined)
  @IsString({ message: "O nome da lista deve ser um texto." })
  @IsNotEmpty({ message: "O nome da lista não pode ficar vazio." })
  nome?: string;

  @ValidateIf((_lista, valor) => valor !== undefined)
  @IsNotEmpty({ message: "O ID da matéria não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de matéria válido." })
  materiaId?: string;
}

export type ListaToDoListarDto = {
  id: string;
  nome: string;
  materiaId: string;
};
