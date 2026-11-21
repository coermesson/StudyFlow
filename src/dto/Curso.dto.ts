import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CursoDtoCreate {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsUUID()
  usuarioId: string;
}

export type CursoListarDto = {
  props: any;
  id: string;
  nome: string;
  usuarioId: string;
};
