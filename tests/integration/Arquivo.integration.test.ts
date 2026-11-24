import { describe, expect, it } from "vitest";
import { arquivoArmazenamento } from "../../src/util/arquivoArmazenamento";
import { createStudyFixture, deleteOwner, queryRows } from "../helpers/integration";

describe("Integração do módulo Arquivo", () => {
  it("valida upload, grava arquivo e vínculo, baixa, atualiza e exclui somente o arquivo do teste", async () => {
    let uid: string | undefined; let fileId: string | undefined;
    try {
      const f = await createStudyFixture(); uid = f.id; const client = f.client;
      const bad = await client.post("/arquivos").field("materiaId", f.subjectId)
        .attach("arquivo", Buffer.from("não é PDF"), { filename: "texto.txt", contentType: "text/plain" });
      expect(bad.status).toBe(400);
      const created = await client.post("/arquivos").field("materiaId", f.subjectId)
        .attach("arquivo", Buffer.from("%PDF-1.4\nintegração"), { filename: "material.pdf", contentType: "application/pdf" });
      expect(created.status).toBe(201); fileId = created.body.id;
      expect((await queryRows<any[]>("SELECT materiaId FROM Arquivo WHERE id = ?", [fileId]))[0].materiaId).toBe(f.subjectId);
      expect((await client.get("/arquivos")).body.map((x: any) => x.id)).toContain(fileId);
      expect((await client.get(`/arquivos/${fileId}`)).status).toBe(200);
      expect((await client.get(`/arquivos/${fileId}/download`)).status).toBe(200);
      expect((await client.put(`/arquivos/${fileId}`).send({ nome: "novo-nome.pdf" })).status).toBe(200);
      expect((await client.delete(`/arquivos/${fileId}`)).status).toBe(204);
      expect((await client.get(`/arquivos/${fileId}`)).status).toBe(404);
    } finally {
      if (fileId) await arquivoArmazenamento.remover([fileId]);
      if (uid) await deleteOwner(uid);
    }
  });

  it("rejeita matéria inexistente e impede acesso por outro usuário", async () => {
    let uid: string | undefined; let otherUid: string | undefined; let fileId: string | undefined;
    try {
      const f = await createStudyFixture(); uid = f.id;
      const missing = await f.client.post("/arquivos").field("materiaId", crypto.randomUUID())
        .attach("arquivo", Buffer.from("%PDF-1.4\nteste"), { filename: "nao-existe.pdf", contentType: "application/pdf" });
      expect(missing.status).toBe(404);
      const uploaded = await f.client.post("/arquivos").field("materiaId", f.subjectId)
        .attach("arquivo", Buffer.from("%PDF-1.4\nteste"), { filename: "privado.pdf", contentType: "application/pdf" });
      expect(uploaded.status).toBe(201); fileId = uploaded.body.id;
      const other = await createStudyFixture(); otherUid = other.id;
      expect((await other.client.get(`/arquivos/${fileId}`)).status).toBe(404);
      expect((await other.client.delete(`/arquivos/${fileId}`)).status).toBe(404);
    } finally {
      if (fileId) await arquivoArmazenamento.remover([fileId]);
      if (uid) await deleteOwner(uid);
      if (otherUid) await deleteOwner(otherUid);
    }
  });
});
