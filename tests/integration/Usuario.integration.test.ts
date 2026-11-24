import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, createOwner, deleteOwner, newAgent, queryRows, uniqueEmail } from "../helpers/integration";

describe("Integração do módulo Usuário", () => {
  it("cadastra usuário, oculta senha e rejeita dados inválidos e email duplicado", async () => {
    const email = uniqueEmail(); let id: string | undefined;
    try {
      expect((await request(app).post("/usuarios").send({ nome: "", email, senha: "" })).status).toBe(400);
      const created = await request(app).post("/usuarios").send({ nome: "Cadastro teste", email, senha: "senha" });
      expect(created.status).toBe(201); id = created.body.id;
      expect(created.body.senha).toBeUndefined();
      expect((await request(app).post("/usuarios").send({ nome: "Duplicado", email, senha: "senha" })).status).toBe(409);
      expect((await queryRows<any[]>("SELECT email FROM Usuario WHERE id = ?", [id]))[0].email).toBe(email);
    } finally { if (id) await deleteOwner(id); }
  });

  it("protege rotas, lista e busca o próprio usuário, atualiza e exclui", async () => {
    const client = newAgent(); let id: string | undefined;
    try {
      expect((await request(app).get("/usuarios")).status).toBe(401);
      const owner = await createOwner(client); id = owner.id;
      expect((await client.get("/usuarios")).status).toBe(200);
      expect((await client.get(`/usuarios/${id}`)).body.id).toBe(id);
      expect((await client.get(`/usuarios/${crypto.randomUUID()}`)).status).toBe(404);
      expect((await client.put(`/usuarios/${id}`).send({ nome: "Nome atualizado" })).status).toBe(200);
      expect((await queryRows<any[]>("SELECT nome FROM Usuario WHERE id = ?", [id]))[0].nome).toBe("Nome atualizado");
      expect((await client.put(`/usuarios/${id}`).send({ campoInesperado: true })).status).toBe(400);
      expect((await client.delete(`/usuarios/${id}`)).status).toBe(204);
      expect((await queryRows<any[]>("SELECT id FROM Usuario WHERE id = ?", [id])).length).toBe(0);
    } finally { if (id) await deleteOwner(id); }
  });
});
