"use client"

import styles from './styles.module.scss'
import { useActionState, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Modal } from '@/components/modal'
import { Button } from '@/components/button'
import { handlePedirTutoria } from '../../actions'

interface Props {
    idSala: number;
    nomeSala: string;
}

interface BotaoProps extends Props {
    // ISO vindo da API (GET /alunos/me/salas): até quando o aluno espera depois de uma recusa
    liberadoEm?: string | null;
}

interface FormProps extends Props {
    onFechar: () => void;
}

// Quanto falta (em ms) para liberar, nunca negativo
function calcularRestante(liberadoEm: string | null | undefined): number {
    if(!liberadoEm) return 0

    return Math.max(0, new Date(liberadoEm).getTime() - Date.now())
}

// 5025000 ms -> "01:23:45"
function formatarTempo(ms: number): string {
    const totalSegundos = Math.ceil(ms / 1000)
    const horas = Math.floor(totalSegundos / 3600)
    const minutos = Math.floor((totalSegundos % 3600) / 60)
    const segundos = totalSegundos % 60

    return [horas, minutos, segundos].map((valor) => String(valor).padStart(2, "0")).join(":")
}

// Confirmação dentro do modal: um formulário só com o id da sala
function FormConfirmacao({ idSala, nomeSala, onFechar }: FormProps){
    const [estado, formAction] = useActionState(handlePedirTutoria, {});

    useEffect(() => {
        if(estado.error) toast.error(estado.error);

        if(estado.sucesso){
            toast.success(estado.sucesso);
            onFechar();
        }
    }, [estado, onFechar]);

    return (
        <form action={formAction} className={styles.form}>
            <input type="hidden" name="id_sala" value={idSala} />

            <p>
                Você vai pedir para ser tutor na sala <strong>{nomeSala}</strong>.
                O professor da sala vai analisar seu pedido.
            </p>

            <div className={styles.botoes}>
                <button type="button" onClick={onFechar} className={styles.cancelar}>Cancelar</button>
                <div className={styles.enviar}>
                    <Button name="Confirmar pedido" nameCarregando="Enviando..." />
                </div>
            </div>
        </form>
    )
}

// Botão "Pedir para ser tutor" e o modal de confirmação (rota A13, pela Server Action).
// Com liberadoEm no futuro (pedido recusado há menos de 2h), o botão fica desabilitado
// com um timer regressivo e volta sozinho quando o tempo acaba, sem recarregar a página
export function BotaoPedirTutoria({ liberadoEm, ...props }: BotaoProps){
    const [aberto, setAberto] = useState(false);
    const [restanteMs, setRestanteMs] = useState(() => calcularRestante(liberadoEm));

    // Mesma função a cada render: o useEffect do formulário não repete o toast quando a página atualiza
    const fechar = useCallback(() => setAberto(false), []);

    // Recalcula a partir do liberado_em da API a cada segundo (não conta para trás sozinho,
    // então não acumula atraso). Para ao chegar a zero e limpa o intervalo ao desmontar
    useEffect(() => {
        const restanteInicial = calcularRestante(liberadoEm);
        setRestanteMs(restanteInicial);

        if(restanteInicial === 0) return;

        const intervalo = setInterval(() => {
            const restante = calcularRestante(liberadoEm);
            setRestanteMs(restante);

            if(restante === 0) clearInterval(intervalo);
        }, 1000);

        return () => clearInterval(intervalo);
    }, [liberadoEm]);

    if(restanteMs > 0){
        return (
            <div className={styles.bloqueado}>
                <button type="button" disabled className={styles.botao} aria-describedby={`motivo-${props.idSala}`}>
                    Pedir para ser tutor
                </button>
                <p id={`motivo-${props.idSala}`} className={styles.motivo}>
                    Seu último pedido foi recusado. Você poderá enviar um novo pedido em{" "}
                    {/* O servidor e o navegador podem calcular segundos diferentes no primeiro render */}
                    <strong suppressHydrationWarning>{formatarTempo(restanteMs)}</strong>.
                </p>
            </div>
        )
    }

    return (
        <>
            <button type="button" onClick={() => setAberto(true)} className={styles.botao}>
                Pedir para ser tutor
            </button>

            {/* Só existe enquanto aberto: não fica um <dialog> por sala na página */}
            {aberto && (
                <Modal aberto onFechar={fechar} titulo="Pedir para ser tutor">
                    <FormConfirmacao {...props} onFechar={fechar} />
                </Modal>
            )}
        </>
    )
}
