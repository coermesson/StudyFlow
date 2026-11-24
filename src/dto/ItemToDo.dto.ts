import { IsBoolean, IsNotEmpty, IsString, IsUUID, ValidateIf } from 'class-validator';

export class ItemToDoDtoCreate {
  @IsNotEmpty({ message: "A descrição do item não pode ficar vazia." })
  @IsString({ message: "A descrição do item deve ser um texto." })
  descricao: string;

  @IsNotEmpty({ message: "O campo feito não pode ficar vazio." })
  @IsBoolean({ message: "O campo feito deve ser verdadeiro ou falso." })
  feito: boolean;

  @IsNotEmpty({ message: "O ID da lista não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de lista válido." })
  listaId: string;
}

export class ItemToDoDtoUpdate {
  @ValidateIf((_item, valor) => valor !== undefined)
  @IsString({ message: "A descrição do item deve ser um texto." })
  @IsNotEmpty({ message: "A descrição do item não pode ficar vazia." })
  descricao?: string;

  @ValidateIf((_item, valor) => valor !== undefined)
  @IsBoolean({ message: "O campo feito deve ser verdadeiro ou falso." })
  feito?: boolean;

  @ValidateIf((_item, valor) => valor !== undefined)
  @IsNotEmpty({ message: "O ID da lista não pode ficar vazio." })
  @IsUUID(undefined, { message: "Informe um ID de lista válido." })
  listaId?: string;
}

export type ItemToDoListarDto = {
  id: string;
  descricao: string;
  feito: boolean;
  listaId: string;
};
