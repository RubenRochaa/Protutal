"use client"

import styles from './styles.module.scss'
import { useActionState, useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MessageSquareWarning } from 'lucide-react'
import { Modal } from '@/components/modal'
import { Button } from '@/components/button'
import { handleContestarNota } from '../../actions'

interface Props {
    idNota: number;
    // Para a action atualizar também o detalhe da atividade
    idAtividade: number;
    // Aparece no modal, para o aluno saber qual nota está contestando
    tituloAtividade: string;
}

const MSG_SEM_JUSTIFICATIVA = "Escreva a justificativa da contestação."

interface FormProps extends Props {
    onFechar: () => void;
}

// Formulário dentro do modal. Fica num componente próprio para começar limpo a cada abertura
function FormContestacao({ idNota, idAtividade, tituloAtividade, onFechar }: FormProps){
    const [estado, formAction] = useActionState(handleContestarNota, {});
    const [erro, setErro] = useState<string | null>(null);

    // Sucesso: toast e fecha. Erro da API (ex.: 409 já contestada, 403 tutoria finalizada): toast
    useEffect(() => {
        if(estado.error) toast.error(estado.error);

        if(estado.sucesso){
            toast.success(estado.sucesso);
            onFechar();
        }
    }, [estado, onFechar]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        const comentario = String(new FormData(e.currentTarget).get("comentario") ?? "").trim();

        if(comentario === ""){
            e.preventDefault();
            setErro(MSG_SEM_JUSTIFICATIVA);
        }
    }

    return (
        <form
        action={formAction}
        onSubmit={handleSubmit}
        onChange={() => setErro(null)}
        className={styles.form}
        noValidate
        >
            <input type="hidden" name="id_nota" value={idNota} />
            <input type="hidden" name="id_atividade" value={idAtividade} />

            <p className={styles.atividade}>{tituloAtividade}</p>
            <p className={styles.aviso}>
                Cada nota pode ser contestada uma única vez. O tutor vai analisar e responder.
            </p>

            <div className={styles.campo}>
                <label htmlFor={`justificativa-${idNota}`} className={styles.label}>Justificativa</label>
                <textarea
                id={`justificativa-${idNota}`}
                name="comentario"
                rows={5}
                placeholder="Explique por que você discorda da nota"
                defaultValue={estado.valores?.comentario}
                aria-invalid={erro ? true : undefined}
                className={styles.textarea}
                required
                />
                {erro && <p className={styles.erro} role="alert">{erro}</p>}
            </div>

            <div className={styles.botoes}>
                <button type="button" onClick={onFechar} className={styles.cancelar}>Cancelar</button>
                <div className={styles.enviar}>
                    <Button name="Enviar contestação" nameCarregando="Enviando..." />
                </div>
            </div>
        </form>
    )
}

// Botão "Contestar nota" e o modal com a justificativa (rota A8, pela Server Action).
// Usado no desempenho (Últimas atividades e notas) e no card "Correção do tutor" da atividade
export function BotaoContestar(props: Props){
    const [aberto, setAberto] = useState(false);

    // Mesma função a cada render: o useEffect do formulário não roda de novo (nem repete o toast)
    // quando a página é atualizada pela action
    const fechar = useCallback(() => setAberto(false), []);

    return (
        <>
            <button type="button" onClick={() => setAberto(true)} className={styles.botao}>
                <MessageSquareWarning size={18} aria-hidden="true" />
                Contestar nota
            </button>

            {/* Só existe enquanto aberto: o formulário começa vazio e não há dois <dialog> na página */}
            {aberto && (
                <Modal aberto onFechar={fechar} titulo="Contestar nota">
                    <FormContestacao {...props} onFechar={fechar} />
                </Modal>
            )}
        </>
    )
}
