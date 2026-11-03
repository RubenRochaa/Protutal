import styles from './page.module.scss'
import pagina from '../page.module.scss'
import lista from '@/app/professor/lista.module.scss'
import Link from 'next/link'
import { getAutenticado } from '@/lib/apiServer'
import { getErrorMessage, getErrorStatus } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { anoAtual } from '@/lib/formatacao'
import { Sala } from '@/lib/types'
import { PageBanner } from '@/components/pageBanner'
import { Card } from '@/components/card'
import { ListItem } from '@/components/listItem'
import { ErroCarregamento } from '../components/erroCarregamento'

const SERIES = [3, 2, 1]

// Menu "Tutoria" (Figma p15, "Anos de Tutoria"), decisão D7.
// P20 (GET /salas): as salas do ano atual ficam nos cartões de 3ª, 2ª e 1ª série,
// e cada sala leva para a aba Tutorias. O quarto cartão leva ao histórico (p21).
export default async function TutoriaPage(){
    const resultado = await getAutenticado<Sala[]>("/salas")

    // Fora do try/catch: o redirect do Next funciona lançando um erro
    if("erro" in resultado) sessaoExpiradaNaPagina(resultado.erro)

    const ano = anoAtual()

    return (
        <main>
            <PageBanner titulo="Anos de Tutoria" />

            <div className={pagina.conteudo}>
                {"erro" in resultado ? (
                    <ErroCarregamento mensagem={getErrorMessage(resultado.erro)} status={getErrorStatus(resultado.erro)} />
                ) : (
                    <div className={styles.grade}>
                        {SERIES.map((serie) => {
                            const salas = resultado.dados.filter((s) => s.serie === serie && s.ano_letivo === ano)

                            return (
                                <Card key={serie} className={styles.cartao}>
                                    <div className={styles.linha}>
                                        <span className={styles.serie}>{serie}º</span>

                                        <ul className={`${lista.lista} ${styles.itens}`}>
                                            {salas.length === 0 ? (
                                                <li><ListItem><span className={lista.detalhe}>Nenhuma sala da {serie}ª série em {ano}</span></ListItem></li>
                                            ) : salas.map((sala) => (
                                                <li key={sala.id_sala}>
                                                    <Link href={`/professor/salas/${sala.id_sala}/tutorias`} className={lista.link}>
                                                        <ListItem>
                                                            <span className={lista.nome}>Ver tutores e tutorados</span>
                                                            <span className={lista.detalhe}>{sala.nome}</span>
                                                        </ListItem>
                                                    </Link>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </Card>
                            )
                        })}

                        <Card className={styles.cartao}>
                            <Link href="/professor/tutoria/historico" className={lista.link}>
                                <ListItem><span className={lista.nome}>Histórico dos anos anteriores</span></ListItem>
                            </Link>
                        </Card>
                    </div>
                )}
            </div>
        </main>
    )
}
