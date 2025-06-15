import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class UsuarioDtoCreate {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  senha: string;
}

export type UsuarioListarDto = {
  id: string;
  nome: string;
  email: string;
};