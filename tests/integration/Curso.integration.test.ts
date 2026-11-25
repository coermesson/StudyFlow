import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  cleanupSafely,
  createOwner,
  deleteOwner,
  queryRows,
} from "../helpers/integration";

interface CursoRow {
  id: string;
  nome: string;
  usuarioId: string;
}

describe("Integração do módulo Curso", () => {
  it("retorna lista vazia para um usuário sem cursos", async () => {
    const owner = await createOwner();
    try {
      const response = await owner.client.get("/cursos");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    } finally {
      await cleanupSafely(() => deleteOwner(owner.id));
    }
  });

  it("rejeita nome inválido com detalhes de validação", async () => {
    const owner = await createOwner();
    try {
      const response = await owner.client.post("/cursos").send({ nome: "" });
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ erro: "Dados inválidos" });
      expect(response.body.detalhes).toEqual(expect.any(Array));
      expect(await queryRows<CursoRow[]>("SELECT id FROM Curso WHERE usuarioId = ?", [owner.id])).toHaveLength(0);
    } finally {
      await cleanupSafely(() => deleteOwner(owner.id));
    }
  });

  it("cria curso, associa ao usuário e retorna o curso nas leituras", async () => {
    const owner = await createOwner();
    let courseId: string | undefined;
    try {
      const created = await owner.client.post("/cursos").send({ nome: "Curso A" });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ nome: "Curso A", usuarioId: owner.id });
      courseId = created.body.id as string;

      const [row] = await queryRows<CursoRow[]>("SELECT id, nome, usuarioId FROM Curso WHERE id = ?", [courseId]);
      expect(row).toEqual({ id: courseId, nome: "Curso A", usuarioId: owner.id });

      const listed = await owner.client.get("/cursos");
      expect(listed.status).toBe(200);
      expect(listed.body).toContainEqual(expect.objectContaining({ id: courseId, nome: "Curso A" }));

      const found = await owner.client.get(`/cursos/${courseId}`);
      expect(found.status).toBe(200);
      expect(found.body).toMatchObject({ id: courseId, usuarioId: owner.id });
    } finally {
      await cleanupSafely(() => deleteOwner(owner.id));
    }
  });

  it("atualiza nome e persiste a alteração", async () => {
    const owner = await createOwner();
    let courseId: string | undefined;
    try {
      const created = await owner.client.post("/cursos").send({ nome: "Curso original" });
      courseId = created.body.id as string;

      const updated = await owner.client.put(`/cursos/${courseId}`).send({ nome: "Curso revisado" });
      expect(updated.status).toBe(200);
      expect(updated.body).toMatchObject({ id: courseId, nome: "Curso revisado" });
      const [row] = await queryRows<CursoRow[]>("SELECT id, nome, usuarioId FROM Curso WHERE id = ?", [courseId]);
      expect(row.nome).toBe("Curso revisado");
    } finally {
      await cleanupSafely(() => deleteOwner(owner.id));
    }
  });

  it("rejeita atualização vazia e preserva os dados existentes", async () => {
    const owner = await createOwner();
    let courseId: string | undefined;
    try {
      const created = await owner.client.post("/cursos").send({ nome: "Curso original" });
      courseId = created.body.id as string;

      const response = await owner.client.put(`/cursos/${courseId}`).send({});
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ erro: "Nenhum campo atualizável informado" });
      const [row] = await queryRows<CursoRow[]>("SELECT id, nome, usuarioId FROM Curso WHERE id = ?", [courseId]);
      expect(row.nome).toBe("Curso original");
    } finally {
      await cleanupSafely(() => deleteOwner(owner.id));
    }
  });

  it("retorna 404 com mensagem para curso inexistente", async () => {
    const owner = await createOwner();
    try {
      const response = await owner.client.get(`/cursos/${randomUUID()}`);
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ erro: "Curso não encontrado" });
    } finally {
      await cleanupSafely(() => deleteOwner(owner.id));
    }
  });

  it("oculta curso de outro usuário e não permite modificá-lo", async () => {
    const first = await createOwner();
    let secondId: string | undefined;
    let courseId: string | undefined;
    try {
      const created = await first.client.post("/cursos").send({ nome: "Privado" });
      courseId = created.body.id as string;
      const second = await createOwner();
      secondId = second.id;

      const get = await second.client.get(`/cursos/${courseId}`);
      expect(get.status).toBe(404);
      expect(get.body).toEqual({ erro: "Curso não encontrado" });
      const update = await second.client.put(`/cursos/${courseId}`).send({ nome: "Alterado" });
      expect(update.status).toBe(404);
      expect(update.body).toEqual({ erro: "Curso não encontrado" });
      const remove = await second.client.delete(`/cursos/${courseId}`);
      expect(remove.status).toBe(404);
      expect(remove.body).toEqual({ erro: "Curso não encontrado" });

      const [row] = await queryRows<CursoRow[]>("SELECT id, nome, usuarioId FROM Curso WHERE id = ?", [courseId]);
      expect(row).toMatchObject({ nome: "Privado", usuarioId: first.id });
    } finally {
      await cleanupSafely(() => deleteOwner(first.id));
      if (secondId) await cleanupSafely(() => deleteOwner(secondId!));
    }
  });

  it("exclui curso e remove registros dependentes", async () => {
    const owner = await createOwner();
    let courseId: string | undefined;
    let subjectId: string | undefined;
    try {
      const course = await owner.client.post("/cursos").send({ nome: "Com dependente" });
      courseId = course.body.id as string;
      const subject = await owner.client.post("/materias").send({ nome: "Matéria", cursoId: courseId });
      expect(subject.status).toBe(201);
      subjectId = subject.body.id as string;

      const response = await owner.client.delete(`/cursos/${courseId}`);
      expect(response.status).toBe(204);
      expect(await queryRows<CursoRow[]>("SELECT id FROM Curso WHERE id = ?", [courseId])).toHaveLength(0);
      expect(await queryRows<{ id: string }[]>("SELECT id FROM Materia WHERE id = ?", [subjectId])).toHaveLength(0);
      const missing = await owner.client.get(`/cursos/${courseId}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Curso não encontrado" });
    } finally {
      await cleanupSafely(() => deleteOwner(owner.id));
    }
  });
});
