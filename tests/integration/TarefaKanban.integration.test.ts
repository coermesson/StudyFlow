import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { cleanupSafely, createStudyFixture, deleteOwner, queryRows } from "../helpers/integration";

interface TarefaRow {
  id: string;
  titulo: string;
  descricao: string;
  status: string;
  prioridade: string;
  quadroId: string;
}

describe("Integração do módulo TarefaKanban", () => {
  it("retorna lista vazia quando usuário não possui tarefas", async () => {
    const fixture = await createStudyFixture();
    try {
      const response = await fixture.client.get("/tarefa");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("rejeita campos e enums inválidos com detalhes", async () => {
    const fixture = await createStudyFixture();
    try {
      const board = await fixture.client.post("/quadros-kanban").send({ nome: "Quadro", materiaId: fixture.subjectId });
      const invalid = await fixture.client
        .post("/tarefa")
        .send({ titulo: "Inválida", descricao: "x", status: "desconhecido", prioridade: "alta", quadroId: board.body.id });
      expect(invalid.status).toBe(400);
      expect(invalid.body).toMatchObject({ erro: "Dados inválidos" });
      expect(invalid.body.detalhes).toEqual(expect.any(Array));
      expect(await queryRows<TarefaRow[]>("SELECT id FROM TarefaKanban WHERE quadroId = ?", [board.body.id])).toHaveLength(0);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("rejeita quadro inexistente sem criar tarefa", async () => {
    const fixture = await createStudyFixture();
    try {
      const response = await fixture.client
        .post("/tarefa")
        .send({ titulo: "Órfã", descricao: "x", status: "a fazer", prioridade: "alta", quadroId: randomUUID() });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ erro: "Quadro não encontrado" });
      expect(await queryRows<TarefaRow[]>(
        `SELECT tarefa.id FROM TarefaKanban tarefa
         JOIN QuadroKanban quadro ON quadro.id = tarefa.quadroId
         JOIN Materia materia ON materia.id = quadro.materiaId
         JOIN Curso curso ON curso.id = materia.cursoId
         WHERE curso.usuarioId = ?`,
        [fixture.id],
      )).toHaveLength(0);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("cria tarefa, mantém vínculo e retorna dados em listagem e busca", async () => {
    const fixture = await createStudyFixture();
    let taskId: string | undefined;
    try {
      const board = await fixture.client.post("/quadros-kanban").send({ nome: "Quadro", materiaId: fixture.subjectId });
      const created = await fixture.client
        .post("/tarefa")
        .send({ titulo: "Estudar", descricao: "Capítulo 1", status: "a fazer", prioridade: "média", quadroId: board.body.id });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ titulo: "Estudar", descricao: "Capítulo 1", status: "a fazer", prioridade: "média", quadroId: board.body.id });
      taskId = created.body.id as string;

      const [row] = await queryRows<TarefaRow[]>("SELECT id, titulo, descricao, status, prioridade, quadroId FROM TarefaKanban WHERE id = ?", [taskId]);
      expect(row).toMatchObject({ id: taskId, titulo: "Estudar", descricao: "Capítulo 1", status: "a fazer", prioridade: "média", quadroId: board.body.id });
      const list = await fixture.client.get("/tarefa");
      expect(list.status).toBe(200);
      expect(list.body).toContainEqual(expect.objectContaining({ id: taskId, quadroId: board.body.id }));
      const found = await fixture.client.get(`/tarefa/${taskId}`);
      expect(found.status).toBe(200);
      expect(found.body).toMatchObject({ id: taskId, titulo: "Estudar", quadroId: board.body.id });
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("atualiza tarefa e persiste título e status", async () => {
    const fixture = await createStudyFixture();
    let taskId: string | undefined;
    try {
      const board = await fixture.client.post("/quadros-kanban").send({ nome: "Quadro", materiaId: fixture.subjectId });
      const created = await fixture.client
        .post("/tarefa")
        .send({ titulo: "Pendente", descricao: "Capítulo", status: "a fazer", prioridade: "baixa", quadroId: board.body.id });
      taskId = created.body.id as string;

      const updated = await fixture.client.put(`/tarefa/${taskId}`).send({ titulo: "Concluída", status: "feito" });
      expect(updated.status).toBe(200);
      expect(updated.body).toMatchObject({ id: taskId, titulo: "Concluída", status: "feito" });
      const [row] = await queryRows<TarefaRow[]>("SELECT id, titulo, descricao, status, prioridade, quadroId FROM TarefaKanban WHERE id = ?", [taskId]);
      expect(row).toMatchObject({ titulo: "Concluída", status: "feito" });
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("rejeita atualização vazia e inválida sem alterar tarefa", async () => {
    const fixture = await createStudyFixture();
    let taskId: string | undefined;
    try {
      const board = await fixture.client.post("/quadros-kanban").send({ nome: "Quadro", materiaId: fixture.subjectId });
      const created = await fixture.client
        .post("/tarefa")
        .send({ titulo: "Original", descricao: "Capítulo", status: "a fazer", prioridade: "baixa", quadroId: board.body.id });
      taskId = created.body.id as string;

      const empty = await fixture.client.put(`/tarefa/${taskId}`).send({});
      expect(empty.status).toBe(400);
      expect(empty.body).toEqual({ erro: "Nenhum campo atualizável informado" });
      const invalid = await fixture.client.put(`/tarefa/${taskId}`).send({ status: "desconhecido" });
      expect(invalid.status).toBe(400);
      expect(invalid.body).toMatchObject({ erro: "Dados inválidos" });
      expect(invalid.body.detalhes).toEqual(expect.any(Array));

      const [row] = await queryRows<TarefaRow[]>("SELECT id, titulo, descricao, status, prioridade, quadroId FROM TarefaKanban WHERE id = ?", [taskId]);
      expect(row).toMatchObject({ titulo: "Original", status: "a fazer" });
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("retorna 404 para tarefa inexistente e bloqueia recursos de outro usuário", async () => {
    const first = await createStudyFixture();
    let secondId: string | undefined;
    let taskId: string | undefined;
    try {
      const missing = await first.client.get(`/tarefa/${randomUUID()}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Tarefa não encontrada" });

      const board = await first.client.post("/quadros-kanban").send({ nome: "Quadro", materiaId: first.subjectId });
      const task = await first.client
        .post("/tarefa")
        .send({ titulo: "Privada", descricao: "x", status: "a fazer", prioridade: "baixa", quadroId: board.body.id });
      taskId = task.body.id as string;
      const second = await createStudyFixture();
      secondId = second.id;

      const hidden = await second.client.get(`/tarefa/${taskId}`);
      expect(hidden.status).toBe(404);
      expect(hidden.body).toEqual({ erro: "Tarefa não encontrada" });
      const update = await second.client.put(`/tarefa/${taskId}`).send({ status: "feito" });
      expect(update.status).toBe(404);
      expect(update.body).toEqual({ erro: "Tarefa não encontrada" });
      const deletion = await second.client.delete(`/tarefa/${taskId}`);
      expect(deletion.status).toBe(404);
      expect(deletion.body).toEqual({ erro: "Tarefa não encontrada" });
      expect(await queryRows<TarefaRow[]>("SELECT id FROM TarefaKanban WHERE id = ?", [taskId!])).toHaveLength(1);
    } finally {
      await cleanupSafely(() => deleteOwner(first.id));
      if (secondId) await cleanupSafely(() => deleteOwner(secondId!));
    }
  });

  it("exclui tarefa e confirma ausência no banco", async () => {
    const fixture = await createStudyFixture();
    let taskId: string | undefined;
    try {
      const board = await fixture.client.post("/quadros-kanban").send({ nome: "Quadro", materiaId: fixture.subjectId });
      const created = await fixture.client
        .post("/tarefa")
        .send({ titulo: "Remover", descricao: "x", status: "a fazer", prioridade: "baixa", quadroId: board.body.id });
      taskId = created.body.id as string;

      const response = await fixture.client.delete(`/tarefa/${taskId}`);
      expect(response.status).toBe(204);
      expect(await queryRows<TarefaRow[]>("SELECT id FROM TarefaKanban WHERE id = ?", [taskId])).toHaveLength(0);
      const missing = await fixture.client.get(`/tarefa/${taskId}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Tarefa não encontrada" });
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });
});
