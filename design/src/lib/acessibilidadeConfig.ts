// Configuração dos recursos de acessibilidade (RNF13 fonte, RNF14 tema escuro, RNF15 modo daltônico).
// Fica num arquivo sem "use client" porque o layout raiz (servidor) usa o SCRIPT_ACESSIBILIDADE.

// Chave do localStorage: vale para o navegador, com ou sem login
export const CHAVE_ACESSIBILIDADE = "protutal-acessibilidade"

// Níveis de fonte aplicados no font-size do <html> (o site usa rem). Índice 1 = padrão (100%)
export const NIVEIS_FONTE = [90, 100, 115, 130, 150] as const
export const NIVEL_FONTE_PADRAO = 1

export type Tema = "claro" | "escuro"

export interface PreferenciasAcessibilidade {
    nivelFonte: number;
    tema: Tema;
    daltonico: boolean;
}

export const PREFERENCIAS_PADRAO: PreferenciasAcessibilidade = {
    nivelFonte: NIVEL_FONTE_PADRAO,
    tema: "claro",
    daltonico: false,
}

// Script que roda no <head>, antes da página aparecer: lê o localStorage e grava os atributos
// data-tema, data-daltonico e data-fonte no <html>. Assim a página já abre com o tema certo (sem piscar).
// Com o localStorage bloqueado (janela privada, site sem permissão), o try/catch deixa o padrão.
export const SCRIPT_ACESSIBILIDADE = `(function(){
  try {
    var salvo = JSON.parse(localStorage.getItem(${JSON.stringify(CHAVE_ACESSIBILIDADE)}) || "{}");
    var niveis = ${JSON.stringify(NIVEIS_FONTE)};
    var html = document.documentElement;
    if (salvo.tema === "escuro") html.setAttribute("data-tema", "escuro");
    if (salvo.daltonico === true) html.setAttribute("data-daltonico", "true");
    if (typeof salvo.nivelFonte === "number" && niveis[salvo.nivelFonte] && salvo.nivelFonte !== ${NIVEL_FONTE_PADRAO}) {
      html.setAttribute("data-fonte", String(niveis[salvo.nivelFonte]));
    }
  } catch (e) {}
})();`
