import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  cleanupSafely,
  createStudyFixture,
  deleteOwner,
  queryRows,
} from "../helpers/integration";

interface MateriaRow {
  id: string;
  nome: string;
  cursoId: string;
}

describe("Integração do módulo Matéria", () => {
  it("rejeita dados inválidos e curso inexistente sem persistir matéria", async () => {
    const fixture = await createStudyFixture();
    try {
      const invalid = await fixture.client
        .post("/materias")
        .send({ nome: "", cursoId: fixture.courseId });
      expect(invalid.status).toBe(400);
      expect(invalid.body).toMatchObject({ erro: "Dados inválidos" });
      expect(invalid.body.detalhes).toEqual(expect.any(Array));

      const missingCourse = await fixture.client
        .post("/materias")
        .send({ nome: "Órfã", cursoId: randomUUID() });
      expect(missingCourse.status).toBe(404);
      expect(missingCourse.body).toEqual({ erro: "Curso não encontrado" });

      const rows = await queryRows<MateriaRow[]>(
        "SELECT id FROM Materia WHERE cursoId = ?",
        [fixture.courseId],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(fixture.subjectId);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("cria matéria relacionada, lista e busca seus dados", async () => {
    const fixture = await createStudyFixture();
    let subjectId: string | undefined;
    try {
      const created = await fixture.client
        .post("/materias")
        .send({ nome: "Cálculo", cursoId: fixture.courseId });
      expect(created.status).toBe(201);
      expect(created.body).toMatchObject({ nome: "Cálculo", cursoId: fixture.courseId });
      subjectId = created.body.id as string;

      const [row] = await queryRows<MateriaRow[]>(
        "SELECT id, nome, cursoId FROM Materia WHERE id = ?",
        [subjectId],
      );
      expect(row).toEqual({ id: subjectId, nome: "Cálculo", cursoId: fixture.courseId });

      const list = await fixture.client.get("/materias");
      expect(list.status).toBe(200);
      expect(list.body).toContainEqual(expect.objectContaining({ id: subjectId, nome: "Cálculo" }));

      const found = await fixture.client.get(`/materias/${subjectId}`);
      expect(found.status).toBe(200);
      expect(found.body).toMatchObject({ id: subjectId, cursoId: fixture.courseId });
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("atualiza nome e curso e mantém os relacionamentos no banco", async () => {
    const fixture = await createStudyFixture();
    let subjectId: string | undefined;
    let destinationCourseId: string | undefined;
    try {
      const created = await fixture.client
        .post("/materias")
        .send({ nome: "Original", cursoId: fixture.courseId });
      subjectId = created.body.id as string;
      const destination = await fixture.client.post("/cursos").send({ nome: "Destino" });
      destinationCourseId = destination.body.id as string;

      const updateName = await fixture.client
        .put(`/materias/${subjectId}`)
        .send({ nome: "Atualizada" });
      expect(updateName.status).toBe(200);
      expect(updateName.body).toMatchObject({ id: subjectId, nome: "Atualizada" });

      const updateCourse = await fixture.client
        .put(`/materias/${subjectId}`)
        .send({ cursoId: destinationCourseId });
      expect(updateCourse.status).toBe(200);
      expect(updateCourse.body.cursoId).toBe(destinationCourseId);
      const [row] = await queryRows<MateriaRow[]>(
        "SELECT id, nome, cursoId FROM Materia WHERE id = ?",
        [subjectId],
      );
      expect(row).toMatchObject({ nome: "Atualizada", cursoId: destinationCourseId });
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("retorna mensagens de erro em atualização vazia e de destino inválido", async () => {
    const fixture = await createStudyFixture();
    let subjectId: string | undefined;
    try {
      const created = await fixture.client
        .post("/materias")
        .send({ nome: "Original", cursoId: fixture.courseId });
      subjectId = created.body.id as string;

      const empty = await fixture.client.put(`/materias/${subjectId}`).send({});
      expect(empty.status).toBe(400);
      expect(empty.body).toEqual({ erro: "Nenhum campo atualizável informado" });

      const invalidDestination = await fixture.client
        .put(`/materias/${subjectId}`)
        .send({ cursoId: randomUUID() });
      expect(invalidDestination.status).toBe(404);
      expect(invalidDestination.body).toEqual({ erro: "Matéria não encontrada" });

      const [row] = await queryRows<MateriaRow[]>("SELECT id, nome, cursoId FROM Materia WHERE id = ?", [subjectId]);
      expect(row.cursoId).toBe(fixture.courseId);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("retorna 404 para matéria inexistente e oculta matéria de outro usuário", async () => {
    const first = await createStudyFixture();
    let secondId: string | undefined;
    let subjectId: string | undefined;
    try {
      const missing = await first.client.get(`/materias/${randomUUID()}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Matéria não encontrada" });

      const created = await first.client
        .post("/materias")
        .send({ nome: "Privada", cursoId: first.courseId });
      subjectId = created.body.id as string;
      const second = await createStudyFixture();
      secondId = second.id;

      const hidden = await second.client.get(`/materias/${subjectId}`);
      expect(hidden.status).toBe(404);
      expect(hidden.body).toEqual({ erro: "Matéria não encontrada" });
      const deletion = await second.client.delete(`/materias/${subjectId}`);
      expect(deletion.status).toBe(404);
      expect(deletion.body).toEqual({ erro: "Matéria não encontrada" });

      const [row] = await queryRows<MateriaRow[]>("SELECT id, nome, cursoId FROM Materia WHERE id = ?", [subjectId]);
      expect(row).toMatchObject({ nome: "Privada", cursoId: first.courseId });
    } finally {
      await cleanupSafely(() => deleteOwner(first.id));
      if (secondId) await cleanupSafely(() => deleteOwner(secondId!));
    }
  });

  it("exclui matéria e confirma remoção no banco", async () => {
    const fixture = await createStudyFixture();
    let subjectId: string | undefined;
    try {
      const created = await fixture.client
        .post("/materias")
        .send({ nome: "Para excluir", cursoId: fixture.courseId });
      subjectId = created.body.id as string;

      const response = await fixture.client.delete(`/materias/${subjectId}`);
      expect(response.status).toBe(204);
      expect(await queryRows<MateriaRow[]>("SELECT id FROM Materia WHERE id = ?", [subjectId])).toHaveLength(0);
      const missing = await fixture.client.get(`/materias/${subjectId}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Matéria não encontrada" });
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });
});
