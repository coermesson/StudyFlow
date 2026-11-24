import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QuadroKanbanDao } from "../../../src/dao/QuadroKanban.dao";
import { QuadroKanbanDtoCreate } from "../../../src/dto/QuadroKanban.dto";
import { QuadroKanban } from "../../../src/modelo/QuadroKanban";
import { QuadroKanbanServico } from "../../../src/servico/QuadroKanban.servico";

describe("QuadroKanbanServico", () => {
  const dao = { salvar: vi.fn(), buscar: vi.fn(), listar: vi.fn(), atualizar: vi.fn(), delete: vi.fn() };
  const mocks = { "QuadroKanbanDao.salvar": dao.salvar, "QuadroKanbanDao.buscar": dao.buscar, "QuadroKanbanDao.listar": dao.listar,
    "QuadroKanbanDao.atualizar": dao.atualizar, "QuadroKanbanDao.delete": dao.delete };
  let servico: QuadroKanbanServico;
  beforeEach(() => { vi.resetAllMocks(); servico = new QuadroKanbanServico(dao as unknown as QuadroKanbanDao); });
  afterEach(() => {
    console.log(`\nChamadas das dependências: ${expect.getState().currentTestName}`);
    console.table(Object.entries(mocks).map(([dependencia, mock]) => ({ dependencia, chamadas: mock.mock.calls.length })));
  });
  describe("salvar", () => {
    it("constrói quadro e envia proprietário ao DAO", async () => {
      dao.salvar.mockResolvedValue(true); const dto = { nome: "Sprint", materiaId: "m1" } as QuadroKanbanDtoCreate;
      const result = await servico.salvar(dto, "u1"); const model = dao.salvar.mock.calls[0][0] as QuadroKanban;
      expect(dao.salvar).toHaveBeenCalledExactlyOnceWith(expect.any(QuadroKanban), "u1"); expect(model.props).toMatchObject(dto); expect(result).toEqual(model.props);
    });
    it("retorna null se DAO não salvar", async () => {
      dao.salvar.mockResolvedValue(false); await expect(servico.salvar({ nome: "X", materiaId: "m1" } as QuadroKanbanDtoCreate, "u1")).resolves.toBeNull();
    });
    it("propaga erro do DAO", async () => {
      dao.salvar.mockRejectedValue(new Error("db")); await expect(servico.salvar({ nome: "X", materiaId: "m1" } as QuadroKanbanDtoCreate, "u1")).rejects.toThrow("db");
    });
  });
  describe("buscar", () => {
    it("retorna props quando quadro existe", async () => {
      const model = QuadroKanban.assemble({ id: "q1", nome: "Sprint", materiaId: "m1" }); dao.buscar.mockResolvedValue(model);
      await expect(servico.buscar("q1", "u1")).resolves.toEqual(model.props); expect(dao.buscar).toHaveBeenCalledExactlyOnceWith("q1", "u1");
    });
    it("retorna null se não existe", async () => {
      dao.buscar.mockResolvedValue(null); await expect(servico.buscar("x", "u1")).resolves.toBeNull();
    });
    it("propaga erro do DAO", async () => {
      dao.buscar.mockRejectedValue(new Error("db")); await expect(servico.buscar("q1", "u1")).rejects.toThrow("db");
    });
  });
  describe("listar", () => {
    it("mapeia quadros para props", async () => {
      const values = [QuadroKanban.assemble({ id: "q1", nome: "A", materiaId: "m1" })]; dao.listar.mockResolvedValue(values);
      await expect(servico.listar("u1")).resolves.toEqual(values.map(q => q.props)); expect(dao.listar).toHaveBeenCalledExactlyOnceWith("u1");
    });
    it("retorna null se DAO não tem resultados", async () => {
      dao.listar.mockResolvedValue(null); await expect(servico.listar("u1")).resolves.toBeNull();
    });
    it("propaga falha da listagem", async () => {
      dao.listar.mockRejectedValue(new Error("db")); await expect(servico.listar("u1")).rejects.toThrow("db");
    });
  });
  describe("atualizar", () => {
    it("repassa patch e retorna props alteradas", async () => {
      const model = QuadroKanban.assemble({ id: "q1", nome: "Novo", materiaId: "m1" }); dao.atualizar.mockResolvedValue(model);
      await expect(servico.atualizar("q1", { nome: "Novo" }, "u1")).resolves.toEqual(model.props);
      expect(dao.atualizar).toHaveBeenCalledExactlyOnceWith("q1", { nome: "Novo" }, "u1");
    });
    it("retorna null para quadro inexistente", async () => {
      dao.atualizar.mockResolvedValue(null); await expect(servico.atualizar("x", {}, "u1")).resolves.toBeNull();
    });
    it("propaga erro da atualização", async () => {
      dao.atualizar.mockRejectedValue(new Error("db")); await expect(servico.atualizar("q1", {}, "u1")).rejects.toThrow("db");
    });
  });
  describe("deletar", () => {
    it("retorna true quando quadro removido", async () => {
      dao.delete.mockResolvedValue(true); await expect(servico.deletar("q1", "u1")).resolves.toBe(true); expect(dao.delete).toHaveBeenCalledExactlyOnceWith("q1", "u1");
    });
    it("retorna false se quadro não existe", async () => {
      dao.delete.mockResolvedValue(false); await expect(servico.deletar("x", "u1")).resolves.toBe(false);
    });
    it("propaga erro de exclusão", async () => {
      dao.delete.mockRejectedValue(new Error("db")); await expect(servico.deletar("q1", "u1")).rejects.toThrow("db");
    });
  });
});
