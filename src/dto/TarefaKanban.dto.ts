import { IsEnum, IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';

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
  @IsNotEmpty({ message: "O título da tarefa não pode ficar vazio." })
  @IsString({ message: "O título da tarefa deve ser um texto." })
  titulo: string;

  @IsNotEmpty({ message: "A descrição da tarefa não pode ficar vazia." })
  @IsString({ message: "A descrição da tarefa deve ser um texto." })
  descricao: string;

  @IsNotEmpty({ message: "O status da tarefa não pode ficar vazio." })
  @IsEnum(StatusTarefa, { message: "Selecione um status válido: a fazer, fazendo ou feito." })
  status: StatusTarefa;

  @IsNotEmpty({ message: "A prioridade da tarefa não pode ficar vazia." })
  @IsEnum(PrioridadeTarefa, { message: "Selecione uma prioridade válida: baixa, média ou alta." })
  prioridade: PrioridadeTarefa;

  @IsNotEmpty({ message: "O ID do quadro não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de quadro válido." })
  quadroId: string;
}

export class TarefaKanbanDtoUpdate {
  @ValidateIf((_tarefa, valor) => valor !== undefined)
  @IsString({ message: "O título da tarefa deve ser um texto." })
  @IsNotEmpty({ message: "O título da tarefa não pode ficar vazio." })
  titulo?: string;

  @ValidateIf((_tarefa, valor) => valor !== undefined)
  @IsString({ message: "A descrição da tarefa deve ser um texto." })
  @IsNotEmpty({ message: "A descrição da tarefa não pode ficar vazia." })
  descricao?: string;

  @ValidateIf((_tarefa, valor) => valor !== undefined)
  @IsEnum(StatusTarefa, { message: "Selecione um status válido: a fazer, fazendo ou feito." })
  status?: StatusTarefa;

  @ValidateIf((_tarefa, valor) => valor !== undefined)
  @IsEnum(PrioridadeTarefa, { message: "Selecione uma prioridade válida: baixa, média ou alta." })
  prioridade?: PrioridadeTarefa;

  @ValidateIf((_tarefa, valor) => valor !== undefined)
  @IsNotEmpty({ message: "O ID do quadro não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de quadro válido." })
  quadroId?: string;
}

export type TarefaKanbanListarDto = {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  quadroId: string;
};
