"use client"

import styles from './styles.module.scss'
import { useEffect, useId, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Accessibility } from 'lucide-react'
import { useAcessibilidade } from '@/lib/acessibilidade'
import { NIVEIS_FONTE, NIVEL_FONTE_PADRAO } from '@/lib/acessibilidadeConfig'

export const ROTULO_ACESSIBILIDADE = "Acessibilidade"
export { Accessibility as IconeAcessibilidade }

interface PropsPainel {
    id: string;
    aberto: boolean;
    onFechar: () => void;
    // Botões que abrem o painel: clicar neles não conta como "clique fora",
    // e o foco volta para o primeiro visível ao fechar com Esc
    gatilhos: React.RefObject<HTMLElement | null>[];
    className?: string;
}

// Interruptor liga/desliga (role="switch"): o texto fica visível e o estado vai no aria-checked
function Interruptor({ rotulo, ligado, onAlternar }: { rotulo: string; ligado: boolean; onAlternar: () => void }){
    return (
        <button
        type="button"
        role="switch"
        aria-checked={ligado}
        className={styles.interruptor}
        onClick={onAlternar}
        >
            <span>{rotulo}</span>
            <span className={ligado ? `${styles.trilho} ${styles.trilhoLigado}` : styles.trilho} aria-hidden="true">
                <span className={styles.bolinha} />
            </span>
        </button>
    )
}

// Painel com os controles: A- / A+ / Restaurar, tema escuro e modo daltônico.
// Fecha ao clicar fora, com Esc e ao trocar de página. Quem usa controla o estado "aberto"
export function PainelAcessibilidade({ id, aberto, onFechar, gatilhos, className }: PropsPainel){
    const painelRef = useRef<HTMLDivElement>(null)
    const tituloId = useId()
    const pathname = usePathname()
    const {
        nivelFonte, tema, daltonico,
        aumentarFonte, diminuirFonte, restaurarFonte, alternarTema, alternarDaltonico,
    } = useAcessibilidade()

    // onFechar muda a cada render de quem usa: guardado em ref para não refazer os efeitos
    const fecharRef = useRef(onFechar)
    useEffect(() => { fecharRef.current = onFechar })

    // Trocou de página: fecha
    useEffect(() => {
        fecharRef.current()
    }, [pathname])

    useEffect(() => {
        if(!aberto) return

        // Ao abrir, o foco vai para o primeiro controle habilitado
        painelRef.current?.querySelector<HTMLElement>("button:not(:disabled)")?.focus()

        function dentro(alvo: Node){
            if(painelRef.current?.contains(alvo)) return true
            return gatilhos.some((ref) => ref.current?.contains(alvo))
        }

        function handleClique(e: MouseEvent | TouchEvent){
            if(!dentro(e.target as Node)) fecharRef.current()
        }

        function handleTecla(e: KeyboardEvent){
            if(e.key !== "Escape") return
            fecharRef.current()
            // Foco volta para o botão que abriu (o que estiver visível na tela)
            const gatilho = gatilhos.map((ref) => ref.current).find((el) => el && el.offsetParent !== null)
            gatilho?.focus()
        }

        document.addEventListener("mousedown", handleClique)
        document.addEventListener("touchstart", handleClique)
        document.addEventListener("keydown", handleTecla)

        return () => {
            document.removeEventListener("mousedown", handleClique)
            document.removeEventListener("touchstart", handleClique)
            document.removeEventListener("keydown", handleTecla)
        }
    }, [aberto, gatilhos])

    if(!aberto) return null

    const menor = nivelFonte === 0
    const maior = nivelFonte === NIVEIS_FONTE.length - 1

    return (
        <div
        id={id}
        ref={painelRef}
        role="dialog"
        aria-labelledby={tituloId}
        className={className ? `${styles.painel} ${className}` : styles.painel}
        >
            <h2 id={tituloId} className={styles.titulo}>{ROTULO_ACESSIBILIDADE}</h2>

            <div className={styles.grupo} role="group" aria-label="Tamanho da fonte">
                <span className={styles.rotulo}>Tamanho da fonte</span>

                <div className={styles.fonte}>
                    <button
                    type="button"
                    className={styles.botaoFonte}
                    onClick={diminuirFonte}
                    disabled={menor}
                    aria-label="Diminuir fonte (A-)"
                    >
                        A-
                    </button>

                    <span className={styles.nivel} aria-live="polite">{NIVEIS_FONTE[nivelFonte]}%</span>

                    <button
                    type="button"
                    className={styles.botaoFonte}
                    onClick={aumentarFonte}
                    disabled={maior}
                    aria-label="Aumentar fonte (A+)"
                    >
                        A+
                    </button>
                </div>

                <button
                type="button"
                className={styles.restaurar}
                onClick={restaurarFonte}
                disabled={nivelFonte === NIVEL_FONTE_PADRAO}
                >
                    Restaurar padrão
                </button>
            </div>

            <div className={styles.grupo}>
                <Interruptor rotulo="Tema escuro" ligado={tema === "escuro"} onAlternar={alternarTema} />
                <Interruptor rotulo="Modo daltônico" ligado={daltonico} onAlternar={alternarDaltonico} />
            </div>
        </div>
    )
}

// Botão redondo "Acessibilidade" das telas públicas (login, cadastro, senha, Ajuda sem login, 404):
// fica no canto superior direito da página e abre o painel logo abaixo
export function BotaoAcessibilidade(){
    const [aberto, setAberto] = useState(false)
    const botaoRef = useRef<HTMLButtonElement>(null)
    const painelId = useId()
    const [gatilhos] = useState(() => [botaoRef])

    return (
        <div className={styles.flutuante}>
            <button
            ref={botaoRef}
            type="button"
            className={styles.botaoRedondo}
            onClick={() => setAberto(!aberto)}
            aria-expanded={aberto}
            aria-controls={painelId}
            aria-label={ROTULO_ACESSIBILIDADE}
            title={ROTULO_ACESSIBILIDADE}
            >
                <Accessibility aria-hidden="true" />
            </button>

            <PainelAcessibilidade
            id={painelId}
            aberto={aberto}
            onFechar={() => setAberto(false)}
            gatilhos={gatilhos}
            className={styles.painelFlutuante}
            />
        </div>
    )
}
