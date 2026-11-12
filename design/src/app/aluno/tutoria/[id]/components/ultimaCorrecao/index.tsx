import styles from './styles.module.scss'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'
import { getErrorMessage } from '@/lib/getErrorMessage'
import { sessaoExpiradaNaPagina } from '@/lib/sessaoExpirada'
import { formatarData, formatarNota } from '@/lib/formatacao'
import { buscarDesempenho } from '../../../../buscas'
import { ToastErro } from '../../../../components/toastErro'
import { AvatarIniciais } from '../../../../components/avatarIniciais'

// No Figma o título é "Descrição da atividade"; o conteúdo do card é a última correção
export const TITULO_CORRECAO = "Última correção do tutor"

interface Props {
    idSala: number;
    // A A6 não traz o tutor de cada nota: o nome vem da tutoria (A3)
    tutor: string;
}

// Card da direita do print: a nota mais recente do aluno na sala (rota A6 ?id_sala=, campo notas[])
export async function UltimaCorrecao({ idSala, tutor }: Props){
    const resultado = await buscarDesempenho("", String(idSala))

    if("erro" in resultado){
        // Fora do try/catch: o redirect do Next funciona lançando um erro
        sessaoExpiradaNaPagina(resultado.erro)

        return <Card titulo={TITULO_CORRECAO} sublinhado><ToastErro mensagem={getErrorMessage(resultado.erro)} /></Card>
    }

    // A A6 ordena por etapa; aqui vale a data de lançamento mais recente
    const ultima = resultado.dados.notas.reduce<typeof resultado.dados.notas[number] | null>(
        (maisRecente, nota) => !maisRecente || nota.data_lancamento > maisRecente.data_lancamento ? nota : maisRecente,
        null
    )

    if(!ultima){
        return <Card titulo={TITULO_CORRECAO} sublinhado><EmptyState mensagem="Nenhuma atividade corrigida ainda." /></Card>
    }

    return (
        <Card titulo={TITULO_CORRECAO} sublinhado>
            <div className={styles.quadro}>
                <div className={styles.tutor}>
                    <AvatarIniciais nome={tutor} tamanho="grande" />
                    <p className={styles.nome}>{tutor}</p>
                </div>

                <h3 className={styles.atividade}>{ultima.atividade.titulo}</h3>
                <p className={styles.data}>Corrigida em {formatarData(ultima.data_lancamento)}</p>

                {ultima.comentario && <p className={styles.comentario}>{ultima.comentario}</p>}

                <p className={styles.nota}>
                    <span className={styles.rotulo}>Nota:</span> {formatarNota(ultima.valor)}
                </p>

                <Link href={`/aluno/atividades/${ultima.atividade.id_atividade}`} className={styles.link}>
                    Ver atividade
                    <ChevronRight size={18} aria-hidden="true" />
                </Link>
            </div>
        </Card>
    )
}
