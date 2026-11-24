import { IsNotEmpty, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

export class ArquivoDtoCreate {
  @IsNotEmpty({ message: "O nome do arquivo não pode ficar vazio." })
  @IsString({ message: "O nome do arquivo deve ser um texto." })
  @MaxLength(255, { message: "O nome do arquivo deve ter no máximo 255 caracteres." })
  nome: string;

  @IsNotEmpty({ message: "O ID da matéria não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de matéria válido." })
  materiaId: string;
}

export class ArquivoDtoUpdate {
  @ValidateIf((_arquivo, valor) => valor !== undefined)
  @IsString({ message: "O nome do arquivo deve ser um texto." })
  @IsNotEmpty({ message: "O nome do arquivo não pode ficar vazio." })
  @MaxLength(255, { message: "O nome do arquivo deve ter no máximo 255 caracteres." })
  nome?: string;

  @ValidateIf((_arquivo, valor) => valor !== undefined)
  @IsNotEmpty({ message: "O ID da matéria não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de matéria válido." })
  materiaId?: string;
}

export type ArquivoListarDto = {
  id: string;
  nome: string;
  materiaId: string;
};
