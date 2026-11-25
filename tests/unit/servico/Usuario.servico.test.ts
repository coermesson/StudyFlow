
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scryptSync } from "node:crypto";
import { ArquivoDao } from "../../../src/dao/Arquivo.dao";
import { UsuarioDao } from "../../../src/dao/Usuario.dao";
import { Usuario } from "../../../src/modelo/Usuario";
import { UsuarioServico, verificarSenha } from "../../../src/servico/Usuario.servico";


const removerMock = vi.hoisted(() => vi.fn());

vi.mock("../../../src/util/arquivoArmazenamento", () => ({
  arquivoArmazenamento: {
    remover: removerMock,
  },
}));

describe("UsuarioServico", () => {
  const usuarioDao = {
    salvar: vi.fn(),
    buscar: vi.fn(),
    buscarPorEmail: vi.fn(),
    atualizar: vi.fn(),
    delete: vi.fn(),
    listar: vi.fn(),
  };

  const arquivoDao = {
    listarIdsPorUsuario: vi.fn(),
  };

  const mocks = {
  "UsuarioDao.salvar": usuarioDao.salvar,
  "UsuarioDao.buscar": usuarioDao.buscar,
  "UsuarioDao.buscarPorEmail": usuarioDao.buscarPorEmail,
  "UsuarioDao.atualizar": usuarioDao.atualizar,
  "UsuarioDao.delete": usuarioDao.delete,
  "UsuarioDao.listar": usuarioDao.listar,
  "ArquivoDao.listarIdsPorUsuario": arquivoDao.listarIdsPorUsuario,
  "arquivoArmazenamento.remover": removerMock,
};

afterEach(() => {
  console.log(
    `\nChamadas das dependências: ${expect.getState().currentTestName}`
  );

  const relatorio = Object.entries(mocks).map(
    ([dependencia, mock]) => ({
      dependencia,
      chamadas: mock.mock.calls.length,
    })
  );

  console.table(relatorio);
});

  let servico: UsuarioServico;

  beforeEach(() => {
    vi.resetAllMocks();

    servico = new UsuarioServico(
      usuarioDao as unknown as UsuarioDao,
      arquivoDao as unknown as ArquivoDao
    );
  });

  describe("autenticar", () => {
    const senha = "senha-correta";
    const salt = Buffer.from("0123456789abcdef");
    const senhaHash = (): string => {
      const hash = scryptSync(senha, salt, 64, { N: 16384, r: 8, p: 1 });
      return `$scrypt$v1$N=16384,r=8,p=1$${salt.toString("base64url")}$${hash.toString("base64url")}`;
    };

    it("retorna null e não valida senha quando o email não existe", async () => {
      usuarioDao.buscarPorEmail.mockResolvedValue(null);

      await expect(servico.autenticar("ausente@email.com", senha)).resolves.toBeNull();

      expect(usuarioDao.buscarPorEmail).toHaveBeenCalledExactlyOnceWith("ausente@email.com");
      expect(usuarioDao.salvar).not.toHaveBeenCalled();
      expect(usuarioDao.buscar).not.toHaveBeenCalled();
      expect(usuarioDao.atualizar).not.toHaveBeenCalled();
      expect(usuarioDao.delete).not.toHaveBeenCalled();
      expect(usuarioDao.listar).not.toHaveBeenCalled();
      expect(arquivoDao.listarIdsPorUsuario).not.toHaveBeenCalled();
      expect(removerMock).not.toHaveBeenCalled();
    });

    it("retorna null para senha incorreta", async () => {
      const usuario = Usuario.assemble("usuario-1", "Teste", "teste@email.com", senhaHash());
      usuarioDao.buscarPorEmail.mockResolvedValue(usuario);

      await expect(servico.autenticar(usuario.email, "senha-incorreta")).resolves.toBeNull();

      expect(usuarioDao.buscarPorEmail).toHaveBeenCalledExactlyOnceWith(usuario.email);
      expect(usuarioDao.atualizar).not.toHaveBeenCalled();
    });

    it("retorna somente os dados públicos para senha válida", async () => {
      const usuario = Usuario.assemble("usuario-1", "Teste", "teste@email.com", senhaHash());
      usuarioDao.buscarPorEmail.mockResolvedValue(usuario);

      await expect(servico.autenticar(usuario.email, senha)).resolves.toEqual({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
      });

      expect(usuarioDao.buscarPorEmail).toHaveBeenCalledExactlyOnceWith(usuario.email);
      expect(usuarioDao.atualizar).not.toHaveBeenCalled();
    });

    it("propaga erro da busca por email", async () => {
      const erro = new Error("Erro ao buscar usuário por email");
      usuarioDao.buscarPorEmail.mockRejectedValue(erro);

      await expect(servico.autenticar("teste@email.com", senha)).rejects.toBe(erro);

      expect(usuarioDao.buscarPorEmail).toHaveBeenCalledExactlyOnceWith("teste@email.com");
      expect(usuarioDao.atualizar).not.toHaveBeenCalled();
    });
  });

  
describe("salvar", () => {
  it("deve cadastrar um usuário com sucesso", async () => {
    usuarioDao.salvar.mockResolvedValue(true);

    const dados = {
      nome: "Usuário Teste",
      email: "teste@email.com",
      senha: "senha123",
    };

    const resultado = await servico.salvar(dados);

    const usuarioSalvo = usuarioDao.salvar.mock.calls[0][0] as Usuario;

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.salvar).toHaveBeenCalledWith(
      expect.any(Usuario)
    );

    expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(usuarioDao.listar).toHaveBeenCalledTimes(0);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);

    expect(usuarioSalvo.id).toEqual(expect.any(String));
    expect(usuarioSalvo.id.length).toBeGreaterThan(0);
    expect(usuarioSalvo.nome).toBe(dados.nome);
    expect(usuarioSalvo.email).toBe(dados.email);
    expect(usuarioSalvo.senhaHash).not.toBe(dados.senha);

    expect(
      await verificarSenha(dados.senha, usuarioSalvo.senhaHash)
    ).toBe(true);

    expect(resultado).toEqual({
      id: usuarioSalvo.id,
      nome: dados.nome,
      email: dados.email,
    });

    expect(resultado).not.toHaveProperty("senha");
    expect(resultado).not.toHaveProperty("senhaHash");
  });

  it("deve lançar erro quando o DAO retornar false", async () => {
    usuarioDao.salvar.mockResolvedValue(false);

    await expect(
      servico.salvar({
        nome: "Usuário Teste",
        email: "teste@email.com",
        senha: "senha123",
      })
    ).rejects.toThrow("Não foi possível cadastrar o usuário.");

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(usuarioDao.listar).toHaveBeenCalledTimes(0);
  });

  it("deve propagar o erro quando o DAO falhar", async () => {
    const erro = new Error("Erro ao salvar usuário");

    usuarioDao.salvar.mockRejectedValue(erro);

    await expect(
      servico.salvar({
        nome: "Usuário Teste",
        email: "teste@email.com",
        senha: "senha123",
      })
    ).rejects.toThrow("Erro ao salvar usuário");

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(usuarioDao.listar).toHaveBeenCalledTimes(0);
  });
});


