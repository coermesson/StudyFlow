import 'reflect-metadata';
import { Api } from "./api/api";


import { ArquivoApi } from './api/Arquivo.api';
import { CursoApi } from './api/Curso.api';
import { MateriaApi } from './api/Materia.api';
import { UsuarioApi } from './api/Usuario.api';


import { ItemToDoApi } from './api/ItemToDo.api';
import { ListaToDoApi } from './api/ListaToDo.api';
import { QuadroKanbanApi } from './api/QuadroKanban.api';
import { TarefaKanbanApi } from './api/TarefaKanban.api';



function main() {
    const api = Api.build();

    ListaToDoApi.build(api);
    UsuarioApi.build(api);
    CursoApi.build(api);
    MateriaApi.build(api);
    ArquivoApi.build(api);


    QuadroKanbanApi.build(api);
    TarefaKanbanApi.build(api);
    ItemToDoApi.build(api);


    api.start();
}

main();
