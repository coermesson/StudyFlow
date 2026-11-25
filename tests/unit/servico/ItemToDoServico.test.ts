import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ItemToDoDao } from "../../../src/dao/ItemToDo.dao";
import { ItemToDoDtoCreate } from "../../../src/dto/ItemToDo.dto";
import { ItemToDo } from "../../../src/modelo/ItemToDo";
import { ItemToDoServico } from "../../../src/servico/ItemToDo.servico";

describe("ItemToDoServico", () => {
  const dao = {
    salvar: vi.fn<ItemToDoDao["salvar"]>(),
    listar: vi.fn<ItemToDoDao["listar"]>(),
    buscar: vi.fn<ItemToDoDao["buscar"]>(),
    atualizar: vi.fn<ItemToDoDao["atualizar"]>(),
    delete: vi.fn<ItemToDoDao["delete"]>(),
  } satisfies ItemToDoDao;
  const mocks = { "ItemToDoDao.salvar": dao.salvar, "ItemToDoDao.listar": dao.listar, "ItemToDoDao.buscar": dao.buscar,
    "ItemToDoDao.atualizar": dao.atualizar, "ItemToDoDao.delete": dao.delete };
  let servico: ItemToDoServico;
  beforeEach(() => { vi.resetAllMocks(); servico = new ItemToDoServico(dao); });
  afterEach(() => {
    console.log(`\nChamadas das dependências: ${expect.getState().currentTestName}`);
    console.table(Object.entries(mocks).map(([dependencia, mock]) => ({ dependencia, chamadas: mock.mock.calls.length })));
  });

  describe("salvar", () => {
    it("constrói e salva o item", async () => {
      dao.salvar.mockResolvedValue(true); const dto = { descricao: "Ler", feito: false, listaId: "l1" } as ItemToDoDtoCreate;
      const result = await servico.salvar(dto, "u1"); const model = dao.salvar.mock.calls[0][0] as ItemToDo;
      expect(dao.salvar).toHaveBeenCalledExactlyOnceWith(expect.any(ItemToDo), "u1"); expect(model.props).toMatchObject(dto); expect(result).toEqual(model.props);
    });
    it("retorna null se DAO não salva", async () => {
      dao.salvar.mockResolvedValue(false); await expect(servico.salvar({ descricao: "Ler", feito: false, listaId: "l1" } as ItemToDoDtoCreate, "u1")).resolves.toBeNull();
    });
    it("propaga erro do DAO", async () => {
      dao.salvar.mockRejectedValue(new Error("db")); await expect(servico.salvar({ descricao: "Ler", feito: false, listaId: "l1" } as ItemToDoDtoCreate, "u1")).rejects.toThrow("db");
    });
  });
  describe("listar", () => {
    it("retorna itens da dependência", async () => {
      const rows = [{ id: "i1", descricao: "Ler", feito: false, listaId: "l1" }]; dao.listar.mockResolvedValue(rows);
      await expect(servico.listar("u1")).resolves.toBe(rows); expect(dao.listar).toHaveBeenCalledExactlyOnceWith("u1");
    });
    it("retorna lista vazia quando DAO retorna []", async () => {
      dao.listar.mockResolvedValue([]);

      await expect(servico.listar("u1")).resolves.toEqual([]);
      expect(dao.listar).toHaveBeenCalledExactlyOnceWith("u1");
    });
    it("preserva null quando não há resultados", async () => {
      dao.listar.mockResolvedValue(null); await expect(servico.listar("u1")).resolves.toBeNull();
    });
    it("propaga erro da listagem", async () => {
      dao.listar.mockRejectedValue(new Error("db")); await expect(servico.listar("u1")).rejects.toThrow("db");
    });
  });
  describe("buscar", () => {
    it("retorna props do item", async () => {
      const model = ItemToDo.assemble({ id: "i1", descricao: "Ler", feito: false, listaId: "l1" }); dao.buscar.mockResolvedValue(model);
      await expect(servico.buscar("i1", "u1")).resolves.toEqual(model.props); expect(dao.buscar).toHaveBeenCalledExactlyOnceWith("i1", "u1");
    });
    it("retorna null se não encontrado", async () => {
      dao.buscar.mockResolvedValue(null); await expect(servico.buscar("x", "u1")).resolves.toBeNull();
    });
    it("propaga erro da busca", async () => {
      dao.buscar.mockRejectedValue(new Error("db")); await expect(servico.buscar("i1", "u1")).rejects.toThrow("db");
    });
  });
  describe("atualizar", () => {
    it("repassa patch e retorna props atualizadas", async () => {
      const model = ItemToDo.assemble({ id: "i1", descricao: "Lido", feito: true, listaId: "l1" }); dao.atualizar.mockResolvedValue(model);
      await expect(servico.atualizar("i1", { feito: true }, "u1")).resolves.toEqual(model.props);
      expect(dao.atualizar).toHaveBeenCalledExactlyOnceWith("i1", { feito: true }, "u1");
    });
    it("retorna null para item inexistente", async () => {
      dao.atualizar.mockResolvedValue(null); await expect(servico.atualizar("x", {}, "u1")).resolves.toBeNull();
      expect(dao.atualizar).toHaveBeenCalledExactlyOnceWith("x", {}, "u1");
    });
    it("propaga erro da atualização", async () => {
      dao.atualizar.mockRejectedValue(new Error("db")); await expect(servico.atualizar("i1", {}, "u1")).rejects.toThrow("db");
    });
  });
  describe("deletar", () => {
    it("retorna true quando DAO exclui", async () => {
      dao.delete.mockResolvedValue(true); await expect(servico.deletar("i1", "u1")).resolves.toBe(true); expect(dao.delete).toHaveBeenCalledExactlyOnceWith("i1", "u1");
    });
    it("retorna false para item inexistente", async () => {
      dao.delete.mockResolvedValue(false); await expect(servico.deletar("x", "u1")).resolves.toBe(false); expect(dao.delete).toHaveBeenCalledExactlyOnceWith("x", "u1");
    });
    it("propaga erro da exclusão", async () => {
      dao.delete.mockRejectedValue(new Error("db")); await expect(servico.deletar("i1", "u1")).rejects.toThrow("db");
    });
  });
});
