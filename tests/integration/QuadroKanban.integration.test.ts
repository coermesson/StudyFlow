import { describe, expect, it } from "vitest";
import { createStudyFixture, deleteOwner, queryRows } from "../helpers/integration";

describe("Integração do módulo QuadroKanban", () => {
  it("valida, cria, lista, busca, atualiza e exclui quadro com tarefas em cascata", async () => {
    let uid: string | undefined; let boardId: string | undefined; let taskId: string | undefined;
    try {
      const f = await createStudyFixture(); uid = f.id; const client = f.client;
      expect((await client.get("/quadros-kanban")).body).toEqual([]);
      expect((await client.post("/quadros-kanban").send({ nome: "", materiaId: f.subjectId })).status).toBe(400);
      const created = await client.post("/quadros-kanban").send({ nome: "Planejamento", materiaId: f.subjectId });
      expect(created.status).toBe(201); boardId = created.body.id;
      expect((await queryRows<any[]>("SELECT materiaId FROM QuadroKanban WHERE id = ?", [boardId]))[0].materiaId).toBe(f.subjectId);
      expect((await client.get("/quadros-kanban")).body.map((x: any) => x.id)).toContain(boardId);
      expect((await client.get(`/quadros-kanban/${boardId}`)).status).toBe(200);
      expect((await client.put(`/quadros-kanban/${boardId}`).send({ nome: "Quadro revisado" })).status).toBe(200);
      const task = await client.post("/tarefa").send({ titulo: "Tarefa", descricao: "Descrição", status: "a fazer", prioridade: "alta", quadroId: boardId });
      expect(task.status).toBe(201); taskId = task.body.id;
      expect((await client.delete(`/quadros-kanban/${boardId}`)).status).toBe(204);
      expect((await queryRows<any[]>("SELECT id FROM TarefaKanban WHERE id = ?", [taskId])).length).toBe(0);
    } finally { if (uid) await deleteOwner(uid); }
  });

  it("rejeita matéria inexistente e não permite acessar quadro alheio", async () => {
    let uid: string | undefined; let otherUid: string | undefined;
    try {
      const f = await createStudyFixture(); uid = f.id;
      expect((await f.client.post("/quadros-kanban").send({ nome: "Órfão", materiaId: crypto.randomUUID() })).status).toBe(404);
      const board = await f.client.post("/quadros-kanban").send({ nome: "Privado", materiaId: f.subjectId });
      const other = await createStudyFixture(); otherUid = other.id;
      expect((await other.client.get(`/quadros-kanban/${board.body.id}`)).status).toBe(404);
      expect((await other.client.put(`/quadros-kanban/${board.body.id}`).send({ nome: "Invadir" })).status).toBe(404);
      expect((await other.client.delete(`/quadros-kanban/${board.body.id}`)).status).toBe(404);
    } finally { if (uid) await deleteOwner(uid); if (otherUid) await deleteOwner(otherUid); }
  });
});
