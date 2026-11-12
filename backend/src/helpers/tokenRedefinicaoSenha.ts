import { decode, sign, verify } from "jsonwebtoken";
import prismaClient from "../prisma";

// validade do link de redefinição de senha (30 minutos)
const PRAZO_TOKEN_REDEFINICAO = "30m";

// identifica o token como de redefinição de senha (e não de login)
const FINALIDADE_REDEFINICAO = "redefinir_senha";

type TipoUsuario = "professor" | "aluno";

interface PayloadRedefinicao {
    tipo: TipoUsuario;
    finalidade: string;
    sub: string;
}

interface UsuarioToken {
    tipo: TipoUsuario;
    id: number;
    senha: string;
}

// o segredo junta o JWT_SECRET com o hash atual da senha: quando a senha muda,
// o hash muda e todo link gerado antes deixa de valer sozinho (uso único, sem coluna nova no banco)
function segredoRedefinicao(senhaHash: string) {
    return `${process.env.JWT_SECRET}${senhaHash}`;
}

// gera o token do link (JWT de 30 minutos com o tipo e o id do usuário)
function gerarTokenRedefinicao({ tipo, id, senha }: UsuarioToken) {
    return sign(
        { tipo, finalidade: FINALIDADE_REDEFINICAO },
        segredoRedefinicao(senha),
        { subject: String(id), expiresIn: PRAZO_TOKEN_REDEFINICAO }
    );
}

// valida o token e devolve o usuário dono dele, ou null se o token for inválido,
// expirado, já usado (a senha mudou) ou de outra finalidade
async function validarTokenRedefinicao(token: string): Promise<UsuarioToken | null> {
    // primeiro só lê o corpo (sem conferir a assinatura) para saber de quem é o token
    const corpo = decode(token);

    if (!corpo || typeof corpo === "string") return null;

    const { tipo, finalidade, sub } = corpo as PayloadRedefinicao;
    const id = Number(sub);

    if (finalidade !== FINALIDADE_REDEFINICAO || !Number.isInteger(id) || id <= 0) return null;

    let senha: string | undefined;

    if (tipo === "professor") {
        const professor = await prismaClient.professor.findUnique({
            where: { id_professor: id },
            select: { senha: true }
        });
        senha = professor?.senha;
    } else if (tipo === "aluno") {
        const aluno = await prismaClient.aluno.findUnique({
            where: { id_aluno: id },
            select: { senha: true }
        });
        senha = aluno?.senha;
    }

    if (!senha) return null;

    // agora sim confere a assinatura e a validade com o hash atual da senha
    try {
        verify(token, segredoRedefinicao(senha));
    } catch {
        return null;
    }

    return { tipo, id, senha };
}

export { gerarTokenRedefinicao, validarTokenRedefinicao };
export type { TipoUsuario };
