import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cleanupSafely, createStudyFixture, deleteOwner, queryRows } from "../helpers/integration";

interface ItemRow {
  id: string;
  descricao: string;
  feito: number;
  listaId: string;
}

describe("Integração do módulo ItemToDo", () => {
  it("retorna lista vazia quando o usuário não tem itens", async () => {
    const fixture = await createStudyFixture();
    try {
      const response = await fixture.client.get("/itens");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("valida campos e rejeita lista inexistente", async () => {
    const fixture = await createStudyFixture();
    try {
      const invalid = await fixture.client
        .post("/itens")
        .send({ descricao: "", feito: "sim", listaId: randomUUID() });
      expect(invalid.status).toBe(400);
      expect(invalid.body).toMatchObject({ erro: "Dados inválidos" });
      expect(invalid.body.detalhes).toEqual(expect.any(Array));

      const missing = await fixture.client
        .post("/itens")
        .send({ descricao: "Órfão", feito: false, listaId: randomUUID() });
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Lista não encontrada" });
      expect(await queryRows<ItemRow[]>(
        `SELECT item.id FROM ItemToDo item
         JOIN ListaToDo lista ON lista.id = item.listaId
         JOIN Materia materia ON materia.id = lista.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE curso.usuarioId = ?`,
        [fixture.id],
      )).toHaveLength(0);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("cria item com lista relacionada e verifica leitura e listagem", async () => {
    const fixture = await createStudyFixture();
    let itemId: string | undefined;
    try {
      const list = await fixture.client.post("/listas").send({ nome: "Estudos", materiaId: fixture.subjectId });
      expect(list.status).toBe(201);
      const listId = list.body.id as string;

      const created = await fixture.client
        .post("/itens")
        .send({ descricao: "Ler capítulo", feito: false, listaId: listId });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ descricao: "Ler capítulo", feito: false, listaId: listId });
      itemId = created.body.id as string;

      const [row] = await queryRows<ItemRow[]>("SELECT id, descricao, feito, listaId FROM ItemToDo WHERE id = ?", [itemId]);
      expect(row).toMatchObject({ id: itemId, descricao: "Ler capítulo", listaId: listId });
      expect(Number(row.feito)).toBe(0);

      const listResponse = await fixture.client.get("/itens");
      expect(listResponse.status).toBe(200);
      expect(listResponse.body).toContainEqual(expect.objectContaining({ id: itemId, listaId: listId }));
      const found = await fixture.client.get(`/itens/${itemId}`);
      expect(found.status).toBe(200);
      expect(found.body).toMatchObject({ id: itemId, descricao: "Ler capítulo", feito: false, listaId: listId });
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("atualiza descrição e estado e confirma alterações no banco", async () => {
    const fixture = await createStudyFixture();
    let itemId: string | undefined;
    try {
      const list = await fixture.client.post("/listas").send({ nome: "Estudos", materiaId: fixture.subjectId });
      const created = await fixture.client
        .post("/itens")
        .send({ descricao: "Ler capítulo", feito: false, listaId: list.body.id });
      itemId = created.body.id as string;

      const updated = await fixture.client
        .put(`/itens/${itemId}`)
        .send({ descricao: "Capítulo lido", feito: true });
      expect(updated.status).toBe(200);
      expect(updated.body).toMatchObject({ id: itemId, descricao: "Capítulo lido", feito: true });
      const [row] = await queryRows<ItemRow[]>("SELECT id, descricao, feito, listaId FROM ItemToDo WHERE id = ?", [itemId]);
      expect(row.descricao).toBe("Capítulo lido");
      expect(Number(row.feito)).toBe(1);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("retorna erro de validação e não altera item em atualização inválida", async () => {
    const fixture = await createStudyFixture();
    let itemId: string | undefined;
    try {
      const list = await fixture.client.post("/listas").send({ nome: "Estudos", materiaId: fixture.subjectId });
      const created = await fixture.client
        .post("/itens")
        .send({ descricao: "Original", feito: false, listaId: list.body.id });
      itemId = created.body.id as string;

      const invalid = await fixture.client.put(`/itens/${itemId}`).send({ feito: "sim" });
      expect(invalid.status).toBe(400);
      expect(invalid.body).toMatchObject({ erro: "Dados inválidos" });
      expect(invalid.body.detalhes).toEqual(expect.any(Array));
      const [row] = await queryRows<ItemRow[]>("SELECT id, descricao, feito, listaId FROM ItemToDo WHERE id = ?", [itemId]);
      expect(row.descricao).toBe("Original");
      expect(Number(row.feito)).toBe(0);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("retorna 404 para item inexistente e bloqueia acesso de outro usuário", async () => {
    const first = await createStudyFixture();
    let secondId: string | undefined;
    let itemId: string | undefined;
    try {
      const missing = await first.client.get(`/itens/${randomUUID()}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Item não encontrado" });

      const list = await first.client.post("/listas").send({ nome: "Estudos", materiaId: first.subjectId });
      const created = await first.client
        .post("/itens")
        .send({ descricao: "Privado", feito: false, listaId: list.body.id });
      itemId = created.body.id as string;
      const second = await createStudyFixture();
      secondId = second.id;

      const hidden = await second.client.get(`/itens/${itemId}`);
      expect(hidden.status).toBe(404);
      expect(hidden.body).toEqual({ erro: "Item não encontrado" });
      const update = await second.client.put(`/itens/${itemId}`).send({ feito: true });
      expect(update.status).toBe(404);
      expect(update.body).toEqual({ erro: "Item não encontrado" });
      const deletion = await second.client.delete(`/itens/${itemId}`);
      expect(deletion.status).toBe(404);
      expect(deletion.body).toEqual({ erro: "Item não encontrado" });
      expect(await queryRows<ItemRow[]>("SELECT id FROM ItemToDo WHERE id = ?", [itemId!])).toHaveLength(1);
    } finally {
      await cleanupSafely(() => deleteOwner(first.id));
      if (secondId) await cleanupSafely(() => deleteOwner(secondId!));
    }
  });

  it("exclui item e confirma ausência em leituras posteriores", async () => {
    const fixture = await createStudyFixture();
    let itemId: string | undefined;
    try {
      const list = await fixture.client.post("/listas").send({ nome: "Estudos", materiaId: fixture.subjectId });
      const created = await fixture.client
        .post("/itens")
        .send({ descricao: "Remover", feito: false, listaId: list.body.id });
      itemId = created.body.id as string;

      const response = await fixture.client.delete(`/itens/${itemId}`);
      expect(response.status).toBe(204);
      expect(await queryRows<ItemRow[]>("SELECT id FROM ItemToDo WHERE id = ?", [itemId])).toHaveLength(0);
      const missing = await fixture.client.get(`/itens/${itemId}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Item não encontrado" });
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });
});
