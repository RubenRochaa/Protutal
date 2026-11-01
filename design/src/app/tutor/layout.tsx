import styles from './pagina.module.scss'
import { redirect } from 'next/navigation'
import { Header } from '@/components/header'
import { getNomeServer, getPerfilServer } from '@/lib/cookieServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { ErroCarregamento } from '../professor/components/erroCarregamento'
import { buscarTutorias } from './buscas'

// Menu do tutor (estrutura dos prints). "Área do aluno" volta para as telas de tutorado
const LINKS = [
    { label: "Início", href: "/tutor" },
    { label: "Atividades", href: "/tutor/atividades" },
    { label: "Tutoria", href: "/tutor/tutoria" },
    { label: "Contestações", href: "/tutor/contestacoes" },
    { label: "Feedbacks", href: "/tutor/feedbacks" },
    { label: "Desempenho", href: "/tutor/desempenho" },
    { label: "Área do aluno", href: "/aluno" },
]

// Moldura de todas as telas do tutor. Tutor não é perfil de login: ele entra como aluno,
// e a rota T1 diz se ele é tutor (200, mesmo com lista vazia) ou não (403).
export default async function TutorLayout({ children }: { children: React.ReactNode }){
    const perfil = await getPerfilServer()

    if(perfil !== "aluno") redirect(perfil ? `/${perfil}` : "/")

    // Mesma busca (cache) que a página "Tutoria" usa sem filtro
    const tutorias = await buscarTutorias("")

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in tutorias){
        sessaoExpiradaNaPagina(tutorias.erro)

        // 403 = não é tutor (ou o vínculo foi revogado): volta para a área do aluno
        if(getErrorStatus(tutorias.erro) === 403) redirect("/aluno")
    }

    const nome = await getNomeServer()

    return (
        <>
            <Header links={LINKS} nome={nome} />

            {"erro" in tutorias ? (
                // API fora ou erro 500: não dá para saber se é tutor, então a página não abre
                <main className={styles.conteudo}>
                    <ErroCarregamento mensagem={getErrorMessage(tutorias.erro)} status={getErrorStatus(tutorias.erro)} />
                </main>
            ) : children}
        </>
    )
}
