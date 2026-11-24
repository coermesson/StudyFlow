import { describe, expect, it } from "vitest";
import { createStudyFixture, deleteOwner, queryRows } from "../helpers/integration";

describe("Integração do módulo ItemToDo", () => {
  it("cria item, lista, busca, atualiza descrição e estado e exclui", async () => {
    let uid: string | undefined; let itemId: string | undefined; let listId: string | undefined;
    try {
      const f = await createStudyFixture(); uid = f.id; const client = f.client;
      const list = await client.post("/listas").send({ nome: "Lista de itens", materiaId: f.subjectId }); listId = list.body.id;
      expect((await client.get("/itens")).body).toEqual([]);
      expect((await client.post("/itens").send({ descricao: "", feito: false, listaId: listId })).status).toBe(400);
      const created = await client.post("/itens").send({ descricao: "Ler capítulo", feito: false, listaId: listId });
      expect(created.status).toBe(201); itemId = created.body.id;
      expect((await queryRows<any[]>("SELECT listaId, feito FROM ItemToDo WHERE id = ?", [itemId]))[0].listaId).toBe(listId);
      expect((await client.get("/itens")).body.map((x: any) => x.id)).toContain(itemId);
      expect((await client.get(`/itens/${itemId}`)).status).toBe(200);
      expect((await client.put(`/itens/${itemId}`).send({ feito: true, descricao: "Capítulo lido" })).body.feito).toBe(true);
      expect((await queryRows<any[]>("SELECT descricao, feito FROM ItemToDo WHERE id = ?", [itemId]))[0]).toMatchObject({ descricao: "Capítulo lido", feito: 1 });
      expect((await client.put(`/itens/${itemId}`).send({ feito: "sim" })).status).toBe(400);
      expect((await client.delete(`/itens/${itemId}`)).status).toBe(204);
      expect((await client.get(`/itens/${itemId}`)).status).toBe(404);
    } finally { if (uid) await deleteOwner(uid); }
  });

  it("rejeita lista inexistente e bloqueia acesso ao item de outro usuário", async () => {
    let uid: string | undefined; let otherUid: string | undefined;
    try {
      const f = await createStudyFixture(); uid = f.id;
      expect((await f.client.post("/itens").send({ descricao: "Órfão", feito: false, listaId: crypto.randomUUID() })).status).toBe(404);
      const list = await f.client.post("/listas").send({ nome: "Lista", materiaId: f.subjectId });
      const item = await f.client.post("/itens").send({ descricao: "Privado", feito: false, listaId: list.body.id });
      const other = await createStudyFixture(); otherUid = other.id;
      expect((await other.client.get(`/itens/${item.body.id}`)).status).toBe(404);
      expect((await other.client.put(`/itens/${item.body.id}`).send({ feito: true })).status).toBe(404);
      expect((await other.client.delete(`/itens/${item.body.id}`)).status).toBe(404);
    } finally { if (uid) await deleteOwner(uid); if (otherUid) await deleteOwner(otherUid); }
  });
});
