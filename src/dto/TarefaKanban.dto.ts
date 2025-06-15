import { IsEnum, IsInt, IsNotEmpty, IsString } from 'class-validator';

export enum StatusTarefa {
  A_FAZER = 'a fazer',
  FAZENDO = 'fazendo',
  FEITO = 'feito',
}

export enum PrioridadeTarefa {
  BAIXA = 'baixa',
  MEDIA = 'média',
  ALTA = 'alta',
}

export class TarefaKanbanDtoCreate {
  @IsNotEmpty()
  @IsString()
  titulo: string;

  @IsNotEmpty()
  @IsString()
  descricao: string;

  @IsNotEmpty()
  @IsEnum(StatusTarefa)
  status: StatusTarefa;

  @IsNotEmpty()
  @IsEnum(PrioridadeTarefa)
  prioridade: PrioridadeTarefa;

  @IsNotEmpty()
  @IsInt()
  quadroId: number;
}

export type TarefaKanbanListarDto = {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  quadroId: number;
};