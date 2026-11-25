import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArquivoDao } from "../../../src/dao/Arquivo.dao";
import { MateriaDao } from "../../../src/dao/Materia.dao";
import { MateriaDtoCreate } from "../../../src/dto/Materia.dto";
import { Materia } from "../../../src/modelo/Materia";
import { MateriaServico } from "../../../src/servico/materia.servico";

const removerMock = vi.hoisted(() => vi.fn());
vi.mock("../../../src/util/arquivoArmazenamento", () => ({ arquivoArmazenamento: { remover: removerMock } }));

describe("MateriaServico", () => {
  const materiaDao = {
    salvar: vi.fn<MateriaDao["salvar"]>(),
    buscar: vi.fn<MateriaDao["buscar"]>(),
    listar: vi.fn<MateriaDao["listar"]>(),
    atualizar: vi.fn<MateriaDao["atualizar"]>(),
    delete: vi.fn<MateriaDao["delete"]>(),
  } satisfies MateriaDao;
  const arquivoDao = {
    listarIdsPorMateria: vi.fn<ArquivoDao["listarIdsPorMateria"]>(),
  } satisfies Pick<ArquivoDao, "listarIdsPorMateria">;
  const mocks = { "MateriaDao.salvar": materiaDao.salvar, "MateriaDao.buscar": materiaDao.buscar, "MateriaDao.listar": materiaDao.listar,
    "MateriaDao.atualizar": materiaDao.atualizar, "MateriaDao.delete": materiaDao.delete,
    "ArquivoDao.listarIdsPorMateria": arquivoDao.listarIdsPorMateria, "arquivoArmazenamento.remover": removerMock };
  let servico: MateriaServico;
  beforeEach(() => {
    vi.resetAllMocks();
    servico = new MateriaServico(materiaDao, arquivoDao as unknown as ArquivoDao);
  });
  afterEach(() => {
    console.log(`\nChamadas das dependências: ${expect.getState().currentTestName}`);
    console.table(Object.entries(mocks).map(([dependencia, mock]) => ({ dependencia, chamadas: mock.mock.calls.length })));
  });

  describe("salvar", () => {
    it("constrói e salva a matéria com o usuário informado", async () => {
      materiaDao.salvar.mockResolvedValue(true); const dto = { nome: "Física", cursoId: "c1" } as MateriaDtoCreate;
      const result = await servico.salvar(dto, "u1"); const model = materiaDao.salvar.mock.calls[0][0] as Materia;
      expect(materiaDao.salvar).toHaveBeenCalledExactlyOnceWith(expect.any(Materia), "u1");
      expect(model.props).toMatchObject(dto); expect(result).toEqual(model.props);
      expect(materiaDao.buscar).not.toHaveBeenCalled(); expect(arquivoDao.listarIdsPorMateria).not.toHaveBeenCalled();
    });
    it("retorna null quando DAO não salva", async () => {
      materiaDao.salvar.mockResolvedValue(false);
      await expect(servico.salvar({ nome: "Física", cursoId: "c1" } as MateriaDtoCreate, "u1")).resolves.toBeNull();
      expect(materiaDao.salvar).toHaveBeenCalledTimes(1);
    });
    it("propaga erro do DAO", async () => {
      const error = new Error("salvar"); materiaDao.salvar.mockRejectedValue(error);
      await expect(servico.salvar({ nome: "Física", cursoId: "c1" } as MateriaDtoCreate, "u1")).rejects.toBe(error);
      expect(materiaDao.salvar).toHaveBeenCalledTimes(1);
    });
  });
  describe("buscar", () => {
    it("retorna props quando encontrada", async () => {
      const model = Materia.assemble("m1", "Física", "c1"); materiaDao.buscar.mockResolvedValue(model);
      await expect(servico.buscar("m1", "u1")).resolves.toEqual(model.props);
      expect(materiaDao.buscar).toHaveBeenCalledExactlyOnceWith("m1", "u1");
    });
    it("retorna null quando não encontrada", async () => {
      materiaDao.buscar.mockResolvedValue(null); await expect(servico.buscar("x", "u1")).resolves.toBeNull();
      expect(materiaDao.buscar).toHaveBeenCalledExactlyOnceWith("x", "u1");
    });
    it("propaga erro de busca", async () => {
      const error = new Error("buscar"); materiaDao.buscar.mockRejectedValue(error);
      await expect(servico.buscar("m1", "u1")).rejects.toBe(error);
    });
  });
  describe("listar", () => {
    it("retorna a lista do DAO", async () => {
      const rows = [{ id: "m1", nome: "Física", cursoId: "c1" }]; materiaDao.listar.mockResolvedValue(rows);
      await expect(servico.listar("u1")).resolves.toBe(rows); expect(materiaDao.listar).toHaveBeenCalledExactlyOnceWith("u1");
    });
    it("retorna lista vazia quando DAO retorna []", async () => {
      materiaDao.listar.mockResolvedValue([]);

      await expect(servico.listar("u1")).resolves.toEqual([]);
      expect(materiaDao.listar).toHaveBeenCalledExactlyOnceWith("u1");
    });
    it("preserva null para lista vazia do DAO", async () => {
      materiaDao.listar.mockResolvedValue(null); await expect(servico.listar("u1")).resolves.toBeNull();
      expect(materiaDao.listar).toHaveBeenCalledTimes(1);
    });
    it("propaga erro da listagem", async () => {
      const error = new Error("listar"); materiaDao.listar.mockRejectedValue(error);
      await expect(servico.listar("u1")).rejects.toBe(error);
    });
  });
  describe("atualizar", () => {
    it("repassa dados e retorna props", async () => {
      const model = Materia.assemble("m1", "Nova", "c1"); materiaDao.atualizar.mockResolvedValue(model);
      await expect(servico.atualizar("m1", { nome: "Nova" }, "u1")).resolves.toEqual(model.props);
      expect(materiaDao.atualizar).toHaveBeenCalledExactlyOnceWith("m1", { nome: "Nova" }, "u1");
    });
    it("retorna null quando matéria não existe", async () => {
      materiaDao.atualizar.mockResolvedValue(null); await expect(servico.atualizar("x", {}, "u1")).resolves.toBeNull();
      expect(materiaDao.atualizar).toHaveBeenCalledTimes(1);
    });
    it("propaga erro de atualização", async () => {
      const error = new Error("atualizar"); materiaDao.atualizar.mockRejectedValue(error);
      await expect(servico.atualizar("m1", {}, "u1")).rejects.toBe(error);
    });
  });
  describe("deletar", () => {
    it("remove arquivos relacionados depois de confirmar exclusão", async () => {
      arquivoDao.listarIdsPorMateria.mockResolvedValue(["a1"]); materiaDao.delete.mockResolvedValue(true); removerMock.mockResolvedValue(undefined);
      await expect(servico.deletar("m1", "u1")).resolves.toBe(true);
      expect(arquivoDao.listarIdsPorMateria).toHaveBeenCalledExactlyOnceWith("m1", "u1");
      expect(materiaDao.delete).toHaveBeenCalledExactlyOnceWith("m1", "u1"); expect(removerMock).toHaveBeenCalledExactlyOnceWith(["a1"]);
    });
    it("remove arquivos com lista vazia depois de confirmar exclusão", async () => {
      arquivoDao.listarIdsPorMateria.mockResolvedValue([]);
      materiaDao.delete.mockResolvedValue(true);
      removerMock.mockResolvedValue(undefined);

      await expect(servico.deletar("m1", "u1")).resolves.toBe(true);

      expect(arquivoDao.listarIdsPorMateria).toHaveBeenCalledExactlyOnceWith("m1", "u1");
      expect(materiaDao.delete).toHaveBeenCalledExactlyOnceWith("m1", "u1");
      expect(removerMock).toHaveBeenCalledExactlyOnceWith([]);
    });
    it("não remove arquivos quando exclusão retorna false", async () => {
      arquivoDao.listarIdsPorMateria.mockResolvedValue([]); materiaDao.delete.mockResolvedValue(false);
      await expect(servico.deletar("m1", "u1")).resolves.toBe(false); expect(removerMock).not.toHaveBeenCalled();
    });
    it("não chama delete se falhar ao listar arquivos", async () => {
      arquivoDao.listarIdsPorMateria.mockRejectedValue(new Error("ids"));
      await expect(servico.deletar("m1", "u1")).rejects.toThrow("ids");
      expect(materiaDao.delete).not.toHaveBeenCalled(); expect(removerMock).not.toHaveBeenCalled();
    });
    it("não remove arquivos se delete lançar erro", async () => {
      arquivoDao.listarIdsPorMateria.mockResolvedValue(["a"]); materiaDao.delete.mockRejectedValue(new Error("delete"));
      await expect(servico.deletar("m1", "u1")).rejects.toThrow("delete"); expect(removerMock).not.toHaveBeenCalled();
    });
    it("propaga erro do armazenamento após excluir a matéria", async () => {
      arquivoDao.listarIdsPorMateria.mockResolvedValue(["a"]); materiaDao.delete.mockResolvedValue(true); removerMock.mockRejectedValue(new Error("storage"));
      await expect(servico.deletar("m1", "u1")).rejects.toThrow("storage"); expect(removerMock).toHaveBeenCalledTimes(1);
    });
  });
});
