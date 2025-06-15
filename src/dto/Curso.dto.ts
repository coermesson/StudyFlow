import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CursoDtoCreate {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsInt()
  usuarioId: number;
}

export type CursoListarDto = {
  props: any;
  id: string;
  nome: string;
  usuarioId: number;
};