describe("buscar", () => {
  it("deve retornar os dados do usuário quando encontrado", async () => {
    const id = "usuario-123";
    const usuarioId = "usuario-123";

    const usuario = Usuario.assemble(
      id,
      "Usuário Teste",
      "teste@email.com",
      "hash-da-senha"
    );

    usuarioDao.buscar.mockResolvedValue(usuario);

    const resultado = await servico.buscar(id, usuarioId);

    expect(usuarioDao.buscar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.buscar).toHaveBeenCalledWith(id, usuarioId);

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(usuarioDao.listar).toHaveBeenCalledTimes(0);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);

    expect(resultado).toEqual({
      id,
      nome: "Usuário Teste",
      email: "teste@email.com",
    });

    expect(resultado).not.toHaveProperty("senhaHash");
  });

  it("deve retornar null quando o usuário não for encontrado", async () => {
    const id = "usuario-inexistente";
    const usuarioId = "usuario-123";

    usuarioDao.buscar.mockResolvedValue(null);

    const resultado = await servico.buscar(id, usuarioId);

    expect(usuarioDao.buscar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.buscar).toHaveBeenCalledWith(id, usuarioId);

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(usuarioDao.listar).toHaveBeenCalledTimes(0);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);

    expect(resultado).toBeNull();
  });

  it("deve propagar o erro quando o DAO falhar na busca", async () => {
    const id = "usuario-123";
    const usuarioId = "usuario-123";
    const erro = new Error("Erro ao buscar usuário");

    usuarioDao.buscar.mockRejectedValue(erro);

    await expect(
      servico.buscar(id, usuarioId)
    ).rejects.toThrow("Erro ao buscar usuário");

    expect(usuarioDao.buscar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.buscar).toHaveBeenCalledWith(id, usuarioId);

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(usuarioDao.listar).toHaveBeenCalledTimes(0);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
  });
});


