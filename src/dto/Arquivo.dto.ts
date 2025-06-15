import { IsNotEmpty, IsString } from 'class-validator';

export class ArquivoDtoCreate {
  @IsNotEmpty()
  @IsString()
  nome: string;

  @IsNotEmpty()
  @IsString()
  materiaId: string;  // UUID como string
}

export type ArquivoListarDto = {
  id: string;
  nome: string;
  materiaId: string;
};
