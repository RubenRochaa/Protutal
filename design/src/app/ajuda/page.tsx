import styles from './page.module.scss'
import { redirect } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { Card } from '@/components/card'
import { PageBanner } from '@/components/pageBanner'
import { getPerfilServer } from '@/lib/cookieServer'
import { SECOES_FAQ, SECOES_POR_PERFIL } from './faqData'

// Página de Ajuda/FAQ, aberta para qualquer perfil logado.
// Cada pergunta é um <details>: começa fechada e abre com clique, Enter ou Espaço,
// sem JavaScript no navegador
export default async function AjudaPage(){
    const perfil = await getPerfilServer()

    if(!perfil) redirect("/")

    const secoes = SECOES_FAQ.filter((secao) => SECOES_POR_PERFIL[perfil].includes(secao.id))

    return (
        <main>
            <PageBanner titulo="Ajuda" />

            <div className={styles.conteudo}>
                {secoes.map((secao) => (
                    <Card key={secao.id} titulo={secao.titulo} sublinhado>
                        <div className={styles.lista}>
                            {secao.perguntas.map((item) => (
                                <details key={item.pergunta} className={styles.item}>
                                    <summary className={styles.pergunta}>
                                        <span>{item.pergunta}</span>
                                        <ChevronDown className={styles.seta} size={20} aria-hidden="true" />
                                    </summary>
                                    <p className={styles.resposta}>{item.resposta}</p>
                                </details>
                            ))}
                        </div>
                    </Card>
                ))}
            </div>
        </main>
    )
}
