import { describe, expect, it } from "vitest";
import { createStudyFixture, deleteOwner, queryRows } from "../helpers/integration";

describe("Integração do módulo ListaToDo", () => {
  it("valida, cria, lista, busca, atualiza e exclui uma lista", async () => {
    let uid: string | undefined; let listId: string | undefined;
    try {
      const f = await createStudyFixture(); uid = f.id; const client = f.client;
      expect((await client.get("/listas")).body).toEqual([]);
      expect((await client.post("/listas").send({ nome: "", materiaId: f.subjectId })).status).toBe(400);
      const created = await client.post("/listas").send({ nome: "Revisão", materiaId: f.subjectId });
      expect(created.status).toBe(201); listId = created.body.id;
      expect((await queryRows<any[]>("SELECT materiaId FROM ListaToDo WHERE id = ?", [listId]))[0].materiaId).toBe(f.subjectId);
      expect((await client.get("/listas")).body.map((x: any) => x.id)).toContain(listId);
      expect((await client.get(`/listas/${listId}`)).status).toBe(200);
      expect((await client.put(`/listas/${listId}`).send({ nome: "Revisão atualizada" })).status).toBe(200);
      expect((await client.put(`/listas/${listId}`).send({})).status).toBe(400);
      expect((await client.delete(`/listas/${listId}`)).status).toBe(204);
      expect((await client.get(`/listas/${listId}`)).status).toBe(404);
      expect((await queryRows<any[]>("SELECT id FROM ListaToDo WHERE id = ?", [listId])).length).toBe(0);
    } finally { if (uid) await deleteOwner(uid); }
  });

  it("rejeita matéria inexistente e não expõe lista de outro usuário", async () => {
    let uid: string | undefined; let otherUid: string | undefined;
    try {
      const f = await createStudyFixture(); uid = f.id;
      expect((await f.client.post("/listas").send({ nome: "Órfã", materiaId: crypto.randomUUID() })).status).toBe(404);
      const list = await f.client.post("/listas").send({ nome: "Privada", materiaId: f.subjectId });
      const other = await createStudyFixture(); otherUid = other.id;
      expect((await other.client.get(`/listas/${list.body.id}`)).status).toBe(404);
      expect((await other.client.delete(`/listas/${list.body.id}`)).status).toBe(404);
    } finally { if (uid) await deleteOwner(uid); if (otherUid) await deleteOwner(otherUid); }
  });
});
