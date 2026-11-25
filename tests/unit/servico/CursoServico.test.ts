import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArquivoDao } from "../../../src/dao/Arquivo.dao";
import { CursoDao } from "../../../src/dao/Cuso.dao";
import { CursoDtoCreate } from "../../../src/dto/Curso.dto";
import { Curso } from "../../../src/modelo/Curso";
import { CursoServico } from "../../../src/servico/curso.servico";

const removerMock = vi.hoisted(() => vi.fn());
vi.mock("../../../src/util/arquivoArmazenamento", () => ({ arquivoArmazenamento: { remover: removerMock } }));

describe("CursoServico", () => {
  const cursoDao = {
    salvar: vi.fn<CursoDao["salvar"]>(),
    buscar: vi.fn<CursoDao["buscar"]>(),
    listar: vi.fn<CursoDao["listar"]>(),
    atualizar: vi.fn<CursoDao["atualizar"]>(),
    delete: vi.fn<CursoDao["delete"]>(),
  } satisfies CursoDao;
  const arquivoDao = {
    listarIdsPorCurso: vi.fn<ArquivoDao["listarIdsPorCurso"]>(),
  } satisfies Pick<ArquivoDao, "listarIdsPorCurso">;
  const mocks = { "CursoDao.salvar": cursoDao.salvar, "CursoDao.buscar": cursoDao.buscar, "CursoDao.listar": cursoDao.listar,
    "CursoDao.atualizar": cursoDao.atualizar, "CursoDao.delete": cursoDao.delete,
    "ArquivoDao.listarIdsPorCurso": arquivoDao.listarIdsPorCurso, "arquivoArmazenamento.remover": removerMock };
  let servico: CursoServico;

  beforeEach(() => {
    vi.resetAllMocks();
    servico = new CursoServico(cursoDao, arquivoDao as unknown as ArquivoDao);
  });
  afterEach(() => {
    console.log(`\nChamadas das dependências: ${expect.getState().currentTestName}`);
    console.table(Object.entries(mocks).map(([dependencia, mock]) => ({ dependencia, chamadas: mock.mock.calls.length })));
  });

  describe("salvar", () => {
    it("monta e salva o curso com usuário autenticado", async () => {
      cursoDao.salvar.mockResolvedValue(true);
      const dto = { nome: "Álgebra" } as CursoDtoCreate;
      const result = await servico.salvar(dto, "usuario-1");
      const model = cursoDao.salvar.mock.calls[0][0] as Curso;
      expect(cursoDao.salvar).toHaveBeenCalledTimes(1);
      expect(cursoDao.salvar).toHaveBeenCalledWith(expect.any(Curso), "usuario-1");
      expect(model.props).toMatchObject({ nome: "Álgebra", usuarioId: "usuario-1" });
      expect(result).toEqual(model.props);
      expect(cursoDao.buscar).not.toHaveBeenCalled();
    });
    it("retorna null se o DAO não salvar", async () => {
      cursoDao.salvar.mockResolvedValue(false);
      await expect(servico.salvar({ nome: "X" } as CursoDtoCreate, "u1")).resolves.toBeNull();
      expect(cursoDao.salvar).toHaveBeenCalledTimes(1);
    });
    it("propaga falha do DAO", async () => {
      const error = new Error("falha salvar"); cursoDao.salvar.mockRejectedValue(error);
      await expect(servico.salvar({ nome: "X" } as CursoDtoCreate, "u1")).rejects.toBe(error);
      expect(cursoDao.salvar).toHaveBeenCalledTimes(1);
    });
  });

  describe("buscar", () => {
    it("retorna props do curso encontrado", async () => {
      const curso = Curso.assemble("c1", "Álgebra", "u1"); cursoDao.buscar.mockResolvedValue(curso);
      await expect(servico.buscar("c1", "u1")).resolves.toEqual(curso.props);
      expect(cursoDao.buscar).toHaveBeenCalledExactlyOnceWith("c1", "u1");
    });
    it("retorna null se não encontrado", async () => {
      cursoDao.buscar.mockResolvedValue(null);
      await expect(servico.buscar("missing", "u1")).resolves.toBeNull();
      expect(cursoDao.buscar).toHaveBeenCalledExactlyOnceWith("missing", "u1");
    });
    it("propaga falha da dependência", async () => {
      const error = new Error("falha buscar"); cursoDao.buscar.mockRejectedValue(error);
      await expect(servico.buscar("c1", "u1")).rejects.toBe(error);
      expect(cursoDao.buscar).toHaveBeenCalledTimes(1);
    });
  });

  describe("listar", () => {
    it("mapeia cursos para props públicas", async () => {
      const values = [Curso.assemble("c1", "A", "u1"), Curso.assemble("c2", "B", "u1")]; cursoDao.listar.mockResolvedValue(values);
      await expect(servico.listar("u1")).resolves.toEqual(values.map(c => ({ id: c.id, nome: c.nome, usuarioId: c.usuarioId })));
      expect(cursoDao.listar).toHaveBeenCalledExactlyOnceWith("u1");
    });
    it("retorna lista vazia quando DAO retorna []", async () => {
      cursoDao.listar.mockResolvedValue([]);

      await expect(servico.listar("u1")).resolves.toEqual([]);
      expect(cursoDao.listar).toHaveBeenCalledExactlyOnceWith("u1");
    });
    it("preserva resultado null sem chamadas adicionais", async () => {
      cursoDao.listar.mockResolvedValue(null);
      await expect(servico.listar("u1")).resolves.toBeNull();
      expect(cursoDao.listar).toHaveBeenCalledTimes(1);
    });
    it("propaga falha do DAO", async () => {
      const error = new Error("falha listar"); cursoDao.listar.mockRejectedValue(error);
      await expect(servico.listar("u1")).rejects.toBe(error);
    });
  });

  describe("atualizar", () => {
    it("repassa patch e retorna props atualizadas", async () => {
      const curso = Curso.assemble("c1", "Novo", "u1"); cursoDao.atualizar.mockResolvedValue(curso);
      await expect(servico.atualizar("c1", { nome: "Novo" }, "u1")).resolves.toEqual(curso.props);
      expect(cursoDao.atualizar).toHaveBeenCalledExactlyOnceWith("c1", { nome: "Novo" }, "u1");
    });
    it("retorna null se curso não existir", async () => {
      cursoDao.atualizar.mockResolvedValue(null);
      await expect(servico.atualizar("missing", {}, "u1")).resolves.toBeNull();
      expect(cursoDao.atualizar).toHaveBeenCalledTimes(1);
    });
    it("propaga falha do DAO", async () => {
      const error = new Error("falha atualizar"); cursoDao.atualizar.mockRejectedValue(error);
      await expect(servico.atualizar("c1", {}, "u1")).rejects.toBe(error);
    });
  });

  describe("deletar", () => {
    it("exclui curso e arquivos relacionados quando DAO confirma", async () => {
      arquivoDao.listarIdsPorCurso.mockResolvedValue(["arq1"]); cursoDao.delete.mockResolvedValue(true); removerMock.mockResolvedValue(undefined);
      await expect(servico.deletar("c1", "u1")).resolves.toBe(true);
      expect(arquivoDao.listarIdsPorCurso).toHaveBeenCalledExactlyOnceWith("c1", "u1");
      expect(cursoDao.delete).toHaveBeenCalledExactlyOnceWith("c1", "u1");
      expect(removerMock).toHaveBeenCalledExactlyOnceWith(["arq1"]);
    });
    it("não remove arquivos se DAO não excluir curso", async () => {
      arquivoDao.listarIdsPorCurso.mockResolvedValue(["arq1"]); cursoDao.delete.mockResolvedValue(false);
      await expect(servico.deletar("c1", "u1")).resolves.toBe(false);
      expect(cursoDao.delete).toHaveBeenCalledTimes(1); expect(removerMock).not.toHaveBeenCalled();
    });
    it("remove também com lista de arquivos vazia após exclusão confirmada", async () => {
      arquivoDao.listarIdsPorCurso.mockResolvedValue([]); cursoDao.delete.mockResolvedValue(true);
      await expect(servico.deletar("c1", "u1")).resolves.toBe(true);
      expect(removerMock).toHaveBeenCalledExactlyOnceWith([]);
    });
    it("não exclui o curso se a busca de arquivos falhar", async () => {
      arquivoDao.listarIdsPorCurso.mockRejectedValue(new Error("falha ids"));
      await expect(servico.deletar("c1", "u1")).rejects.toThrow("falha ids");
      expect(cursoDao.delete).not.toHaveBeenCalled(); expect(removerMock).not.toHaveBeenCalled();
    });
    it("propaga falha ao excluir sem remover arquivos", async () => {
      arquivoDao.listarIdsPorCurso.mockResolvedValue(["a"]); cursoDao.delete.mockRejectedValue(new Error("falha delete"));
      await expect(servico.deletar("c1", "u1")).rejects.toThrow("falha delete");
      expect(removerMock).not.toHaveBeenCalled();
    });
    it("propaga falha ao remover arquivos após exclusão", async () => {
      arquivoDao.listarIdsPorCurso.mockResolvedValue(["a"]); cursoDao.delete.mockResolvedValue(true); removerMock.mockRejectedValue(new Error("falha storage"));
      await expect(servico.deletar("c1", "u1")).rejects.toThrow("falha storage");
      expect(cursoDao.delete).toHaveBeenCalledTimes(1); expect(removerMock).toHaveBeenCalledTimes(1);
    });
  });
});
