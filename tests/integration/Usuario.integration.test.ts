import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  app,
  cleanupSafely,
  createOwner,
  deleteOwner,
  newAgent,
  queryRows,
  registerOwnerCleanup,
  uniqueEmail,
} from "../helpers/integration";

interface UsuarioRow {
  id: string;
  email: string;
  nome: string;
}

describe("Integração do módulo Usuário", () => {
  it("retorna detalhes ao rejeitar dados inválidos", async () => {
    const response = await request(app)
      .post("/usuarios")
      .send({ nome: "", email: "email-inválido", senha: "" });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ erro: "Dados inválidos" });
    expect(response.body.detalhes).toEqual(expect.any(Array));
  });

  it("cadastra usuário, não expõe senha e persiste os dados", async () => {
    const email = uniqueEmail();
    let userId: string | undefined;

    try {
      const response = await request(app)
        .post("/usuarios")
        .send({ nome: "Cadastro de teste", email, senha: "senha-teste" });

      userId = response.body.id as string | undefined;
      if (response.status === 201 && userId) registerOwnerCleanup(userId);
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({ nome: "Cadastro de teste", email });
      expect(response.body.id).toEqual(expect.any(String));
      expect(response.body).not.toHaveProperty("senha");

      const [row] = await queryRows<UsuarioRow[]>(
        "SELECT id, nome, email FROM Usuario WHERE id = ?",
        [userId],
      );
      expect(row).toMatchObject({ id: userId, nome: "Cadastro de teste", email });
    } finally {
      if (userId) await cleanupSafely(() => deleteOwner(userId!));
    }
  });

  it("rejeita email duplicado sem criar um segundo usuário", async () => {
    const email = uniqueEmail();
    let userId: string | undefined;

    try {
      const created = await request(app)
        .post("/usuarios")
        .send({ nome: "Usuário original", email, senha: "senha" });
      userId = created.body.id as string | undefined;
      if (created.status === 201 && userId) registerOwnerCleanup(userId);
      expect(created.status).toBe(201);

      const duplicate = await request(app)
        .post("/usuarios")
        .send({ nome: "Duplicado", email, senha: "senha" });
      expect(duplicate.status).toBe(409);
      expect(duplicate.body).toEqual({ erro: "Email já cadastrado" });

      const rows = await queryRows<UsuarioRow[]>(
        "SELECT id FROM Usuario WHERE email = ?",
        [email],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0].id).toBe(userId);
    } finally {
      if (userId) await cleanupSafely(() => deleteOwner(userId!));
    }
  });

  it("exige sessão para listar usuários", async () => {
    const response = await request(app).get("/usuarios");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ erro: "Autenticação necessária" });
  });

  it("lista somente o usuário da sessão e busca registro inexistente", async () => {
    const client = newAgent();
    let userId: string | undefined;

    try {
      const owner = await createOwner(client);
      userId = owner.id;

      const list = await client.get("/usuarios");
      expect(list.status).toBe(200);
      expect(list.body.map((user: { id: string }) => user.id)).toContain(userId);

      const missing = await client.get(`/usuarios/${randomUUID()}`);
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual({ erro: "Usuário não encontrado" });
    } finally {
      if (userId) await cleanupSafely(() => deleteOwner(userId!));
    }
  });

  it("atualiza dados e rejeita campos desconhecidos sem alterar o registro", async () => {
    const client = newAgent();
    let userId: string | undefined;

    try {
      const owner = await createOwner(client);
      userId = owner.id;

      const updated = await client
        .put(`/usuarios/${userId}`)
        .send({ nome: "Nome atualizado" });
      expect(updated.status).toBe(200);
      expect(updated.body).toMatchObject({ id: userId, nome: "Nome atualizado" });

      const invalid = await client
        .put(`/usuarios/${userId}`)
        .send({ campoInesperado: true });
      expect(invalid.status).toBe(400);
      expect(invalid.body).toMatchObject({ erro: "Dados inválidos" });

      const [row] = await queryRows<UsuarioRow[]>(
        "SELECT id, nome, email FROM Usuario WHERE id = ?",
        [userId],
      );
      expect(row.nome).toBe("Nome atualizado");
    } finally {
      if (userId) await cleanupSafely(() => deleteOwner(userId!));
    }
  });

  it("retorna 404 ao atualizar usuário inexistente", async () => {
    const owner = await createOwner();

    try {
      const response = await owner.client
        .put(`/usuarios/${randomUUID()}`)
        .send({ nome: "Inexistente" });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ erro: "Usuário não encontrado" });
    } finally {
      await cleanupSafely(() => deleteOwner(owner.id));
    }
  });

  it("exclui a própria conta e confirma ausência no banco", async () => {
    const client = newAgent();
    let userId: string | undefined;

    try {
      const owner = await createOwner(client);
      userId = owner.id;

      const response = await client.delete(`/usuarios/${userId}`);
      expect(response.status).toBe(204);
      expect(response.text).toBe("");
      const rows = await queryRows<UsuarioRow[]>(
        "SELECT id FROM Usuario WHERE id = ?",
        [userId],
      );
      expect(rows).toHaveLength(0);
    } finally {
      if (userId) await cleanupSafely(() => deleteOwner(userId!));
    }
  });
});
