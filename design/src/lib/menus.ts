// Menus do Header, usados pelos layouts das áreas e pela página /ajuda.
// Ficam aqui porque um layout.tsx do Next só pode exportar o componente padrão

export interface LinkMenu {
    label: string;
    href: string;
    // Tela ainda não feita: o item aparece desabilitado, com o selo "Em breve"
    emBreve?: boolean;
}

// Menu do professor, na ordem do Figma (p13), mais "Notificações"
// (pedidos e contestações pendentes de todas as salas). "Sair" fica no próprio Header.
export const MENU_PROFESSOR: LinkMenu[] = [
    { label: "Início", href: "/professor" },
    { label: "Salas", href: "/professor#salas" },
    { label: "Tutoria", href: "/professor/tutoria" },
    { label: "Desempenho", href: "/professor/desempenho" },
    { label: "Notificações", href: "/professor/notificacoes" },
]

// Menu do aluno, na ordem do Figma
export const MENU_ALUNO: LinkMenu[] = [
    { label: "Início", href: "/aluno" },
    { label: "Minhas atividades", href: "/aluno/atividades" },
    { label: "Meu desempenho", href: "/aluno/desempenho" },
    { label: "Tutoria", href: "/aluno/tutoria" },
]

// Aparece no menu do aluno só para quem é tutor (rota T1 respondeu 200)
export const LINK_TUTOR: LinkMenu = { label: "Área do tutor", href: "/tutor" }
