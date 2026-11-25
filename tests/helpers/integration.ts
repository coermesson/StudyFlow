import "reflect-metadata";
import request from "supertest";
import { afterAll, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import { Api } from "../../src/api/api";
import { UsuarioApi } from "../../src/api/Usuario.api";
import { CursoApi } from "../../src/api/Curso.api";
import { MateriaApi } from "../../src/api/Materia.api";
import { ArquivoApi } from "../../src/api/Arquivo.api";
import { ListaToDoApi } from "../../src/api/ListaToDo.api";
import { ItemToDoApi } from "../../src/api/ItemToDo.api";
import { QuadroKanbanApi } from "../../src/api/QuadroKanban.api";
import { TarefaKanbanApi } from "../../src/api/TarefaKanban.api";
import conexao from "../../src/util/conexao";
import { registerDatabaseCleanup } from "./database";

process.env.SESSION_SECRET ??= "studyflow-integration-test-secret";
process.env.UPLOAD_DIR ??= `${process.cwd()}/test-results/integration-uploads`;

const api = Api.build();
UsuarioApi.build(api);
CursoApi.build(api);
MateriaApi.build(api);
ArquivoApi.build(api);
ListaToDoApi.build(api);
ItemToDoApi.build(api);
QuadroKanbanApi.build(api);
TarefaKanbanApi.build(api);

export const app = api.app;
// This test-only endpoint creates a real session cookie; route auth remains enabled.
app.post("/__test/session/:id", (req, res) => {
  (req.session as typeof req.session & { usuarioId?: string }).usuarioId = req.params.id;
  res.sendStatus(204);
});
api.configurarRotasFinais();

export const newAgent = () => request.agent(app);
export const uniqueEmail = () => `${randomUUID()}@integration.test`;
export const queryRows = async <T>(query: string, values: unknown[] = []): Promise<T> => {
  const [rows] = await conexao.query(query, values);
  return rows as T;
};
export const closeDatabase = () => conexao.end();
beforeAll(async () => {
  await queryRows("SELECT 1");
});
afterAll(closeDatabase);

export async function createOwner(client = newAgent()) {
  const email = uniqueEmail();
  let id: string | undefined;
  try {
    const response = await request(app).post("/usuarios").send({
      nome: "Usuário de integração", email, senha: "senha-teste",
    });
    if (response.status !== 201) throw new Error(`Falha ao criar usuário de fixture: ${response.status} ${JSON.stringify(response.body)}`);
    id = response.body.id as string;
    if (!id) throw new Error("Resposta de criação não retornou o ID do usuário de fixture");
    registerOwnerCleanup(id);
    await client.post(`/__test/session/${id}`).expect(204);
    return { id, client };
  } catch (error) {
    await cleanupSafely(async () => {
      if (id) await deleteOwner(id);
    });
    throw error;
  }
}

export async function createStudyFixture(client = newAgent()) {
  const owner = await createOwner(client);
  try {
    const course = await client.post("/cursos").send({ nome: "Curso fixture" });
    if (course.status !== 201) throw new Error(`Falha ao criar curso de fixture: ${course.status} ${JSON.stringify(course.body)}`);
    const subject = await client.post("/materias").send({ nome: "Matéria fixture", cursoId: course.body.id });
    if (subject.status !== 201) throw new Error(`Falha ao criar matéria de fixture: ${subject.status} ${JSON.stringify(subject.body)}`);
    return { ...owner, courseId: course.body.id as string, subjectId: subject.body.id as string };
  } catch (error) {
    await cleanupSafely(() => deleteOwner(owner.id));
    throw error;
  }
}

export async function deleteOwner(id: string) {
  await queryRows<unknown>("DELETE FROM Usuario WHERE id = ?", [id]);
}

export function registerOwnerCleanup(id: string): void {
  registerDatabaseCleanup(() => deleteOwner(id));
}

export async function cleanupSafely(cleanup: () => Promise<unknown>): Promise<void> {
  try {
    await cleanup();
  } catch (error) {
    console.error("Falha ao limpar dados criados pelo teste de integração", error);
  }
}
