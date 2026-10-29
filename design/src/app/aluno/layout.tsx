import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { getNomeServer, getPerfilServer } from '@/lib/cookieServer'
import { getAutenticado } from '@/lib/apiServer'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'

// Menu do aluno, na ordem do Figma. Os itens com "emBreve" ainda não têm tela
const LINKS = [
    { label: "Início", href: "/aluno" },
    { label: "Minhas atividades", href: "/aluno/atividades" },
    { label: "Meu desempenho", href: "/aluno/desempenho", emBreve: true },
    { label: "Tutoria", href: "/aluno/tutoria", emBreve: true },
]

// Aparece só para quem é tutor (rota T1 respondeu 200)
const LINK_TUTOR = { label: "Área do tutor", href: "/tutor", emBreve: true }

// Moldura de todas as telas do aluno: Header em cima e a página embaixo.
// O middleware já barra quem não é aluno; conferimos de novo aqui por segurança.
export default async function AlunoLayout({ children }: { children: React.ReactNode }){
    const perfil = await getPerfilServer()

    if(perfil !== "aluno") redirect(perfil ? `/${perfil}` : "/")

    // Tutor é aluno com vínculo ativo: a rota T1 só responde 200 para ele.
    // 403 (não é tutor), 500 ou sem conexão: o item fica escondido, sem toast
    // (os cards da página já avisam quando a API está fora)
    const tutorias = await getAutenticado("/tutores/me/tutorias")

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in tutorias) sessaoExpiradaNaPagina(tutorias.erro)

    const ehTutor = "dados" in tutorias
    const nome = await getNomeServer()

    return (
        <>
            <Header links={ehTutor ? [...LINKS, LINK_TUTOR] : LINKS} nome={nome} />
            {children}
        </>
    )
}
