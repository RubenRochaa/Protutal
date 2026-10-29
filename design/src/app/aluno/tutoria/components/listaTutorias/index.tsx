import styles from './styles.module.scss'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarData } from '@/lib/formatacao'
import { buscarTutorias } from '../../../buscas'
import { ToastErro } from '../../../components/toastErro'
import { AvatarIniciais } from '../../../components/avatarIniciais'
import { SeloStatus } from '../../../components/seloStatus'

export const TITULO_TUTORIAS = "Minhas tutorias"

// Lista das tutorias em que o aluno é o tutorado (rota A3), ativas e finalizadas.
// Cada card leva para o detalhe da tutoria
export async function ListaTutorias(){
    const resultado = await buscarTutorias()

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO_TUTORIAS} sublinhado><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    if(resultado.dados.length === 0){
        return (
            <Card titulo={TITULO_TUTORIAS} sublinhado>
                <EmptyState mensagem="Você ainda não está em uma tutoria. O tutor é definido pelo professor da sala." />
            </Card>
        )
    }

    // A A3 já manda as ativas primeiro; o sort (estável) só garante essa ordem
    const tutorias = [...resultado.dados].sort((a, b) => Number(b.status === "ativa") - Number(a.status === "ativa"))

    return (
        <Card titulo={TITULO_TUTORIAS} sublinhado>
            <ul className={styles.lista}>
                {tutorias.map((tutoria) => {
                    const ativa = tutoria.status === "ativa"

                    return (
                        <li key={tutoria.id_tutoria}>
                            <Link href={`/aluno/tutoria/${tutoria.id_tutoria}`} className={styles.item}>
                                <div className={styles.topo}>
                                    <AvatarIniciais nome={tutoria.tutor.nome} />

                                    <div className={styles.quem}>
                                        <p className={styles.tutor}>
                                            <span className={styles.rotulo}>Tutor: </span>
                                            {tutoria.tutor.nome}
                                        </p>
                                        <p className={styles.sala}>Sala {tutoria.sala.nome} ({tutoria.sala.serie}ª série)</p>
                                    </div>

                                    <SeloStatus texto={ativa ? "Ativa" : "Finalizada"} cor={ativa ? "verde" : "cinza"} />
                                </div>

                                <p className={styles.datas}>
                                    Início: {formatarData(tutoria.data_inicio)}
                                    {!ativa && tutoria.data_fim && <> · Fim: {formatarData(tutoria.data_fim)}</>}
                                </p>

                                <p className={styles.meta}>
                                    <span className={styles.rotulo}>Meta de aprendizagem: </span>
                                    {tutoria.meta_aprendizagem}
                                </p>

                                <span className={styles.abrir}>
                                    Ver tutoria
                                    <ChevronRight size={18} aria-hidden="true" />
                                </span>
                            </Link>
                        </li>
                    )
                })}
            </ul>
        </Card>
    )
}