describe("deletar", () => {
  const id = "usuario-123";
  const usuarioId = "usuario-123";

  it("deve excluir o usuário e remover seus arquivos", async () => {
    const arquivos = ["arquivo-1", "arquivo-2"];

    arquivoDao.listarIdsPorUsuario.mockResolvedValue(arquivos);
    usuarioDao.delete.mockResolvedValue(true);
    removerMock.mockResolvedValue(undefined);

    const resultado = await servico.deletar(id, usuarioId);

    // Verifica a busca dos arquivos
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(1);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledWith(usuarioId);

    // Verifica a exclusão do usuário
    expect(usuarioDao.delete).toHaveBeenCalledTimes(1);
    expect(usuarioDao.delete).toHaveBeenCalledWith(id, usuarioId);

    // Verifica a remoção dos arquivos
    expect(removerMock).toHaveBeenCalledTimes(1);
    expect(removerMock).toHaveBeenCalledWith(arquivos);

    expect(resultado).toBe(true);

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.listar).toHaveBeenCalledTimes(0);
  });

  it("não deve remover os arquivos quando a exclusão retornar false", async () => {
    const arquivos = ["arquivo-1", "arquivo-2"];

    arquivoDao.listarIdsPorUsuario.mockResolvedValue(arquivos);
    usuarioDao.delete.mockResolvedValue(false);

    const resultado = await servico.deletar(id, usuarioId);

    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(1);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledWith(usuarioId);

    expect(usuarioDao.delete).toHaveBeenCalledTimes(1);
    expect(usuarioDao.delete).toHaveBeenCalledWith(id, usuarioId);

    expect(removerMock).toHaveBeenCalledTimes(0);

    expect(resultado).toBe(false);

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.listar).toHaveBeenCalledTimes(0);
  });

  it("deve chamar a remoção mesmo quando não existirem arquivos", async () => {
    arquivoDao.listarIdsPorUsuario.mockResolvedValue([]);
    usuarioDao.delete.mockResolvedValue(true);
    removerMock.mockResolvedValue(undefined);

    const resultado = await servico.deletar(id, usuarioId);

    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(1);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(1);
    expect(removerMock).toHaveBeenCalledTimes(1);
    expect(removerMock).toHaveBeenCalledWith([]);

    expect(resultado).toBe(true);
  });

  it("deve propagar o erro quando falhar ao listar os arquivos", async () => {
    const erro = new Error("Erro ao listar arquivos");

    arquivoDao.listarIdsPorUsuario.mockRejectedValue(erro);

    await expect(
      servico.deletar(id, usuarioId)
    ).rejects.toBe(erro);

    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(1);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledWith(usuarioId);

    // A exclusão não deve acontecer
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);

    // A remoção dos arquivos também não deve acontecer
    expect(removerMock).toHaveBeenCalledTimes(0);
  });

  it("deve propagar o erro quando falhar ao excluir o usuário", async () => {
    const arquivos = ["arquivo-1"];
    const erro = new Error("Erro ao excluir usuário");

    arquivoDao.listarIdsPorUsuario.mockResolvedValue(arquivos);
    usuarioDao.delete.mockRejectedValue(erro);

    await expect(
      servico.deletar(id, usuarioId)
    ).rejects.toBe(erro);

    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(1);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(1);

    // Os arquivos não devem ser removidos
    expect(removerMock).toHaveBeenCalledTimes(0);
  });

  it("deve propagar o erro quando falhar ao remover os arquivos", async () => {
    const arquivos = ["arquivo-1"];
    const erro = new Error("Erro ao remover arquivos");

    arquivoDao.listarIdsPorUsuario.mockResolvedValue(arquivos);
    usuarioDao.delete.mockResolvedValue(true);
    removerMock.mockRejectedValue(erro);

    await expect(
      servico.deletar(id, usuarioId)
    ).rejects.toBe(erro);

    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(1);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(1);
    expect(removerMock).toHaveBeenCalledTimes(1);
    expect(removerMock).toHaveBeenCalledWith(arquivos);
  });
});


