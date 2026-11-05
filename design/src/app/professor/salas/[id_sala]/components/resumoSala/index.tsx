import styles from './styles.module.scss'
import { SalaDetalhe } from '@/lib/types'
import { Card } from '@/components/card'
import { EmptyState } from '@/components/emptyState'

interface Props {
    sala: SalaDetalhe;
}

// Botões do Figma que dependem de telas dos próximos lotes:
// "Ver atividades" (P11, lote A5) e "Adicionar alunos" (P21 e P22, próxima tela)
const BOTOES_EM_BREVE = ["Ver atividades", "Adicionar alunos"]

// Aba "Resumo": dados da P1 e, no layout do Figma, os espaços de alunos e tutores.
// As listas têm rotas próprias (P23 e P24) e entram nos próximos lotes: por enquanto, "Em breve".
export function ResumoSala({ sala }: Props){
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
                    <EmptyState mensagem="Em breve: a lista de alunos matriculados aparecerá aqui." />
                </Card>

                <Card titulo="Tutores" sublinhado>
                    <EmptyState mensagem="Em breve: a lista de tutores da sala aparecerá aqui." />
                </Card>
            </div>

            <div className={styles.botoes}>
                {BOTOES_EM_BREVE.map((rotulo) => (
                    <button key={rotulo} type="button" className={styles.botao} disabled>
                        {rotulo}
                        <span className={styles.emBreve}>Em breve</span>
                    </button>
                ))}
            </div>
        </div>
    )
}
