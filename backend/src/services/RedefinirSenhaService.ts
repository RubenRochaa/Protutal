import prismaClient from "../prisma";
import { hash } from "bcryptjs";
import { AppError } from "../errors/AppError";
import { validarTokenRedefinicao } from "../helpers/tokenRedefinicaoSenha";

// mesma mensagem para token adulterado, expirado ou já usado: não revela detalhes internos
const MENSAGEM_TOKEN_INVALIDO = "Link de redefinição inválido ou expirado. Peça um novo link.";

interface RedefinirSenhaRequest {
    token: string;
    senha: string;
}

// O6: troca a senha do professor ou aluno dono do token enviado pelo O5.
// ordem: campos (400) -> token inválido, expirado ou já usado (400) -> grava o hash da nova senha
class RedefinirSenhaService {
    async execute({ token, senha }: RedefinirSenhaRequest) {

        // mesma regra do cadastro: a senha só precisa ser texto não vazio
        if (typeof token !== "string" || token.trim() === "" || typeof senha !== "string" || senha === "") {
            throw new AppError("Token e senha são obrigatórios", 400);
        }

        const usuario = await validarTokenRedefinicao(token);

        if (!usuario) {
            throw new AppError(MENSAGEM_TOKEN_INVALIDO, 400);
        }

        // RNF3: senha com hash (bcryptjs), como no cadastro. O hash novo é diferente do antigo
        // (o bcrypt usa um salt novo a cada vez), então o link usado deixa de valer
        const senhaHash = await hash(senha, 8);

        if (usuario.tipo === "professor") {
            await prismaClient.professor.update({
                where: { id_professor: usuario.id },
                data: { senha: senhaHash },
                select: { id_professor: true }
            });
        } else {
            await prismaClient.aluno.update({
                where: { id_aluno: usuario.id },
                data: { senha: senhaHash },
                select: { id_aluno: true }
            });
        }

        return { mensagem: "Senha redefinida! Você já pode entrar no Protutal." };
    }
}

export { RedefinirSenhaService };
