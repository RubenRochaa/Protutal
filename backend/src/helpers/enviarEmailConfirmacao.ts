import mailConfig from "../config/mail";
import crypto from "crypto";

// RN20: prazo de validade do link de confirmação (1 hora), único para os cadastros de professor e aluno
const PRAZO_TOKEN_CONFIRMACAO_MS = 60 * 60 * 1000;

// gera o token aleatório do link e a expiração (agora + PRAZO_TOKEN_CONFIRMACAO_MS);
// usado nos cadastros e no reenvio do link
function gerarTokenConfirmacao() {
    const token = crypto.randomBytes(32).toString("hex");
    const expiracao = new Date(Date.now() + PRAZO_TOKEN_CONFIRMACAO_MS);

    return { token, expiracao };
}

interface EmailConfirmacaoRequest {
    nome: string;
    email: string;
    token: string;
}

// envia o e-mail com o link de confirmação. Não trata o erro de envio:
// quem chama (os services de cadastro) decide o que fazer se falhar
async function enviarEmailConfirmacao({ nome, email, token }: EmailConfirmacaoRequest) {
    // tira a barra do fim do APP_URL, se houver, para o link não ficar com "//"
    const appUrl = (process.env.APP_URL || "").replace(/\/+$/, "");
    const link = `${appUrl}/confirmacao-email/${token}`;

    // o nome vem do cadastro (digitado pelo usuário): escapa os caracteres especiais
    // para ninguém conseguir injetar HTML no corpo do e-mail
    const nomeSeguro = nome
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    await mailConfig.transporte().sendMail({
        from: `"Protutal" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Confirme seu e-mail no Protutal",
        html: `
            <p>Olá, ${nomeSeguro}!</p>
            <p>Para concluir seu cadastro no Protutal, confirme seu e-mail clicando no link abaixo:</p>
            <p><a href="${link}">${link}</a></p>
            <p>Este link vale por 1 hora.</p>
        `
    });
}

export { enviarEmailConfirmacao, gerarTokenConfirmacao, PRAZO_TOKEN_CONFIRMACAO_MS };
