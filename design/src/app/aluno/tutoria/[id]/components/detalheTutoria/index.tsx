import styles from './styles.module.scss'
import Link from 'next/link'
import { Suspense } from 'react'
import { MessageCircle, Star } from 'lucide-react'
import { Card } from '@/components/card'
import { Loading } from '@/components/loading'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarData } from '@/lib/formatacao'
import { ToastErro } from '../../../../components/toastErro'
import { AvatarIniciais } from '../../../../components/avatarIniciais'
import { SeloStatus } from '../../../../components/seloStatus'
import { TutoriaNaoEncontrada } from '../../../components/tutoriaNaoEncontrada'
import { buscarTutoria } from '../../../buscarTutoria'
import { Materiais, TITULO_MATERIAIS } from '../materiais'
import { Avisos, TITULO_AVISOS } from '../avisos'
import { ConteudosAprendidos, TITULO_CONTEUDOS } from '../conteudosAprendidos'
import { UltimaCorrecao, TITULO_CORRECAO } from '../ultimaCorrecao'

interface Props {
    // Vem da URL sem tratar: se não bater com nenhuma tutoria da A3, mostra "não encontrada"
    id: string;
}

// Detalhe da tutoria: acha a tutoria na A3 e, com a sala dela, monta os blocos do print.
// Cada bloco busca a própria rota no seu Suspense: se um falhar, os outros continuam
export async function DetalheTutoria({ id }: Props){
    const resultado = await buscarTutoria(id)

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <ToastErro mensagem={getErrorMessage(resultado.erro)} />
    }

    const { tutoria } = resultado

    if(!tutoria) return <TutoriaNaoEncontrada />

    const ativa = tutoria.status === "ativa"
    const idSala = tutoria.sala.id_sala

    return (
        <>
            <div className={styles.topo}>
                <div className={styles.dados}>
                    <dl className={styles.dados}>
                        <div className={styles.dado}>
                            <dt>Data de início:</dt>
                            <dd>{formatarData(tutoria.data_inicio)}</dd>
                        </div>

                        {!ativa && tutoria.data_fim && (
                            <div className={styles.dado}>
                                <dt>Data de fim:</dt>
                                <dd>{formatarData(tutoria.data_fim)}</dd>
                            </div>
                        )}

                        <div className={styles.dado}>
                            <dt>Sala:</dt>
                            <dd>{tutoria.sala.nome}</dd>
                        </div>
                    </dl>

                    <SeloStatus texto={ativa ? "Ativa" : "Finalizada"} cor={ativa ? "verde" : "cinza"} />
                </div>

                <p className={styles.meta}>
                    <span className={styles.rotulo}>Meta de aprendizagem: </span>
                    {tutoria.meta_aprendizagem}
                </p>
            </div>

            <div className={styles.grade}>
                <div className={styles.coluna}>
                    <Card titulo="Converse com o seu tutor" sublinhado>
                        <div className={styles.tutor}>
                            <AvatarIniciais nome={tutoria.tutor.nome} tamanho="grande" />
                            <p className={styles.nome}>{tutoria.tutor.nome}</p>

                            <Link href={`/aluno/tutoria/${tutoria.id_tutoria}/chat`} className={styles.botao}>
                                <MessageCircle size={18} aria-hidden="true" />
                                Abrir chat
                            </Link>
                        </div>
                    </Card>

                    <Suspense fallback={<Card titulo={TITULO_MATERIAIS} sublinhado><Loading /></Card>}>
                        <Materiais idSala={idSala} />
                    </Suspense>

                    <Suspense fallback={<Card titulo={TITULO_CONTEUDOS} sublinhado><Loading /></Card>}>
                        <ConteudosAprendidos idSala={idSala} />
                    </Suspense>
                </div>

                <div className={styles.coluna}>
                    <Suspense fallback={<Card titulo={TITULO_CORRECAO} sublinhado><Loading /></Card>}>
                        <UltimaCorrecao idSala={idSala} tutor={tutoria.tutor.nome} />
                    </Suspense>

                    <Suspense fallback={<Card titulo={TITULO_AVISOS} sublinhado><Loading /></Card>}>
                        <Avisos idSala={idSala} />
                    </Suspense>

                    {/* A A10 recusa feedback de tutoria finalizada (409): o botão só aparece na ativa */}
                    {ativa && (
                        <Link href={`/aluno/tutoria/${tutoria.id_tutoria}/feedback`} className={styles.botao}>
                            <Star size={18} aria-hidden="true" />
                            Avaliar meu tutor
                        </Link>
                    )}
                </div>
            </div>
        </>
    )
}
