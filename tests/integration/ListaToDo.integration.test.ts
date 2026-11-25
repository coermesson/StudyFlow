import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cleanupSafely, createStudyFixture, deleteOwner, queryRows } from "../helpers/integration";

interface ListaRow {
  id: string;
  nome: string;
  materiaId: string;
}

describe("Integração do módulo ListaToDo", () => {
  it("retorna lista vazia para matéria sem listas", async () => {
    const fixture = await createStudyFixture();
    try {
      const response = await fixture.client.get("/listas");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("valida os campos e retorna erro quando matéria não existe", async () => {
    const fixture = await createStudyFixture();
    try {
      const invalid = await fixture.client.post("/listas").send({ nome: "", materiaId: fixture.subjectId });
      expect(invalid.status).toBe(400);
      expect(invalid.body).toMatchObject({ erro: "Dados inválidos" });
      expect(invalid.body.detalhes).toEqual(expect.any(Array));

      const missing = await fixture.client
        .post("/listas")
        .send({ nome: "Sem matéria", materiaId: randomUUID() });
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Matéria não encontrada" });
      expect(await queryRows<ListaRow[]>("SELECT id FROM ListaToDo WHERE materiaId = ?", [fixture.subjectId])).toHaveLength(0);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("cria lista com relação correta, lista e busca os dados", async () => {
    const fixture = await createStudyFixture();
    let listId: string | undefined;
    try {
      const created = await fixture.client
        .post("/listas")
        .send({ nome: "Revisão semanal", materiaId: fixture.subjectId });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ nome: "Revisão semanal", materiaId: fixture.subjectId });
      listId = created.body.id as string;

      const [row] = await queryRows<ListaRow[]>("SELECT id, nome, materiaId FROM ListaToDo WHERE id = ?", [listId]);
      expect(row).toEqual({ id: listId, nome: "Revisão semanal", materiaId: fixture.subjectId });

      const list = await fixture.client.get("/listas");
      expect(list.status).toBe(200);
      expect(list.body).toContainEqual(expect.objectContaining({ id: listId, nome: "Revisão semanal" }));

      const found = await fixture.client.get(`/listas/${listId}`);
      expect(found.status).toBe(200);
      expect(found.body).toMatchObject({ id: listId, materiaId: fixture.subjectId });
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("atualiza nome e confirma persistência", async () => {
    const fixture = await createStudyFixture();
    let listId: string | undefined;
    try {
      const created = await fixture.client.post("/listas").send({ nome: "Antes", materiaId: fixture.subjectId });
      listId = created.body.id as string;

      const updated = await fixture.client.put(`/listas/${listId}`).send({ nome: "Depois" });
      expect(updated.status).toBe(200);
      expect(updated.body).toMatchObject({ id: listId, nome: "Depois" });
      const [row] = await queryRows<ListaRow[]>("SELECT id, nome, materiaId FROM ListaToDo WHERE id = ?", [listId]);
      expect(row.nome).toBe("Depois");
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("rejeita atualização vazia e mantém a lista original", async () => {
    const fixture = await createStudyFixture();
    let listId: string | undefined;
    try {
      const created = await fixture.client.post("/listas").send({ nome: "Original", materiaId: fixture.subjectId });
      listId = created.body.id as string;

      const response = await fixture.client.put(`/listas/${listId}`).send({});
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ erro: "Nenhum campo atualizável informado" });
      const [row] = await queryRows<ListaRow[]>("SELECT id, nome, materiaId FROM ListaToDo WHERE id = ?", [listId]);
      expect(row.nome).toBe("Original");
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("retorna 404 para lista inexistente e oculta lista de outro usuário", async () => {
    const first = await createStudyFixture();
    let secondId: string | undefined;
    let listId: string | undefined;
    try {
      const missing = await first.client.get(`/listas/${randomUUID()}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Lista não encontrada" });

      const created = await first.client.post("/listas").send({ nome: "Privada", materiaId: first.subjectId });
      listId = created.body.id as string;
      const second = await createStudyFixture();
      secondId = second.id;

      const hidden = await second.client.get(`/listas/${listId}`);
      expect(hidden.status).toBe(404);
      expect(hidden.body).toEqual({ erro: "Lista não encontrada" });
      const denied = await second.client.delete(`/listas/${listId}`);
      expect(denied.status).toBe(404);
      expect(denied.body).toEqual({ erro: "Lista não encontrada" });
      expect(await queryRows<ListaRow[]>("SELECT id FROM ListaToDo WHERE id = ?", [listId!])).toHaveLength(1);
    } finally {
      await cleanupSafely(() => deleteOwner(first.id));
      if (secondId) await cleanupSafely(() => deleteOwner(secondId!));
    }
  });

  it("exclui lista e remove seus itens relacionados", async () => {
    const fixture = await createStudyFixture();
    let itemId: string | undefined;
    try {
      const list = await fixture.client.post("/listas").send({ nome: "Com item", materiaId: fixture.subjectId });
      const listId = list.body.id as string;
      const item = await fixture.client.post("/itens").send({ descricao: "Dependente", feito: false, listaId: listId });
      expect(item.status).toBe(201);
      itemId = item.body.id as string;

      const response = await fixture.client.delete(`/listas/${listId}`);
      expect(response.status).toBe(204);
      expect(await queryRows<ListaRow[]>("SELECT id FROM ListaToDo WHERE id = ?", [listId])).toHaveLength(0);
      expect(await queryRows<{ id: string }[]>("SELECT id FROM ItemToDo WHERE id = ?", [itemId])).toHaveLength(0);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });
});
