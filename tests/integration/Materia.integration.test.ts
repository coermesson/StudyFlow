import { describe, expect, it } from "vitest";
import { createStudyFixture, deleteOwner, queryRows } from "../helpers/integration";

describe("Integração do módulo Matéria", () => {
  it("cria matéria vinculada ao curso, lista, busca, atualiza e exclui", async () => {
    let uid: string | undefined; let subjectId: string | undefined;
    try {
      const f = await createStudyFixture(); uid = f.id; const client = f.client;
      expect((await client.get("/materias")).body.map((m: any) => m.id)).toContain(f.subjectId);
      expect((await client.post("/materias").send({ nome: "Inválida", cursoId: "bad-id" })).status).toBe(400);
      const created = await client.post("/materias").send({ nome: "Cálculo", cursoId: f.courseId });
      expect(created.status).toBe(201); subjectId = created.body.id;
      expect((await queryRows<any[]>("SELECT cursoId FROM Materia WHERE id = ?", [subjectId]))[0].cursoId).toBe(f.courseId);
      expect((await client.get("/materias")).body.map((m: any) => m.id)).toContain(subjectId);
      expect((await client.get(`/materias/${subjectId}`)).status).toBe(200);
      expect((await client.put(`/materias/${subjectId}`).send({ nome: "Cálculo II" })).status).toBe(200);
      expect((await client.put(`/materias/${subjectId}`).send({})).status).toBe(400);
      expect((await client.delete(`/materias/${subjectId}`)).status).toBe(204);
      expect((await queryRows<any[]>("SELECT id FROM Materia WHERE id = ?", [subjectId])).length).toBe(0);
    } finally { if (uid) await deleteOwner(uid); }
  });

  it("rejeita curso inexistente e oculta matéria de outro usuário", async () => {
    let uid: string | undefined; let otherUid: string | undefined;
    try {
      const f = await createStudyFixture(); uid = f.id;
      expect((await f.client.post("/materias").send({ nome: "Órfã", cursoId: crypto.randomUUID() })).status).toBe(404);
      const other = await createStudyFixture(); otherUid = other.id;
      const subject = await f.client.post("/materias").send({ nome: "Privada", cursoId: f.courseId });
      expect((await other.client.get(`/materias/${subject.body.id}`)).status).toBe(404);
      expect((await other.client.delete(`/materias/${subject.body.id}`)).status).toBe(404);
    } finally { if (uid) await deleteOwner(uid); if (otherUid) await deleteOwner(otherUid); }
  });
});