describe("atualizar", () => {
  const id = "usuario-123";
  const usuarioId = "usuario-123";

  const usuarioAtualizado = Usuario.assemble(
    id,
    "Usuário Atualizado",
    "atualizado@email.com",
    "hash-atualizado"
  );

  const cenarios = [
    {
      descricao: "somente nome",
      dados: { nome: "Novo Nome" },
      esperado: { nome: "Novo Nome", email: undefined },
      senhaAlterada: false,
    },
    {
      descricao: "somente email",
      dados: { email: "novo@email.com" },
      esperado: { nome: undefined, email: "novo@email.com" },
      senhaAlterada: false,
    },
    {
      descricao: "nome e email",
      dados: { nome: "Novo Nome", email: "novo@email.com" },
      esperado: { nome: "Novo Nome", email: "novo@email.com" },
      senhaAlterada: false,
    },
    {
      descricao: "somente senha",
      dados: { senha: "novaSenha123" },
      esperado: { nome: undefined, email: undefined },
      senhaAlterada: true,
    },
    {
      descricao: "nome e senha",
      dados: { nome: "Novo Nome", senha: "novaSenha123" },
      esperado: { nome: "Novo Nome", email: undefined },
      senhaAlterada: true,
    },
    {
      descricao: "email e senha",
      dados: { email: "novo@email.com", senha: "novaSenha123" },
      esperado: { nome: undefined, email: "novo@email.com" },
      senhaAlterada: true,
    },
    {
      descricao: "nome, email e senha",
      dados: {
        nome: "Novo Nome",
        email: "novo@email.com",
        senha: "novaSenha123",
      },
      esperado: { nome: "Novo Nome", email: "novo@email.com" },
      senhaAlterada: true,
    },
  ];

  it.each(cenarios)(
    "deve atualizar o usuário com $descricao",
    async ({ dados, esperado, senhaAlterada }) => {
      usuarioDao.atualizar.mockResolvedValue(usuarioAtualizado);

      const resultado = await servico.atualizar(
        id,
        dados,
        usuarioId
      );

      expect(usuarioDao.atualizar).toHaveBeenCalledTimes(1);
      expect(usuarioDao.atualizar).toHaveBeenCalledWith(
        id,
        expect.objectContaining(esperado),
        usuarioId
      );

      const dadosEnviados = usuarioDao.atualizar.mock.calls[0][1];

      if (senhaAlterada) {
        expect(dadosEnviados.senhaHash).toEqual(expect.any(String));
        expect(dadosEnviados.senhaHash).not.toBe(dados.senha);

        expect(
          await verificarSenha(
            dados.senha!,
            dadosEnviados.senhaHash!
          )
        ).toBe(true);
      } else {
        expect(dadosEnviados.senhaHash).toBeUndefined();
      }

      expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
      expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
      expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
      expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
      expect(usuarioDao.listar).toHaveBeenCalledTimes(0);
      expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);

      expect(resultado).toEqual({
        id,
        nome: "Usuário Atualizado",
        email: "atualizado@email.com",
      });

      expect(resultado).not.toHaveProperty("senhaHash");
    }
  );

  it("deve retornar null quando o usuário não for encontrado", async () => {
    usuarioDao.atualizar.mockResolvedValue(null);

    const resultado = await servico.atualizar(
      id,
      { nome: "Novo Nome" },
      usuarioId
    );

    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.atualizar).toHaveBeenCalledWith(
      id,
      { nome: "Novo Nome", email: undefined },
      usuarioId
    );

    expect(resultado).toBeNull();

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(usuarioDao.listar).toHaveBeenCalledTimes(0);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
  });

  it("deve propagar o erro quando o DAO falhar", async () => {
    const erro = new Error("Erro ao atualizar usuário");

    usuarioDao.atualizar.mockRejectedValue(erro);

    await expect(
      servico.atualizar(
        id,
        { nome: "Novo Nome" },
        usuarioId
      )
    ).rejects.toBe(erro);

    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.atualizar).toHaveBeenCalledWith(
      id,
      { nome: "Novo Nome", email: undefined },
      usuarioId
    );

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(usuarioDao.listar).toHaveBeenCalledTimes(0);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
  });

  it("deve enviar os campos indefinidos quando nenhum dado for informado", async () => {
    usuarioDao.atualizar.mockResolvedValue(null);

    const resultado = await servico.atualizar(
      id,
      {},
      usuarioId
    );

    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.atualizar).toHaveBeenCalledWith(
      id,
      { nome: undefined, email: undefined },
      usuarioId
    );

    expect(resultado).toBeNull();

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(usuarioDao.listar).toHaveBeenCalledTimes(0);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
  });
});



