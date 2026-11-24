import { describe, expect, it } from "vitest";
import { createOwner, deleteOwner, queryRows } from "../helpers/integration";

describe("Integração do módulo Curso", () => {
  it("valida, cria, lista, busca, atualiza e exclui curso com suas matérias", async () => {
    let uid: string | undefined; let courseId: string | undefined; let subjectId: string | undefined;
    const { randomUUID } = await import("node:crypto");
    try {
      const owner = await createOwner(); uid = owner.id; const client = owner.client;
      expect((await client.get("/cursos")).body).toEqual([]);
      expect((await client.post("/cursos").send({ nome: "" })).status).toBe(400);
      const created = await client.post("/cursos").send({ nome: "Curso A" });
      expect(created.status).toBe(201); courseId = created.body.id; expect(created.body.usuarioId).toBe(uid);
      expect((await client.get("/cursos")).body.map((c: any) => c.id)).toContain(courseId);
      expect((await client.get(`/cursos/${courseId}`)).status).toBe(200);
      expect((await client.put(`/cursos/${courseId}`).send({ nome: "Curso atualizado" })).status).toBe(200);
      expect((await client.put(`/cursos/${courseId}`).send({})).status).toBe(400);
      const subject = await client.post("/materias").send({ nome: "Dependente", cursoId: courseId }); subjectId = subject.body.id;
      expect((await client.get(`/cursos/${randomUUID()}`)).status).toBe(404);
      expect((await client.delete(`/cursos/${courseId}`)).status).toBe(204);
      expect((await queryRows<any[]>("SELECT id FROM Materia WHERE id = ?", [subjectId])).length).toBe(0);
      expect((await client.get(`/cursos/${courseId}`)).status).toBe(404);
    } finally { if (uid) await deleteOwner(uid); }
  });

  it("não permite ler ou alterar curso de outro usuário", async () => {
    let ownerA: string | undefined; let ownerB: string | undefined;
    try {
      const a = await createOwner(); ownerA = a.id;
      const course = await a.client.post("/cursos").send({ nome: "Privado" });
      const b = await createOwner(); ownerB = b.id;
      expect((await b.client.get(`/cursos/${course.body.id}`)).status).toBe(404);
      expect((await b.client.put(`/cursos/${course.body.id}`).send({ nome: "Alteração" })).status).toBe(404);
      expect((await b.client.delete(`/cursos/${course.body.id}`)).status).toBe(404);
      expect((await queryRows<any[]>("SELECT nome FROM Curso WHERE id = ?", [course.body.id]))[0].nome).toBe("Privado");
    } finally { if (ownerA) await deleteOwner(ownerA); if (ownerB) await deleteOwner(ownerB); }
  });
});
