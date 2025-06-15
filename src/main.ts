import 'reflect-metadata';
import { Api } from "./api/api";

// APIs principais
import { ArquivoApi } from './api/Arquivo.api';
import { CursoApi } from './api/Curso.api';
import { MateriaApi } from './api/Materia.api';
import { UsuarioApi } from './api/Usuario.api';

// APIs do sistema de organização
import { ItemToDoApi } from './api/ItemToDo.api';
import { QuadroKanbanApi } from './api/QuadroKanban.api';
import { TarefaKanbanApi } from './api/TarefaKanban.api';
import { TarefaToDoApi } from './api/TarefaToDo.api';

function main() {
    const api = Api.build();

    // Rotas principais
    UsuarioApi.build(api);
    CursoApi.build(api);
    MateriaApi.build(api);
    ArquivoApi.build(api);

    // Rotas do sistema de organização
    QuadroKanbanApi.build(api);
    TarefaKanbanApi.build(api);
    ItemToDoApi.build(api);
    TarefaToDoApi.build(api);

    api.start();
}

main();
