import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { ArquivoDao } from "../dao/Arquivo.dao";
import { UsuarioDao } from "../dao/Usuario.dao";
import { UsuarioDtoCreate, UsuarioDtoUpdate, UsuarioListarDto } from "../dto/Usuario.dto";
import { Usuario, UsuarioProps } from "../modelo/Usuario";
import { arquivoArmazenamento } from "../util/arquivoArmazenamento";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_SALT_LENGTH = 16;

function derivarHash(senha: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(
      senha,
      salt,
      SCRYPT_KEY_LENGTH,
      { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P },
      (erro, hash) => {
        if (erro) return reject(erro);
        resolve(hash);
      }
    );
  });
}

async function gerarHashSenha(senha: string): Promise<string> {
  const salt = randomBytes(SCRYPT_SALT_LENGTH);
  const hash = await derivarHash(senha, salt);
  return `$scrypt$v1$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$${salt.toString("base64url")}$${hash.toString("base64url")}`;
}

export async function verificarSenha(senha: string, hashArmazenado: string): Promise<boolean> {
  const partes = /^\$scrypt\$v1\$N=16384,r=8,p=1\$([A-Za-z0-9_-]+)\$([A-Za-z0-9_-]+)$/.exec(hashArmazenado);
  if (!partes) return false;

  const salt = Buffer.from(partes[1], "base64url");
  const hashEsperado = Buffer.from(partes[2], "base64url");
  if (salt.length !== SCRYPT_SALT_LENGTH || hashEsperado.length !== SCRYPT_KEY_LENGTH) {
    return false;
  }

  const hashCalculado = await derivarHash(senha, salt);
  return timingSafeEqual(hashEsperado, hashCalculado);
}

export class UsuarioServico {
  constructor(private usuarioDao: UsuarioDao, private arquivoDao = new ArquivoDao()) {}

  private projetarUsuario(usuario: Usuario): UsuarioListarDto {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
    };
  }

  public async salvar(dto: UsuarioDtoCreate): Promise<UsuarioListarDto> {
  const senhaHash = await gerarHashSenha(dto.senha);

  const usuario = Usuario.build({
    nome: dto.nome,
    email: dto.email,
    senhaHash,
  });

  const salvo = await this.usuarioDao.salvar(usuario);

  if (!salvo) {
    throw new Error("Não foi possível cadastrar o usuário.");
  }

  return this.projetarUsuario(usuario);
}

  public async buscar(id: string, usuarioId: string): Promise<UsuarioListarDto | null> {
    const usuario = await this.usuarioDao.buscar(id, usuarioId);
    return usuario ? this.projetarUsuario(usuario) : null;
  }

  public async autenticar(email: string, senha: string): Promise<UsuarioListarDto | null> {
    const usuario = await this.usuarioDao.buscarPorEmail(email);
    if (!usuario || !(await verificarSenha(senha, usuario.senhaHash))) return null;
    return this.projetarUsuario(usuario);
  }

  public async listar(usuarioId: string): Promise<UsuarioListarDto[] | null> {
    return this.usuarioDao.listar(usuarioId);
  }

  public async atualizar(id: string, dados: UsuarioDtoUpdate, usuarioId: string): Promise<UsuarioListarDto | null> {
    const atualizacao: Partial<UsuarioProps> = {
      nome: dados.nome,
      email: dados.email,
    };

    if (dados.senha !== undefined) {
      atualizacao.senhaHash = await gerarHashSenha(dados.senha);
    }

    const usuario = await this.usuarioDao.atualizar(id, atualizacao, usuarioId);
    return usuario ? this.projetarUsuario(usuario) : null;
  }

  public async deletar(id: string, usuarioId: string): Promise<boolean> {
    const arquivos = await this.arquivoDao.listarIdsPorUsuario(usuarioId);
    const deletado = await this.usuarioDao.delete(id, usuarioId);
    if (deletado) await arquivoArmazenamento.remover(arquivos);
    return deletado;
  }
}
