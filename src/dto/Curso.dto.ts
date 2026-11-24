import { IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';

export class CursoDtoCreate {
  @IsNotEmpty({ message: "O nome do curso não pode ficar vazio." })
  @IsString({ message: "O nome do curso deve ser um texto." })
  nome: string;

  @IsNotEmpty({ message: "O ID do usuário não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de usuário válido." })
  usuarioId: string;
}

export class CursoDtoUpdate {
  @ValidateIf((_curso, valor) => valor !== undefined)
  @IsString({ message: "O nome do curso deve ser um texto." })
  @IsNotEmpty({ message: "O nome do curso não pode ficar vazio." })
  nome?: string;
}

export type CursoListarDto = {
  id: string;
  nome: string;
  usuarioId: string;
};
