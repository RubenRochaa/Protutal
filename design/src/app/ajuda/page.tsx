import styles from './page.module.scss'
import Link from 'next/link'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { Card } from '@/components/card'
import { PageBanner } from '@/components/pageBanner'
import { getCookieServer, getPerfilServer } from '@/lib/cookieServer'
import { IdSecaoFaq, SECOES_FAQ, SECOES_POR_PERFIL } from './faqData'

// Página de Ajuda/FAQ, pública. Quem não está logado vê só a seção "Geral"
// (ex.: não recebeu o e-mail de confirmação, esqueceu a senha); quem está logado
// vê também as seções do próprio perfil.
// Cada pergunta é um <details>: começa fechada e abre com clique, Enter ou Espaço,
// sem JavaScript no navegador
export default async function AjudaPage(){
    const token = await getCookieServer()
    const perfil = await getPerfilServer()
    const logado = token !== null && perfil !== null

    const idsSecoes: IdSecaoFaq[] = logado ? SECOES_POR_PERFIL[perfil] : ["geral"]
    const secoes = SECOES_FAQ.filter((secao) => idsSecoes.includes(secao.id))

    return (
        <main>
            <PageBanner titulo="Ajuda" />

            <div className={styles.conteudo}>
                {!logado && (
                    <Link href="/" className={`${styles.voltar} link-texto`}>
                        <ArrowLeft size={20} aria-hidden="true" />
                        Voltar para o login
                    </Link>
                )}

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
