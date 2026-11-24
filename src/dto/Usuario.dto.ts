import { IsEmail, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class UsuarioDtoCreate {
  @IsNotEmpty({ message: "O nome não pode ficar vazio." })
  @IsString({ message: "O nome deve ser um texto." })
  nome: string;

  @IsNotEmpty({ message: "O email não pode ficar vazio." })
  @IsEmail({}, { message: "Informe um email válido." })
  email: string;

  @IsNotEmpty({ message: "A senha não pode ficar vazia." })
  @IsString({ message: "A senha deve ser um texto." })
  senha: string;
}

export class UsuarioDtoUpdate {
  @ValidateIf((_usuario, valor) => valor !== undefined)
  @IsString({ message: "O nome deve ser um texto." })
  @IsNotEmpty({ message: "O nome não pode ficar vazio." })
  nome?: string;

  @ValidateIf((_usuario, valor) => valor !== undefined)
  @IsEmail({}, { message: "Informe um email válido." })
  email?: string;

  @ValidateIf((_usuario, valor) => valor !== undefined)
  @IsString({ message: "A senha deve ser um texto." })
  @IsNotEmpty({ message: "A senha não pode ficar vazia." })
  senha?: string;
}

export class UsuarioDtoLogin {
  @IsNotEmpty({ message: "O email não pode ficar vazio." })
  @IsEmail({}, { message: "Informe um email válido." })
  email: string;

  @IsNotEmpty({ message: "A senha não pode ficar vazia." })
  @IsString({ message: "A senha deve ser um texto." })
  senha: string;
}

export type UsuarioListarDto = {
  id: string;
  nome: string;
  email: string;
};
