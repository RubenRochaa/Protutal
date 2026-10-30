// Imagens do mascote do Protutal (pasta public/img). Todas têm 500 x 500 px:
// o next/image recebe esse tamanho real e o CSS de cada componente define a altura na tela.
export const TAMANHO_MASCOTE_PX = 500

export interface ImagemMascote {
    src: string;
    // "" quando o texto ao lado já explica a situação (imagem decorativa)
    alt: string;
}

export const MASCOTES = {
    telaInicial: { src: "/img/mascote_protutal_telaInicial.png", alt: "Mascote do Protutal acenando" },
    areasVazias: { src: "/img/mascote_protutal_areasVazias.png", alt: "" },
    atividades: { src: "/img/mascote_protutal_atividades.png", alt: "" },
    desempenho: { src: "/img/mascote_protutal_desempenho.png", alt: "" },
    badRequest: { src: "/img/mascote_protutal_badRequest.png", alt: "" },
    goodRequest: { src: "/img/mascote_protutal_goodRequest.png", alt: "" },
    email: { src: "/img/mascote_protutal_email.png", alt: "" },
} satisfies Record<string, ImagemMascote>
