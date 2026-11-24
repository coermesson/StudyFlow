import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArquivoDao } from "../../../src/dao/Arquivo.dao";
import { ArquivoDtoCreate } from "../../../src/dto/Arquivo.dto";
import { Arquivo } from "../../../src/modelo/Arquivo";
import { ArquivoServico } from "../../../src/servico/arquivo.servico";

const storage = vi.hoisted(() => ({ salvarTemporario: vi.fn(), remover: vi.fn(), caminhoDoArquivo: vi.fn() }));
vi.mock("../../../src/util/arquivoArmazenamento", () => ({ arquivoArmazenamento: storage }));

describe("ArquivoServico", () => {
  const dao = { salvar: vi.fn(), buscar: vi.fn(), listar: vi.fn(), atualizar: vi.fn(), delete: vi.fn() };
  const mocks = { "ArquivoDao.salvar": dao.salvar, "ArquivoDao.buscar": dao.buscar, "ArquivoDao.listar": dao.listar,
    "ArquivoDao.atualizar": dao.atualizar, "ArquivoDao.delete": dao.delete, "arquivoArmazenamento.salvarTemporario": storage.salvarTemporario,
    "arquivoArmazenamento.remover": storage.remover, "arquivoArmazenamento.caminhoDoArquivo": storage.caminhoDoArquivo };
  let servico: ArquivoServico;
  beforeEach(() => { vi.resetAllMocks(); servico = new ArquivoServico(dao as unknown as ArquivoDao); });
  afterEach(() => {
    console.log(`\nChamadas das dependências: ${expect.getState().currentTestName}`);
    console.table(Object.entries(mocks).map(([dependencia, mock]) => ({ dependencia, chamadas: mock.mock.calls.length })));
  });

  describe("salvar", () => {
    it("armazena o temporário antes de salvar o registro", async () => {
      storage.salvarTemporario.mockResolvedValue(undefined); dao.salvar.mockResolvedValue(true);
      const dto = { nome: "a.pdf", materiaId: "m1" } as ArquivoDtoCreate;
      const result = await servico.salvar(dto, "temp.pdf", "u1"); const model = dao.salvar.mock.calls[0][0] as Arquivo;
      expect(storage.salvarTemporario).toHaveBeenCalledTimes(1);
      expect(storage.salvarTemporario).toHaveBeenCalledWith("temp.pdf", model.id);
      expect(dao.salvar).toHaveBeenCalledExactlyOnceWith(expect.any(Arquivo), "u1"); expect(result).toEqual(model.props);
      expect(storage.remover).not.toHaveBeenCalled();
    });
    it("remove arquivo físico e retorna null se DAO recusar", async () => {
      storage.salvarTemporario.mockResolvedValue(undefined); dao.salvar.mockResolvedValue(false); storage.remover.mockResolvedValue(undefined);
      await expect(servico.salvar({ nome: "a.pdf", materiaId: "m1" } as ArquivoDtoCreate, "temp", "u1")).resolves.toBeNull();
      const id = (dao.salvar.mock.calls[0][0] as Arquivo).id;
      expect(storage.remover).toHaveBeenCalledExactlyOnceWith([id]);
    });
    it("remove arquivo físico e propaga erro do DAO", async () => {
      storage.salvarTemporario.mockResolvedValue(undefined); dao.salvar.mockRejectedValue(new Error("db")); storage.remover.mockResolvedValue(undefined);
      await expect(servico.salvar({ nome: "a.pdf", materiaId: "m1" } as ArquivoDtoCreate, "temp", "u1")).rejects.toThrow("db");
      expect(storage.remover).toHaveBeenCalledTimes(1); expect(storage.remover).toHaveBeenCalledWith([expect.any(String)]);
    });
    it("não chama DAO nem remoção quando armazenar temporário falha", async () => {
      storage.salvarTemporario.mockRejectedValue(new Error("storage"));
      await expect(servico.salvar({ nome: "a.pdf", materiaId: "m1" } as ArquivoDtoCreate, "temp", "u1")).rejects.toThrow("storage");
      expect(dao.salvar).not.toHaveBeenCalled(); expect(storage.remover).not.toHaveBeenCalled();
    });
  });
  describe("buscar", () => {
    it("retorna props do arquivo", async () => {
      const file = Arquivo.assemble("a1", "x.pdf", "m1"); dao.buscar.mockResolvedValue(file);
      await expect(servico.buscar("a1", "u1")).resolves.toEqual(file.props); expect(dao.buscar).toHaveBeenCalledExactlyOnceWith("a1", "u1");
    });
    it("retorna null se não encontrado", async () => {
      dao.buscar.mockResolvedValue(null); await expect(servico.buscar("x", "u1")).resolves.toBeNull();
      expect(dao.buscar).toHaveBeenCalledExactlyOnceWith("x", "u1");
    });
    it("propaga falha do DAO", async () => {
      dao.buscar.mockRejectedValue(new Error("db")); await expect(servico.buscar("a1", "u1")).rejects.toThrow("db");
    });
  });
  describe("listar", () => {
    it("mapeia modelos para props", async () => {
      const files = [Arquivo.assemble("a1", "x.pdf", "m1")]; dao.listar.mockResolvedValue(files);
      await expect(servico.listar("u1")).resolves.toEqual([files[0].props]); expect(dao.listar).toHaveBeenCalledExactlyOnceWith("u1");
    });
    it("preserva null quando DAO não retorna lista", async () => {
      dao.listar.mockResolvedValue(null); await expect(servico.listar("u1")).resolves.toBeNull();
    });
    it("propaga falha do DAO", async () => {
      dao.listar.mockRejectedValue(new Error("db")); await expect(servico.listar("u1")).rejects.toThrow("db");
    });
  });
  describe("atualizar", () => {
    it("repassa patch e retorna props", async () => {
      const file = Arquivo.assemble("a1", "novo.pdf", "m1"); dao.atualizar.mockResolvedValue(file);
      await expect(servico.atualizar("a1", { nome: "novo.pdf" }, "u1")).resolves.toEqual(file.props);
      expect(dao.atualizar).toHaveBeenCalledExactlyOnceWith("a1", { nome: "novo.pdf" }, "u1");
    });
    it("retorna null para arquivo inexistente", async () => {
      dao.atualizar.mockResolvedValue(null); await expect(servico.atualizar("x", {}, "u1")).resolves.toBeNull();
    });
    it("propaga erro da atualização", async () => {
      dao.atualizar.mockRejectedValue(new Error("db")); await expect(servico.atualizar("x", {}, "u1")).rejects.toThrow("db");
    });
  });
  describe("deletar", () => {
    it("não chama delete nem storage quando arquivo não existe", async () => {
      dao.buscar.mockResolvedValue(null); await expect(servico.deletar("x", "u1")).resolves.toBe(false);
      expect(dao.buscar).toHaveBeenCalledExactlyOnceWith("x", "u1"); expect(dao.delete).not.toHaveBeenCalled(); expect(storage.remover).not.toHaveBeenCalled();
    });
    it("não remove físico quando DAO não confirma exclusão", async () => {
      dao.buscar.mockResolvedValue(Arquivo.assemble("a1", "x.pdf", "m1")); dao.delete.mockResolvedValue(false);
      await expect(servico.deletar("a1", "u1")).resolves.toBe(false); expect(dao.delete).toHaveBeenCalledExactlyOnceWith("a1", "u1"); expect(storage.remover).not.toHaveBeenCalled();
    });
    it("exclui registro e arquivo físico", async () => {
      dao.buscar.mockResolvedValue(Arquivo.assemble("a1", "x.pdf", "m1")); dao.delete.mockResolvedValue(true); storage.remover.mockResolvedValue(undefined);
      await expect(servico.deletar("a1", "u1")).resolves.toBe(true); expect(storage.remover).toHaveBeenCalledExactlyOnceWith(["a1"]);
    });
    it("propaga erro ao buscar o arquivo antes de excluir", async () => {
      dao.buscar.mockRejectedValueOnce(new Error("busca")); await expect(servico.deletar("a1", "u1")).rejects.toThrow("busca"); expect(dao.delete).not.toHaveBeenCalled();
    });
    it("propaga erro ao excluir o registro sem remover o arquivo físico", async () => {
      dao.buscar.mockResolvedValue(Arquivo.assemble("a1", "x.pdf", "m1")); dao.delete.mockRejectedValueOnce(new Error("delete"));
      await expect(servico.deletar("a1", "u1")).rejects.toThrow("delete"); expect(storage.remover).not.toHaveBeenCalled();
    });
    it("propaga erro ao remover arquivo físico depois da exclusão", async () => {
      dao.buscar.mockResolvedValue(Arquivo.assemble("a1", "x.pdf", "m1")); dao.delete.mockResolvedValue(true);
      storage.remover.mockRejectedValue(new Error("storage"));
      await expect(servico.deletar("a1", "u1")).rejects.toThrow("storage"); expect(storage.remover).toHaveBeenCalledTimes(1);
    });
  });
  describe("obterParaDownload", () => {
    it("retorna arquivo e caminho seguro quando encontrado", async () => {
      const file = Arquivo.assemble("a1", "x.pdf", "m1"); dao.buscar.mockResolvedValue(file); storage.caminhoDoArquivo.mockReturnValue("/private/a1.pdf");
      await expect(servico.obterParaDownload("a1", "u1")).resolves.toEqual({ arquivo: file.props, caminho: "/private/a1.pdf" });
      expect(dao.buscar).toHaveBeenCalledExactlyOnceWith("a1", "u1"); expect(storage.caminhoDoArquivo).toHaveBeenCalledExactlyOnceWith("a1");
    });
    it("retorna null sem resolver caminho se arquivo não existe", async () => {
      dao.buscar.mockResolvedValue(null); await expect(servico.obterParaDownload("x", "u1")).resolves.toBeNull();
      expect(storage.caminhoDoArquivo).not.toHaveBeenCalled();
    });
    it("propaga erro ao buscar o arquivo para download", async () => {
      dao.buscar.mockRejectedValueOnce(new Error("busca")); await expect(servico.obterParaDownload("a1", "u1")).rejects.toThrow("busca");
      expect(storage.caminhoDoArquivo).not.toHaveBeenCalled();
    });
    it("propaga erro ao resolver o caminho para download", async () => {
      dao.buscar.mockResolvedValue(Arquivo.assemble("a1", "x.pdf", "m1")); storage.caminhoDoArquivo.mockImplementation(() => { throw new Error("path"); });
      await expect(servico.obterParaDownload("a1", "u1")).rejects.toThrow("path");
    });
  });
});
