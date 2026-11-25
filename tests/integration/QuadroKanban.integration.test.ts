import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cleanupSafely, createStudyFixture, deleteOwner, queryRows } from "../helpers/integration";

interface QuadroRow {
  id: string;
  nome: string;
  materiaId: string;
}

describe("Integração do módulo QuadroKanban", () => {
  it("retorna lista vazia para matéria sem quadros", async () => {
    const fixture = await createStudyFixture();
    try {
      const response = await fixture.client.get("/quadros-kanban");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("rejeita dados inválidos e matéria inexistente", async () => {
    const fixture = await createStudyFixture();
    try {
      const invalid = await fixture.client
        .post("/quadros-kanban")
        .send({ nome: "", materiaId: fixture.subjectId });
      expect(invalid.status).toBe(400);
      expect(invalid.body).toMatchObject({ erro: "Dados inválidos" });
      expect(invalid.body.detalhes).toEqual(expect.any(Array));

      const missing = await fixture.client
        .post("/quadros-kanban")
        .send({ nome: "Órfão", materiaId: randomUUID() });
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Matéria não encontrada" });
      expect(await queryRows<QuadroRow[]>("SELECT id FROM QuadroKanban WHERE materiaId = ?", [fixture.subjectId])).toHaveLength(0);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("cria quadro relacionado e verifica listagem e busca", async () => {
    const fixture = await createStudyFixture();
    let boardId: string | undefined;
    try {
      const created = await fixture.client
        .post("/quadros-kanban")
        .send({ nome: "Planejamento", materiaId: fixture.subjectId });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ nome: "Planejamento", materiaId: fixture.subjectId });
      boardId = created.body.id as string;

      const [row] = await queryRows<QuadroRow[]>("SELECT id, nome, materiaId FROM QuadroKanban WHERE id = ?", [boardId]);
      expect(row).toEqual({ id: boardId, nome: "Planejamento", materiaId: fixture.subjectId });
      const list = await fixture.client.get("/quadros-kanban");
      expect(list.status).toBe(200);
      expect(list.body).toContainEqual(expect.objectContaining({ id: boardId, nome: "Planejamento" }));
      const found = await fixture.client.get(`/quadros-kanban/${boardId}`);
      expect(found.status).toBe(200);
      expect(found.body).toMatchObject({ id: boardId, materiaId: fixture.subjectId });
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("atualiza nome e persiste o novo valor", async () => {
    const fixture = await createStudyFixture();
    let boardId: string | undefined;
    try {
      const created = await fixture.client.post("/quadros-kanban").send({ nome: "Original", materiaId: fixture.subjectId });
      boardId = created.body.id as string;
      const updated = await fixture.client.put(`/quadros-kanban/${boardId}`).send({ nome: "Atualizado" });
      expect(updated.status).toBe(200);
      expect(updated.body).toMatchObject({ id: boardId, nome: "Atualizado" });
      const [row] = await queryRows<QuadroRow[]>("SELECT id, nome, materiaId FROM QuadroKanban WHERE id = ?", [boardId]);
      expect(row.nome).toBe("Atualizado");
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("rejeita atualização sem campos e mantém o quadro", async () => {
    const fixture = await createStudyFixture();
    let boardId: string | undefined;
    try {
      const created = await fixture.client.post("/quadros-kanban").send({ nome: "Original", materiaId: fixture.subjectId });
      boardId = created.body.id as string;
      const response = await fixture.client.put(`/quadros-kanban/${boardId}`).send({});
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ erro: "Nenhum campo atualizável informado" });
      const [row] = await queryRows<QuadroRow[]>("SELECT id, nome, materiaId FROM QuadroKanban WHERE id = ?", [boardId]);
      expect(row.nome).toBe("Original");
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("retorna 404 para quadro inexistente e impede acesso entre usuários", async () => {
    const first = await createStudyFixture();
    let secondId: string | undefined;
    let boardId: string | undefined;
    try {
      const missing = await first.client.get(`/quadros-kanban/${randomUUID()}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Quadro não encontrado" });

      const created = await first.client
        .post("/quadros-kanban")
        .send({ nome: "Privado", materiaId: first.subjectId });
      boardId = created.body.id as string;
      const second = await createStudyFixture();
      secondId = second.id;

      const hidden = await second.client.get(`/quadros-kanban/${boardId}`);
      expect(hidden.status).toBe(404);
      expect(hidden.body).toEqual({ erro: "Quadro não encontrado" });
      const update = await second.client.put(`/quadros-kanban/${boardId}`).send({ nome: "Invadir" });
      expect(update.status).toBe(404);
      expect(update.body).toEqual({ erro: "Quadro não encontrado" });
      const deletion = await second.client.delete(`/quadros-kanban/${boardId}`);
      expect(deletion.status).toBe(404);
      expect(deletion.body).toEqual({ erro: "Quadro não encontrado" });
      expect(await queryRows<QuadroRow[]>("SELECT id FROM QuadroKanban WHERE id = ?", [boardId!])).toHaveLength(1);
    } finally {
      await cleanupSafely(() => deleteOwner(first.id));
      if (secondId) await cleanupSafely(() => deleteOwner(secondId!));
    }
  });

  it("exclui quadro e remove tarefas dependentes", async () => {
    const fixture = await createStudyFixture();
    let boardId: string | undefined;
    let taskId: string | undefined;
    try {
      const board = await fixture.client.post("/quadros-kanban").send({ nome: "Com tarefa", materiaId: fixture.subjectId });
      boardId = board.body.id as string;
      const task = await fixture.client
        .post("/tarefa")
        .send({ titulo: "Dependente", descricao: "Teste", status: "a fazer", prioridade: "baixa", quadroId: boardId });
      expect(task.status).toBe(201);
      taskId = task.body.id as string;

      const deleted = await fixture.client.delete(`/quadros-kanban/${boardId}`);
      expect(deleted.status).toBe(204);
      expect(await queryRows<QuadroRow[]>("SELECT id FROM QuadroKanban WHERE id = ?", [boardId])).toHaveLength(0);
      expect(await queryRows<{ id: string }[]>("SELECT id FROM TarefaKanban WHERE id = ?", [taskId])).toHaveLength(0);
      const missing = await fixture.client.get(`/quadros-kanban/${boardId}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Quadro não encontrado" });
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });
});
