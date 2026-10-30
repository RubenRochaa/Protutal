"use client"

import styles from './styles.module.scss'
import { TutorSala } from '@/lib/types'
import { useAcao } from '@/lib/useAcao'
import { Loader } from '@/components/loader'
import { handlePermissaoAtividades } from '@/app/professor/actions'

interface Props {
    idSala: number;
    // Tutores ativos (P24): o estado do interruptor sai do pode_criar_ativ deles
    tutores: TutorSala[];
}

// Interruptor "Tutores podem criar atividades" no topo da sala (Figma p07, decisão D4).
// A P29 liga ou desliga de uma vez para TODOS os tutores ativos da sala.
export function PermissaoAtividades({ idSala, tutores }: Props){
    const { pendente, executar } = useAcao();

    const semTutores = tutores.length === 0
    const todos = !semTutores && tutores.every((tutor) => tutor.pode_criar_ativ)
    const alguns = !todos && tutores.some((tutor) => tutor.pode_criar_ativ)

    // Ligado = todos podem. Misturado ou desligado: o clique concede para todos
    function handleClick(){
        executar(() => handlePermissaoAtividades(idSala, !todos));
    }

    let explicacao = todos ? "Todos os tutores da sala podem criar atividades." : "Os tutores da sala não podem criar atividades."
    if(alguns) explicacao = "Alguns tutores têm permissão. Ligue para conceder a todos."
    if(semTutores) explicacao = "A sala ainda não tem tutores ativos."

    return (
        <div className={styles.permissao}>
            <button
            type="button"
            role="switch"
            aria-checked={todos}
            aria-describedby="permissao-explicacao"
            className={todos ? `${styles.interruptor} ${styles.ligado}` : styles.interruptor}
            onClick={handleClick}
            disabled={pendente || semTutores}
            >
                <span className={styles.trilho} aria-hidden="true">
                    <span className={styles.bolinha} />
                </span>
                <span className={styles.rotulo}>Tutores podem criar atividades</span>
            </button>

            <span id="permissao-explicacao" className={styles.explicacao}>
                {pendente && <Loader size="pequeno" decorativo />}
                {pendente ? "Salvando..." : explicacao}
            </span>
        </div>
    )
}
