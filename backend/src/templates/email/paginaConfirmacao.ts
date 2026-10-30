import fs from "fs";
import path from "path";
import { COR_BORDA, COR_CINZA_CLARO, COR_TEXTO, COR_TEXTO_SECUNDARIO, COR_VERMELHO, FONTE, PASTA_ASSETS, escaparHtml } from "./layoutEmail";

// A página abre direto do back-end (link do e-mail), sem servidor de arquivos:
// o mascote vai dentro do HTML (data URI). Lido uma vez e guardado
const cacheImagens = new Map<string, string>();

function imagemBase64(arquivo: string) {
    if (!cacheImagens.has(arquivo)) {
        const conteudo = fs.readFileSync(path.join(PASTA_ASSETS, arquivo)).toString("base64");
        cacheImagens.set(arquivo, `data:image/png;base64,${conteudo}`);
    }

    return cacheImagens.get(arquivo)!;
}

// Página da confirmação de e-mail (GET /confirmacao-email/:token) com o visual do Protutal.
// sucesso = e-mail confirmado (mascote comemorando); senão, link inválido ou expirado (mascote com o X).
// A mensagem é fixa (vem do service), sem dado digitado pelo usuário
function paginaConfirmacao(mensagem: string, sucesso: boolean) {
    const frontUrl = (process.env.FRONT_URL || "").replace(/\/+$/, "");
    const titulo = sucesso ? "E-mail confirmado" : "Link inválido";
    const mascote = imagemBase64(sucesso ? "mascote_protutal_goodRequest.png" : "mascote_protutal_badRequest.png");

    // sem FRONT_URL no .env não dá para montar o link do login: o botão não aparece
    const botaoLogin = frontUrl
        ? `<a href="${escaparHtml(frontUrl)}/" style="display:inline-block; padding:12px 24px; border-radius:6px; background-color:${COR_VERMELHO}; color:#FFFFFF; font-weight:bold; text-decoration:none;">Ir para o login</a>`
        : "";

    // O reenvio (O4) precisa do e-mail digitado: ele fica no login, que mostra
    // o botão "Reenviar e-mail de confirmação" quando o e-mail ainda não foi confirmado
    const dicaReenvio = sucesso
        ? ""
        : `<p style="margin:16px 0 0; font-size:14px; line-height:1.5; color:${COR_TEXTO_SECUNDARIO};">Precisa de um novo link? Entre com seu e-mail e senha: o login mostra o botão <strong>Reenviar e-mail de confirmação</strong>.</p>`;

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${titulo} - Protutal</title>
</head>
<body style="margin:0; font-family:${FONTE}; background-color:${COR_CINZA_CLARO}; color:${COR_TEXTO};">
    <header style="padding:20px 16px; background:linear-gradient(90deg, #E30A0A 0%, ${COR_VERMELHO} 45%, #6E2427 100%); text-align:center;">
        <span style="color:#FFFFFF; font-size:28px; font-weight:bold; letter-spacing:2px;">PROTUTAL</span>
    </header>
    <main style="max-width:560px; margin:32px auto; padding:0 16px;">
        <div style="padding:32px 24px; border:1px solid ${COR_BORDA}; border-radius:16px; background-color:#FFFFFF; text-align:center;">
            <img src="${mascote}" alt="" width="200" height="200" style="width:200px; max-width:60%; height:auto;">
            <h1 style="margin:16px 0 8px; font-size:24px; color:${COR_VERMELHO};">${titulo}</h1>
            <p style="margin:0 0 24px; font-size:16px; line-height:1.5;">${escaparHtml(mensagem)}</p>
            ${botaoLogin}
            ${dicaReenvio}
        </div>
    </main>
</body>
</html>`;
}

export { paginaConfirmacao };
