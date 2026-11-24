"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const Usuario_1 = require("../../../src/modelo/Usuario");
const Usuario_servico_1 = require("../../../src/servico/Usuario.servico");
const removerMock = vitest_1.vi.hoisted(() => vitest_1.vi.fn());
vitest_1.vi.mock("../../../src/util/arquivoArmazenamento", () => ({
    arquivoArmazenamento: {
        remover: removerMock,
    },
}));
(0, vitest_1.describe)("UsuarioServico", () => {
    const usuarioDao = {
        salvar: vitest_1.vi.fn(),
        buscar: vitest_1.vi.fn(),
        buscarPorEmail: vitest_1.vi.fn(),
        atualizar: vitest_1.vi.fn(),
        delete: vitest_1.vi.fn(),
        listar: vitest_1.vi.fn(),
    };
    const arquivoDao = {
        listarIdsPorUsuario: vitest_1.vi.fn(),
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
    (0, vitest_1.afterEach)(() => {
        console.log(`\nChamadas das dependências: ${vitest_1.expect.getState().currentTestName}`);
        const relatorio = Object.entries(mocks).map(([dependencia, mock]) => ({
            dependencia,
            chamadas: mock.mock.calls.length,
        }));
        console.table(relatorio);
    });
    let servico;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetAllMocks();
        servico = new Usuario_servico_1.UsuarioServico(usuarioDao, arquivoDao);
    });
    (0, vitest_1.describe)("salvar", () => {
        (0, vitest_1.it)("deve cadastrar um usuário com sucesso", async () => {
            usuarioDao.salvar.mockResolvedValue(true);
            const dados = {
                nome: "Usuário Teste",
                email: "teste@email.com",
                senha: "senha123",
            };
            const resultado = await servico.salvar(dados);
            const usuarioSalvo = usuarioDao.salvar.mock.calls[0][0];
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledWith(vitest_1.expect.any(Usuario_1.Usuario));
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioSalvo.id).toEqual(vitest_1.expect.any(String));
            (0, vitest_1.expect)(usuarioSalvo.id.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(usuarioSalvo.nome).toBe(dados.nome);
            (0, vitest_1.expect)(usuarioSalvo.email).toBe(dados.email);
            (0, vitest_1.expect)(usuarioSalvo.senhaHash).not.toBe(dados.senha);
            (0, vitest_1.expect)(await (0, Usuario_servico_1.verificarSenha)(dados.senha, usuarioSalvo.senhaHash)).toBe(true);
            (0, vitest_1.expect)(resultado).toEqual({
                id: usuarioSalvo.id,
                nome: dados.nome,
                email: dados.email,
            });
            (0, vitest_1.expect)(resultado).not.toHaveProperty("senha");
            (0, vitest_1.expect)(resultado).not.toHaveProperty("senhaHash");
        });
        (0, vitest_1.it)("deve lançar erro quando o DAO retornar false", async () => {
            usuarioDao.salvar.mockResolvedValue(false);
            await (0, vitest_1.expect)(servico.salvar({
                nome: "Usuário Teste",
                email: "teste@email.com",
                senha: "senha123",
            })).rejects.toThrow("Não foi possível cadastrar o usuário.");
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(0);
        });
        (0, vitest_1.it)("deve propagar o erro quando o DAO falhar", async () => {
            const erro = new Error("Erro ao salvar usuário");
            usuarioDao.salvar.mockRejectedValue(erro);
            await (0, vitest_1.expect)(servico.salvar({
                nome: "Usuário Teste",
                email: "teste@email.com",
                senha: "senha123",
            })).rejects.toThrow("Erro ao salvar usuário");
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(0);
        });
    });
    (0, vitest_1.describe)("buscar", () => {
        (0, vitest_1.it)("deve retornar os dados do usuário quando encontrado", async () => {
            const id = "usuario-123";
            const usuarioId = "usuario-123";
            const usuario = Usuario_1.Usuario.assemble(id, "Usuário Teste", "teste@email.com", "hash-da-senha");
            usuarioDao.buscar.mockResolvedValue(usuario);
            const resultado = await servico.buscar(id, usuarioId);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledWith(id, usuarioId);
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(resultado).toEqual({
                id,
                nome: "Usuário Teste",
                email: "teste@email.com",
            });
            (0, vitest_1.expect)(resultado).not.toHaveProperty("senhaHash");
        });
        (0, vitest_1.it)("deve retornar null quando o usuário não for encontrado", async () => {
            const id = "usuario-inexistente";
            const usuarioId = "usuario-123";
            usuarioDao.buscar.mockResolvedValue(null);
            const resultado = await servico.buscar(id, usuarioId);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledWith(id, usuarioId);
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(resultado).toBeNull();
        });
        (0, vitest_1.it)("deve propagar o erro quando o DAO falhar na busca", async () => {
            const id = "usuario-123";
            const usuarioId = "usuario-123";
            const erro = new Error("Erro ao buscar usuário");
            usuarioDao.buscar.mockRejectedValue(erro);
            await (0, vitest_1.expect)(servico.buscar(id, usuarioId)).rejects.toThrow("Erro ao buscar usuário");
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledWith(id, usuarioId);
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
        });
    });
    (0, vitest_1.describe)("deletar", () => {
        const id = "usuario-123";
        const usuarioId = "usuario-123";
        (0, vitest_1.it)("deve excluir o usuário e remover seus arquivos", async () => {
            const arquivos = ["arquivo-1", "arquivo-2"];
            arquivoDao.listarIdsPorUsuario.mockResolvedValue(arquivos);
            usuarioDao.delete.mockResolvedValue(true);
            removerMock.mockResolvedValue(undefined);
            const resultado = await servico.deletar(id, usuarioId);
            // Verifica a busca dos arquivos
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledWith(usuarioId);
            // Verifica a exclusão do usuário
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledWith(id, usuarioId);
            // Verifica a remoção dos arquivos
            (0, vitest_1.expect)(removerMock).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(removerMock).toHaveBeenCalledWith(arquivos);
            (0, vitest_1.expect)(resultado).toBe(true);
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(0);
        });
        (0, vitest_1.it)("não deve remover os arquivos quando a exclusão retornar false", async () => {
            const arquivos = ["arquivo-1", "arquivo-2"];
            arquivoDao.listarIdsPorUsuario.mockResolvedValue(arquivos);
            usuarioDao.delete.mockResolvedValue(false);
            const resultado = await servico.deletar(id, usuarioId);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledWith(usuarioId);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledWith(id, usuarioId);
            (0, vitest_1.expect)(removerMock).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(resultado).toBe(false);
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(0);
        });
        (0, vitest_1.it)("deve chamar a remoção mesmo quando não existirem arquivos", async () => {
            arquivoDao.listarIdsPorUsuario.mockResolvedValue([]);
            usuarioDao.delete.mockResolvedValue(true);
            removerMock.mockResolvedValue(undefined);
            const resultado = await servico.deletar(id, usuarioId);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(removerMock).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(removerMock).toHaveBeenCalledWith([]);
            (0, vitest_1.expect)(resultado).toBe(true);
        });
        (0, vitest_1.it)("deve propagar o erro quando falhar ao listar os arquivos", async () => {
            const erro = new Error("Erro ao listar arquivos");
            arquivoDao.listarIdsPorUsuario.mockRejectedValue(erro);
            await (0, vitest_1.expect)(servico.deletar(id, usuarioId)).rejects.toBe(erro);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledWith(usuarioId);
            // A exclusão não deve acontecer
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            // A remoção dos arquivos também não deve acontecer
            (0, vitest_1.expect)(removerMock).toHaveBeenCalledTimes(0);
        });
        (0, vitest_1.it)("deve propagar o erro quando falhar ao excluir o usuário", async () => {
            const arquivos = ["arquivo-1"];
            const erro = new Error("Erro ao excluir usuário");
            arquivoDao.listarIdsPorUsuario.mockResolvedValue(arquivos);
            usuarioDao.delete.mockRejectedValue(erro);
            await (0, vitest_1.expect)(servico.deletar(id, usuarioId)).rejects.toBe(erro);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(1);
            // Os arquivos não devem ser removidos
            (0, vitest_1.expect)(removerMock).toHaveBeenCalledTimes(0);
        });
        (0, vitest_1.it)("deve propagar o erro quando falhar ao remover os arquivos", async () => {
            const arquivos = ["arquivo-1"];
            const erro = new Error("Erro ao remover arquivos");
            arquivoDao.listarIdsPorUsuario.mockResolvedValue(arquivos);
            usuarioDao.delete.mockResolvedValue(true);
            removerMock.mockRejectedValue(erro);
            await (0, vitest_1.expect)(servico.deletar(id, usuarioId)).rejects.toBe(erro);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(removerMock).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(removerMock).toHaveBeenCalledWith(arquivos);
        });
    });
    (0, vitest_1.describe)("atualizar", () => {
        const id = "usuario-123";
        const usuarioId = "usuario-123";
        const usuarioAtualizado = Usuario_1.Usuario.assemble(id, "Usuário Atualizado", "atualizado@email.com", "hash-atualizado");
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
        vitest_1.it.each(cenarios)("deve atualizar o usuário com $descricao", async ({ dados, esperado, senhaAlterada }) => {
            usuarioDao.atualizar.mockResolvedValue(usuarioAtualizado);
            const resultado = await servico.atualizar(id, dados, usuarioId);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledWith(id, vitest_1.expect.objectContaining(esperado), usuarioId);
            const dadosEnviados = usuarioDao.atualizar.mock.calls[0][1];
            if (senhaAlterada) {
                (0, vitest_1.expect)(dadosEnviados.senhaHash).toEqual(vitest_1.expect.any(String));
                (0, vitest_1.expect)(dadosEnviados.senhaHash).not.toBe(dados.senha);
                (0, vitest_1.expect)(await (0, Usuario_servico_1.verificarSenha)(dados.senha, dadosEnviados.senhaHash)).toBe(true);
            }
            else {
                (0, vitest_1.expect)(dadosEnviados.senhaHash).toBeUndefined();
            }
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(resultado).toEqual({
                id,
                nome: "Usuário Atualizado",
                email: "atualizado@email.com",
            });
            (0, vitest_1.expect)(resultado).not.toHaveProperty("senhaHash");
        });
        (0, vitest_1.it)("deve retornar null quando o usuário não for encontrado", async () => {
            usuarioDao.atualizar.mockResolvedValue(null);
            const resultado = await servico.atualizar(id, { nome: "Novo Nome" }, usuarioId);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledWith(id, { nome: "Novo Nome", email: undefined }, usuarioId);
            (0, vitest_1.expect)(resultado).toBeNull();
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
        });
        (0, vitest_1.it)("deve propagar o erro quando o DAO falhar", async () => {
            const erro = new Error("Erro ao atualizar usuário");
            usuarioDao.atualizar.mockRejectedValue(erro);
            await (0, vitest_1.expect)(servico.atualizar(id, { nome: "Novo Nome" }, usuarioId)).rejects.toBe(erro);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledWith(id, { nome: "Novo Nome", email: undefined }, usuarioId);
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
        });
        (0, vitest_1.it)("deve enviar os campos indefinidos quando nenhum dado for informado", async () => {
            usuarioDao.atualizar.mockResolvedValue(null);
            const resultado = await servico.atualizar(id, {}, usuarioId);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledWith(id, { nome: undefined, email: undefined }, usuarioId);
            (0, vitest_1.expect)(resultado).toBeNull();
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
        });
    });
    (0, vitest_1.describe)("listar", () => {
        const usuarioId = "usuario-123";
        (0, vitest_1.it)("deve retornar a lista de usuários", async () => {
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
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledWith(usuarioId);
            (0, vitest_1.expect)(resultado).toEqual(usuarios);
            (0, vitest_1.expect)(resultado).toHaveLength(2);
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
        });
        (0, vitest_1.it)("deve retornar uma lista vazia quando não houver usuários", async () => {
            usuarioDao.listar.mockResolvedValue([]);
            const resultado = await servico.listar(usuarioId);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledWith(usuarioId);
            (0, vitest_1.expect)(resultado).toEqual([]);
            (0, vitest_1.expect)(resultado).toHaveLength(0);
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
        });
        (0, vitest_1.it)("deve retornar null quando o DAO retornar null", async () => {
            usuarioDao.listar.mockResolvedValue(null);
            const resultado = await servico.listar(usuarioId);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledWith(usuarioId);
            (0, vitest_1.expect)(resultado).toBeNull();
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
        });
        (0, vitest_1.it)("deve propagar o erro quando o DAO falhar na listagem", async () => {
            const erro = new Error("Erro ao listar usuários");
            usuarioDao.listar.mockRejectedValue(erro);
            await (0, vitest_1.expect)(servico.listar(usuarioId)).rejects.toBe(erro);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(usuarioDao.listar).toHaveBeenCalledWith(usuarioId);
            (0, vitest_1.expect)(usuarioDao.salvar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.buscarPorEmail).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.atualizar).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(usuarioDao.delete).toHaveBeenCalledTimes(0);
            (0, vitest_1.expect)(arquivoDao.listarIdsPorUsuario).toHaveBeenCalledTimes(0);
        });
    });
});
