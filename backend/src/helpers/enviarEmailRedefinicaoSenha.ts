import mailConfig from "../config/mail";

interface EmailRedefinicaoRequest {
    nome: string;
    email: string;
    token: string;
}

// envia o e-mail com o link de redefinição de senha, que abre a página do front
// (FRONT_URL/redefinir-senha?token=...). Não trata o erro de envio: quem chama decide
async function enviarEmailRedefinicaoSenha({ nome, email, token }: EmailRedefinicaoRequest) {
    // tira a barra do fim do FRONT_URL, se houver, para o link não ficar com "//"
    const frontUrl = (process.env.FRONT_URL || "").replace(/\/+$/, "");
    const link = `${frontUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;

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
        subject: "Redefinição de senha no Protutal",
        html: `
            <p>Olá, ${nomeSeguro}!</p>
            <p>Recebemos um pedido para redefinir a sua senha no Protutal. Para criar uma nova senha, clique no link abaixo:</p>
            <p><a href="${link}">${link}</a></p>
            <p>Este link vale por 30 minutos e só pode ser usado uma vez.</p>
            <p>Se você não pediu a redefinição, ignore este e-mail: a sua senha continua a mesma.</p>
        `
    });
}

export { enviarEmailRedefinicaoSenha };
