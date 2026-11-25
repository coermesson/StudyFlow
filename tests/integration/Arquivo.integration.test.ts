import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { arquivoArmazenamento } from "../../src/util/arquivoArmazenamento";
import {
  cleanupSafely,
  createStudyFixture,
  deleteOwner,
  queryRows,
} from "../helpers/integration";

interface ArquivoRow {
  id: string;
  nome: string;
  materiaId: string;
}

const uploadPdf = (client: Awaited<ReturnType<typeof createStudyFixture>>["client"], materiaId: string, name = "material.pdf") =>
  client
    .post("/arquivos")
    .field("materiaId", materiaId)
    .attach("arquivo", Buffer.from("%PDF-1.4\nconteúdo de integração"), {
      filename: name,
      contentType: "application/pdf",
    });

async function cleanupFile(fileId?: string) {
  if (fileId) await cleanupSafely(() => arquivoArmazenamento.remover([fileId]));
}

describe("Integração do módulo Arquivo", () => {
  it("rejeita tipo de arquivo incorreto e conteúdo sem assinatura PDF", async () => {
    const fixture = await createStudyFixture();
    try {
      const wrongType = await fixture.client
        .post("/arquivos")
        .field("materiaId", fixture.subjectId)
        .attach("arquivo", Buffer.from("texto"), {
          filename: "texto.txt",
          contentType: "text/plain",
        });
      expect(wrongType.status).toBe(400);
      expect(wrongType.body).toEqual({ erro: "Envie um arquivo PDF no campo arquivo" });

      const invalidPdf = await fixture.client
        .post("/arquivos")
        .field("materiaId", fixture.subjectId)
        .attach("arquivo", Buffer.from("não é PDF"), {
          filename: "invalido.pdf",
          contentType: "application/pdf",
        });
      expect(invalidPdf.status).toBe(400);
      expect(invalidPdf.body).toEqual({ erro: "O conteúdo enviado não possui a assinatura PDF esperada" });

      const rows = await queryRows<ArquivoRow[]>("SELECT id FROM Arquivo WHERE materiaId = ?", [fixture.subjectId]);
      expect(rows).toHaveLength(0);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("rejeita upload sem arquivo e vínculo com matéria inexistente", async () => {
    const fixture = await createStudyFixture();
    try {
      const missingFile = await fixture.client
        .post("/arquivos")
        .field("materiaId", fixture.subjectId);
      expect(missingFile.status).toBe(400);
      expect(missingFile.body).toEqual({ erro: "Envie um arquivo PDF no campo arquivo" });

      const missingSubject = await uploadPdf(fixture.client, randomUUID(), "sem-materia.pdf");
      expect(missingSubject.status).toBe(404);
      expect(missingSubject.body).toEqual({ erro: "Matéria não encontrada" });
      expect(await queryRows<ArquivoRow[]>("SELECT id FROM Arquivo WHERE materiaId = ?", [fixture.subjectId])).toHaveLength(0);
    } finally {
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("persiste vínculo e dados e lista o arquivo criado", async () => {
    const fixture = await createStudyFixture();
    let fileId: string | undefined;
    try {
      const response = await uploadPdf(fixture.client, fixture.subjectId);
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ nome: "material.pdf", materiaId: fixture.subjectId });
      fileId = response.body.id as string;

      const [row] = await queryRows<ArquivoRow[]>("SELECT id, nome, materiaId FROM Arquivo WHERE id = ?", [fileId]);
      expect(row).toEqual({ id: fileId, nome: "material.pdf", materiaId: fixture.subjectId });

      const list = await fixture.client.get("/arquivos");
      expect(list.status).toBe(200);
      expect(list.body).toContainEqual(expect.objectContaining({ id: fileId, materiaId: fixture.subjectId }));

      const found = await fixture.client.get(`/arquivos/${fileId}`);
      expect(found.status).toBe(200);
      expect(found.body).toMatchObject({ id: fileId, nome: "material.pdf" });
    } finally {
      await cleanupFile(fileId);
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("baixa PDF com tipo, nome e conteúdo corretos", async () => {
    const fixture = await createStudyFixture();
    let fileId: string | undefined;
    try {
      const uploaded = await uploadPdf(fixture.client, fixture.subjectId, "download-teste.pdf");
      expect(uploaded.status).toBe(201);
      fileId = uploaded.body.id as string;

      const download = await fixture.client.get(`/arquivos/${fileId}/download`);
      expect(download.status).toBe(200);
      expect(download.headers["content-type"]).toContain("application/pdf");
      expect(download.headers["content-disposition"]).toContain("download-teste.pdf");
      expect(download.body).toBeInstanceOf(Buffer);
      expect((download.body as Buffer).subarray(0, 5).toString()).toBe("%PDF-");
    } finally {
      await cleanupFile(fileId);
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("atualiza nome, rejeita atualização vazia e persiste o nome válido", async () => {
    const fixture = await createStudyFixture();
    let fileId: string | undefined;
    try {
      const uploaded = await uploadPdf(fixture.client, fixture.subjectId);
      fileId = uploaded.body.id as string;

      const invalid = await fixture.client.put(`/arquivos/${fileId}`).send({});
      expect(invalid.status).toBe(400);
      expect(invalid.body).toEqual({ erro: "Nenhum campo atualizável informado" });

      const updated = await fixture.client
        .put(`/arquivos/${fileId}`)
        .send({ nome: "renomeado.pdf" });
      expect(updated.status).toBe(200);
      expect(updated.body).toMatchObject({ id: fileId, nome: "renomeado.pdf" });
      const [row] = await queryRows<ArquivoRow[]>("SELECT id, nome, materiaId FROM Arquivo WHERE id = ?", [fileId]);
      expect(row.nome).toBe("renomeado.pdf");
    } finally {
      await cleanupFile(fileId);
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });

  it("retorna 404 para arquivo inexistente e não expõe arquivo de outro usuário", async () => {
    const first = await createStudyFixture();
    let secondId: string | undefined;
    let fileId: string | undefined;
    try {
      const missing = await first.client.get(`/arquivos/${randomUUID()}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Arquivo não encontrado" });

      const uploaded = await uploadPdf(first.client, first.subjectId, "privado.pdf");
      fileId = uploaded.body.id as string;
      const second = await createStudyFixture();
      secondId = second.id;

      const hidden = await second.client.get(`/arquivos/${fileId}`);
      expect(hidden.status).toBe(404);
      expect(hidden.body).toEqual({ erro: "Arquivo não encontrado" });
      const denied = await second.client.delete(`/arquivos/${fileId}`);
      expect(denied.status).toBe(404);
      expect(denied.body).toEqual({ erro: "Arquivo não encontrado" });
      expect(await queryRows<ArquivoRow[]>("SELECT id FROM Arquivo WHERE id = ?", [fileId!])).toHaveLength(1);
    } finally {
      await cleanupFile(fileId);
      await cleanupSafely(() => deleteOwner(first.id));
      if (secondId) await cleanupSafely(() => deleteOwner(secondId!));
    }
  });

  it("exclui o registro e o arquivo físico", async () => {
    const fixture = await createStudyFixture();
    let fileId: string | undefined;
    try {
      const uploaded = await uploadPdf(fixture.client, fixture.subjectId);
      fileId = uploaded.body.id as string;
      expect(await arquivoArmazenamento.existe(fileId)).toBe(true);

      const response = await fixture.client.delete(`/arquivos/${fileId}`);
      expect(response.status).toBe(204);
      expect(await queryRows<ArquivoRow[]>("SELECT id FROM Arquivo WHERE id = ?", [fileId])).toHaveLength(0);
      expect(await arquivoArmazenamento.existe(fileId)).toBe(false);
      const missing = await fixture.client.get(`/arquivos/${fileId}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Arquivo não encontrado" });
    } finally {
      await cleanupFile(fileId);
      await cleanupSafely(() => deleteOwner(fixture.id));
    }
  });
});
