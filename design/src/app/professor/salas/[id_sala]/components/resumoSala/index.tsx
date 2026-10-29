import styles from './styles.module.scss'
import Link from 'next/link'
import { SalaDetalhe } from '@/lib/types'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'

interface Props {
    sala: SalaDetalhe;
}

// Aba "Resumo": dados da P1 e, no layout do Figma, os espaços de alunos e tutores.
// As listas ficam nas próprias abas (P23 em "Alunos"; P24 em "Tutores").
// Aqui só há links, para não repetir as chamadas à API.
export function ResumoSala({ sala }: Props){
    const base = `/professor/salas/${sala.id_sala}`
    const abaAlunos = `${base}/alunos`

    return (
        <div className={styles.resumo}>
            <Card titulo="Dados da sala">
                <dl className={styles.dados}>
                    <div className={styles.dado}>
                        <dt>Nome</dt>
                        <dd>{sala.nome}</dd>
                    </div>
                    <div className={styles.dado}>
                        <dt>Série</dt>
                        <dd>{sala.serie}ª série</dd>
                    </div>
                    <div className={styles.dado}>
                        <dt>Ano letivo</dt>
                        <dd>{sala.ano_letivo}</dd>
                    </div>
                    <div className={styles.dado}>
                        <dt>Professor responsável</dt>
                        <dd>{sala.professor.nome}</dd>
                    </div>
                </dl>
            </Card>

            <div className={styles.grade}>
                <Card titulo="Alunos" sublinhado>
                    <EmptyState
                    mensagem="Veja os alunos matriculados e matricule novos alunos na aba Alunos."
                    acao={<Link href={abaAlunos} className={styles.link}>Ir para Alunos</Link>}
                    />
                </Card>

                <Card titulo="Tutores" sublinhado>
                    <EmptyState
                    mensagem="Veja os tutores, avalie ou remova na aba Tutores."
                    acao={<Link href={`${base}/tutores`} className={styles.link}>Ir para Tutores</Link>}
                    />
                </Card>
            </div>

            <div className={styles.botoes}>
                <Link href={`${base}/atividades`} className={styles.botaoAtivo}>
                    Ver atividades
                </Link>

                <Link href={abaAlunos} className={styles.botaoAtivo}>
                    Adicionar alunos
                </Link>
            </div>
        </div>
    )
}
