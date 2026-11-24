import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TarefaKanbanDao } from "../../../src/dao/TarefaKanban.dao";
import { TarefaKanbanDtoCreate, PrioridadeTarefa, StatusTarefa } from "../../../src/dto/TarefaKanban.dto";
import { TarefaKanban } from "../../../src/modelo/TarefaKanban";
import { TarefaKanbanServico } from "../../../src/servico/TarefaKanban.servico";

describe("TarefaKanbanServico", () => {
  const dao = { salvar: vi.fn(), buscar: vi.fn(), listar: vi.fn(), atualizar: vi.fn(), delete: vi.fn() };
  const mocks = { "TarefaKanbanDao.salvar": dao.salvar, "TarefaKanbanDao.buscar": dao.buscar, "TarefaKanbanDao.listar": dao.listar,
    "TarefaKanbanDao.atualizar": dao.atualizar, "TarefaKanbanDao.delete": dao.delete };
  let servico: TarefaKanbanServico;
  beforeEach(() => { vi.resetAllMocks(); servico = new TarefaKanbanServico(dao as unknown as TarefaKanbanDao); });
  afterEach(() => {
    console.log(`\nChamadas das dependências: ${expect.getState().currentTestName}`);
    console.table(Object.entries(mocks).map(([dependencia, mock]) => ({ dependencia, chamadas: mock.mock.calls.length })));
  });
  const dto = (): TarefaKanbanDtoCreate => ({ titulo: "Ler", descricao: "Capítulo", status: StatusTarefa.A_FAZER, prioridade: PrioridadeTarefa.ALTA, quadroId: "q1" });

  describe("salvar", () => {
    it("monta tarefa e envia usuário ao DAO", async () => {
      dao.salvar.mockResolvedValue(true); const input = dto(); const result = await servico.salvar(input, "u1");
      const model = dao.salvar.mock.calls[0][0] as TarefaKanban;
      expect(dao.salvar).toHaveBeenCalledExactlyOnceWith(expect.any(TarefaKanban), "u1"); expect(model.props).toMatchObject(input); expect(result).toEqual(model.props);
    });
    it("retorna null se DAO não salva", async () => {
      dao.salvar.mockResolvedValue(false); await expect(servico.salvar(dto(), "u1")).resolves.toBeNull();
    });
    it("propaga erro do DAO", async () => {
      dao.salvar.mockRejectedValue(new Error("db")); await expect(servico.salvar(dto(), "u1")).rejects.toThrow("db");
    });
  });
  describe("buscar", () => {
    it("retorna props quando tarefa existe", async () => {
      const model = TarefaKanban.assemble({ id: "t1", ...dto() }); dao.buscar.mockResolvedValue(model);
      await expect(servico.buscar("t1", "u1")).resolves.toEqual(model.props); expect(dao.buscar).toHaveBeenCalledExactlyOnceWith("t1", "u1");
    });
    it("retorna null se tarefa inexiste", async () => {
      dao.buscar.mockResolvedValue(null); await expect(servico.buscar("x", "u1")).resolves.toBeNull();
    });
    it("propaga erro de busca", async () => {
      dao.buscar.mockRejectedValue(new Error("db")); await expect(servico.buscar("t1", "u1")).rejects.toThrow("db");
    });
  });
  describe("listar", () => {
    it("mapeia tarefas encontradas para props", async () => {
      const values = [TarefaKanban.assemble({ id: "t1", ...dto() })]; dao.listar.mockResolvedValue(values);
      await expect(servico.listar("u1")).resolves.toEqual(values.map(t => t.props)); expect(dao.listar).toHaveBeenCalledExactlyOnceWith("u1");
    });
    it("retorna null para resultado vazio do DAO", async () => {
      dao.listar.mockResolvedValue(null); await expect(servico.listar("u1")).resolves.toBeNull();
    });
    it("propaga falha da listagem", async () => {
      dao.listar.mockRejectedValue(new Error("db")); await expect(servico.listar("u1")).rejects.toThrow("db");
    });
  });
  describe("atualizar", () => {
    it("repassa patch e retorna props atualizadas", async () => {
      const model = TarefaKanban.assemble({ id: "t1", ...dto(), status: StatusTarefa.FEITO }); dao.atualizar.mockResolvedValue(model);
      await expect(servico.atualizar("t1", { status: StatusTarefa.FEITO }, "u1")).resolves.toEqual(model.props);
      expect(dao.atualizar).toHaveBeenCalledExactlyOnceWith("t1", { status: StatusTarefa.FEITO }, "u1");
    });
    it("retorna null se tarefa não existe", async () => {
      dao.atualizar.mockResolvedValue(null); await expect(servico.atualizar("x", {}, "u1")).resolves.toBeNull();
    });
    it("propaga falha de atualização", async () => {
      dao.atualizar.mockRejectedValue(new Error("db")); await expect(servico.atualizar("t1", {}, "u1")).rejects.toThrow("db");
    });
  });
  describe("deletar", () => {
    it("retorna true quando DAO exclui", async () => {
      dao.delete.mockResolvedValue(true); await expect(servico.deletar("t1", "u1")).resolves.toBe(true); expect(dao.delete).toHaveBeenCalledExactlyOnceWith("t1", "u1");
    });
    it("retorna false quando DAO não encontra tarefa", async () => {
      dao.delete.mockResolvedValue(false); await expect(servico.deletar("x", "u1")).resolves.toBe(false);
    });
    it("propaga erro ao excluir", async () => {
      dao.delete.mockRejectedValue(new Error("db")); await expect(servico.deletar("t1", "u1")).rejects.toThrow("db");
    });
  });
});
