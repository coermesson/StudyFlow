import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ListaToDoDao } from "../../../src/dao/ListaToDo.dao";
import { ListaToDoDtoCreate } from "../../../src/dto/ListaToDo.dto";
import { ListaToDo } from "../../../src/modelo/ListaToDo";
import { ListaToDoServico } from "../../../src/servico/ListaToDo.servico";

describe("ListaToDoServico", () => {
  const dao = { salvar: vi.fn(), listar: vi.fn(), buscar: vi.fn(), atualizar: vi.fn(), delete: vi.fn() };
  const mocks = { "ListaToDoDao.salvar": dao.salvar, "ListaToDoDao.listar": dao.listar, "ListaToDoDao.buscar": dao.buscar,
    "ListaToDoDao.atualizar": dao.atualizar, "ListaToDoDao.delete": dao.delete };
  let servico: ListaToDoServico;
  beforeEach(() => { vi.resetAllMocks(); servico = new ListaToDoServico(dao as unknown as ListaToDoDao); });
  afterEach(() => {
    console.log(`\nChamadas das dependências: ${expect.getState().currentTestName}`);
    console.table(Object.entries(mocks).map(([dependencia, mock]) => ({ dependencia, chamadas: mock.mock.calls.length })));
  });

  describe("salvar", () => {
    it("constrói e salva lista vinculada à matéria", async () => {
      dao.salvar.mockResolvedValue(true); const dto = { nome: "Semana", materiaId: "m1" } as ListaToDoDtoCreate;
      const result = await servico.salvar(dto, "u1"); const model = dao.salvar.mock.calls[0][0] as ListaToDo;
      expect(dao.salvar).toHaveBeenCalledExactlyOnceWith(expect.any(ListaToDo), "u1"); expect(model.props).toMatchObject(dto); expect(result).toEqual(model.props);
    });
    it("retorna null se persistência não ocorrer", async () => {
      dao.salvar.mockResolvedValue(false); await expect(servico.salvar({ nome: "X", materiaId: "m1" } as ListaToDoDtoCreate, "u1")).resolves.toBeNull();
    });
    it("propaga erro do DAO", async () => {
      dao.salvar.mockRejectedValue(new Error("db")); await expect(servico.salvar({ nome: "X", materiaId: "m1" } as ListaToDoDtoCreate, "u1")).rejects.toThrow("db");
    });
  });
  describe("listar", () => {
    it("retorna listas quando DAO tem resultados", async () => {
      const rows = [{ id: "l1", nome: "Semana", materiaId: "m1" }]; dao.listar.mockResolvedValue(rows);
      await expect(servico.listar("u1")).resolves.toBe(rows); expect(dao.listar).toHaveBeenCalledExactlyOnceWith("u1");
    });
    it("retorna null quando DAO retorna null", async () => {
      dao.listar.mockResolvedValue(null); await expect(servico.listar("u1")).resolves.toBeNull();
    });
    it("propaga erro da listagem", async () => {
      dao.listar.mockRejectedValue(new Error("db")); await expect(servico.listar("u1")).rejects.toThrow("db");
    });
  });
  describe("buscar", () => {
    it("retorna props quando lista encontrada", async () => {
      const model = ListaToDo.assemble({ id: "l1", nome: "Semana", materiaId: "m1" }); dao.buscar.mockResolvedValue(model);
      await expect(servico.buscar("l1", "u1")).resolves.toEqual(model.props); expect(dao.buscar).toHaveBeenCalledExactlyOnceWith("l1", "u1");
    });
    it("retorna null se lista não existe", async () => {
      dao.buscar.mockResolvedValue(null); await expect(servico.buscar("x", "u1")).resolves.toBeNull();
    });
    it("propaga erro da busca", async () => {
      dao.buscar.mockRejectedValue(new Error("db")); await expect(servico.buscar("l1", "u1")).rejects.toThrow("db");
    });
  });
  describe("atualizar", () => {
    it("repassa alterações e retorna props", async () => {
      const model = ListaToDo.assemble({ id: "l1", nome: "Novo", materiaId: "m1" }); dao.atualizar.mockResolvedValue(model);
      await expect(servico.atualizar("l1", { nome: "Novo" }, "u1")).resolves.toEqual(model.props);
      expect(dao.atualizar).toHaveBeenCalledExactlyOnceWith("l1", { nome: "Novo" }, "u1");
    });
    it("retorna null se lista não for encontrada", async () => {
      dao.atualizar.mockResolvedValue(null); await expect(servico.atualizar("x", {}, "u1")).resolves.toBeNull();
    });
    it("propaga erro da atualização", async () => {
      dao.atualizar.mockRejectedValue(new Error("db")); await expect(servico.atualizar("x", {}, "u1")).rejects.toThrow("db");
    });
  });
  describe("deletar", () => {
    it("repassa ids e retorna true quando removida", async () => {
      dao.delete.mockResolvedValue(true); await expect(servico.deletar("l1", "u1")).resolves.toBe(true);
      expect(dao.delete).toHaveBeenCalledExactlyOnceWith("l1", "u1");
    });
    it("retorna false se lista não for encontrada", async () => {
      dao.delete.mockResolvedValue(false); await expect(servico.deletar("x", "u1")).resolves.toBe(false);
    });
    it("propaga erro da exclusão", async () => {
      dao.delete.mockRejectedValue(new Error("db")); await expect(servico.deletar("x", "u1")).rejects.toThrow("db");
    });
  });
});