describe("listar", () => {
  const usuarioId = "usuario-123";

  it("deve retornar a lista de usuários", async () => {
    const usuarios = [
      {
        id: "usuario-1",
        nome: "Usuário 1",
        email: "usuario1@email.com",
      },
      {
        id: "usuario-2",
        nome: "Usuário 2",
        email: "usuario2@email.com",
      },
    ];

    usuarioDao.listar.mockResolvedValue(usuarios);

    const resultado = await servico.listar(usuarioId);

    expect(usuarioDao.listar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.listar).toHaveBeenCalledWith(usuarioId);

    expect(resultado).toEqual(usuarios);
    expect(resultado).toHaveLength(2);

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
  });

  it("deve retornar uma lista vazia quando não houver usuários", async () => {
    usuarioDao.listar.mockResolvedValue([]);

    const resultado = await servico.listar(usuarioId);

    expect(usuarioDao.listar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.listar).toHaveBeenCalledWith(usuarioId);

    expect(resultado).toEqual([]);
    expect(resultado).toHaveLength(0);

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
  });

  it("deve retornar null quando o DAO retornar null", async () => {
    usuarioDao.listar.mockResolvedValue(null);

    const resultado = await servico.listar(usuarioId);

    expect(usuarioDao.listar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.listar).toHaveBeenCalledWith(usuarioId);

    expect(resultado).toBeNull();

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
  });

  it("deve propagar o erro quando o DAO falhar na listagem", async () => {
    const erro = new Error("Erro ao listar usuários");

    usuarioDao.listar.mockRejectedValue(erro);

    await expect(
      servico.listar(usuarioId)
    ).rejects.toBe(erro);

    expect(usuarioDao.listar).toHaveBeenCalledTimes(1);
    expect(usuarioDao.listar).toHaveBeenCalledWith(usuarioId);

    expect(usuarioDao.salvar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
    expect(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
    expect(usuarioDao.delete).toHaveBeenCalledTimes(0);
    expect(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
  });
});

});
