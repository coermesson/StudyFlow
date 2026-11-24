import { describe, expect, it } from "vitest";
import { createStudyFixture, deleteOwner, queryRows } from "../helpers/integration";

describe("Integração do módulo TarefaKanban", () => {
  it("valida, cria, lista, busca, atualiza e exclui tarefa", async () => {
    let uid: string | undefined; let boardId: string | undefined; let taskId: string | undefined;
    try {
      const f = await createStudyFixture(); uid = f.id; const client = f.client;
      const board = await client.post("/quadros-kanban").send({ nome: "Quadro", materiaId: f.subjectId }); boardId = board.body.id;
      expect((await client.get("/tarefa")).body).toEqual([]);
      expect((await client.post("/tarefa").send({ titulo: "Incompleta" })).status).toBe(400);
      expect((await client.post("/tarefa").send({ titulo: "Invalida", descricao: "x", status: "inválido", prioridade: "alta", quadroId: boardId })).status).toBe(400);
      const created = await client.post("/tarefa").send({ titulo: "Estudar", descricao: "Capítulo 1", status: "a fazer", prioridade: "média", quadroId: boardId });
      expect(created.status).toBe(201); taskId = created.body.id;
      expect((await queryRows<any[]>("SELECT quadroId, status FROM TarefaKanban WHERE id = ?", [taskId]))[0]).toMatchObject({ quadroId: boardId, status: "a fazer" });
      expect((await client.get("/tarefa")).body.map((x: any) => x.id)).toContain(taskId);
      expect((await client.get(`/tarefa/${taskId}`)).status).toBe(200);
      expect((await client.put(`/tarefa/${taskId}`).send({ status: "feito", titulo: "Concluído" })).status).toBe(200);
      expect((await queryRows<any[]>("SELECT titulo, status FROM TarefaKanban WHERE id = ?", [taskId]))[0]).toMatchObject({ titulo: "Concluído", status: "feito" });
      expect((await client.put(`/tarefa/${taskId}`).send({})).status).toBe(400);
      expect((await client.delete(`/tarefa/${taskId}`)).status).toBe(204);
      expect((await client.get(`/tarefa/${taskId}`)).status).toBe(404);
    } finally { if (uid) await deleteOwner(uid); }
  });

  it("rejeita quadro inexistente e impede leitura, alteração e exclusão por outro usuário", async () => {
    let uid: string | undefined; let otherUid: string | undefined;
    try {
      const f = await createStudyFixture(); uid = f.id;
      expect((await f.client.post("/tarefa").send({ titulo: "Órfã", descricao: "x", status: "a fazer", prioridade: "alta", quadroId: crypto.randomUUID() })).status).toBe(404);
      const board = await f.client.post("/quadros-kanban").send({ nome: "Quadro", materiaId: f.subjectId });
      const task = await f.client.post("/tarefa").send({ titulo: "Privada", descricao: "x", status: "a fazer", prioridade: "baixa", quadroId: board.body.id });
      const other = await createStudyFixture(); otherUid = other.id;
      expect((await other.client.get(`/tarefa/${task.body.id}`)).status).toBe(404);
      expect((await other.client.put(`/tarefa/${task.body.id}`).send({ status: "feito" })).status).toBe(404);
      expect((await other.client.delete(`/tarefa/${task.body.id}`)).status).toBe(404);
      expect((await queryRows<any[]>("SELECT status FROM TarefaKanban WHERE id = ?", [task.body.id]))[0].status).toBe("a fazer");
    } finally { if (uid) await deleteOwner(uid); if (otherUid) await deleteOwner(otherUid); }
  });
});
