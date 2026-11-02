// Menus do Header, usados pelos layouts das áreas e pela página /ajuda.
// Ficam aqui porque um layout.tsx do Next só pode exportar o componente padrão

export interface LinkMenu {
    label: string;
    href: string;
    // Tela ainda não feita: o item aparece desabilitado, com o selo "Em breve"
    emBreve?: boolean;
    // Item mostrado só como ícone, ao lado do avatar (o label vira o nome acessível).
    // É um texto, e não o componente do ícone, porque o layout (servidor) não pode passar função ao Header
    icone?: "notificacao";
}

// Menu do professor, na ordem do Figma (p13), mais "Notificações"
// (pedidos e contestações pendentes de todas as salas). "Sair" fica no próprio Header.
// "Início" não entra no menu: a logo do Header já leva para a página inicial
export const MENU_PROFESSOR: LinkMenu[] = [
    { label: "Salas", href: "/professor#salas" },
    { label: "Tutoria", href: "/professor/tutoria" },
    { label: "Desempenho", href: "/professor/desempenho" },
    { label: "Notificações", href: "/professor/notificacoes", icone: "notificacao" },
]

// Menu do aluno, na ordem do Figma (sem "Início": a logo leva para lá)
export const MENU_ALUNO: LinkMenu[] = [
    { label: "Minhas atividades", href: "/aluno/atividades" },
    { label: "Meu desempenho", href: "/aluno/desempenho" },
    { label: "Tutoria", href: "/aluno/tutoria" },
]

// Aparece no menu do aluno só para quem é tutor (rota T1 respondeu 200)
export const LINK_TUTOR: LinkMenu = { label: "Área do tutor", href: "/tutor" }
