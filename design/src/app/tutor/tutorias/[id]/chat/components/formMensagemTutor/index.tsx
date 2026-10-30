"use client"

import styles from './styles.module.scss'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/button'
import { handleEnviarMensagem } from '../../../../../actions'

interface Props {
    idTutoria: number;
}

const MSG_VAZIA = "Escreva a mensagem antes de enviar."
const MSG_ASSUNTO = "Escreva o assunto do comunicado."
const MSG_ASSUNTO_LONGO = "O assunto deve ter no máximo 150 caracteres"

// Campo de mensagem do chat (rota O1, pela Server Action).
// Diferença do aluno: o tutor pode marcar "Enviar como comunicado", que pede o assunto
export function FormMensagemTutor({ idTutoria }: Props){
    const [estado, formAction] = useActionState(handleEnviarMensagem, {});
    const [comunicado, setComunicado] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // Erro vira toast (ex.: 409 tutoria finalizada). Depois de erro, volta o estado do checkbox
    useEffect(() => {
        if(estado.error){
            toast.error(estado.error);
            setComunicado(estado.valores?.comunicado === "on");
        }
        if(estado.sucesso) setComunicado(false);
    }, [estado]);

    // Mesmas regras da O1 antes de enviar
    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        const dados = new FormData(e.currentTarget);
        const texto = String(dados.get("texto") ?? "").trim();
        const assunto = String(dados.get("assunto") ?? "").trim();

        let mensagem: string | null = null;
        if(comunicado && assunto === "") mensagem = MSG_ASSUNTO;
        else if(comunicado && assunto.length > 150) mensagem = MSG_ASSUNTO_LONGO;
        else if(texto === "") mensagem = MSG_VAZIA;

        if(mensagem){
            e.preventDefault();
            setErro(mensagem);
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
            <input type="hidden" name="id_tutoria" value={idTutoria} />

            <label className={styles.checkbox}>
                <input
                type="checkbox"
                name="comunicado"
                checked={comunicado}
                onChange={(e) => setComunicado(e.target.checked)}
                />
                Enviar como comunicado
            </label>

            {comunicado && (
                <div className={styles.campo}>
                    <label htmlFor="assunto" className={styles.rotulo}>Assunto</label>
                    <input
                    id="assunto"
                    name="assunto"
                    maxLength={150}
                    placeholder="Ex.: Revisão de relevo"
                    defaultValue={estado.valores?.assunto}
                    className={styles.input}
                    />
                </div>
            )}

            <div className={styles.linha}>
                <div className={styles.campo}>
                    <label htmlFor="texto" className={styles.oculto}>Mensagem para o tutorado</label>
                    <textarea
                    id="texto"
                    name="texto"
                    rows={2}
                    placeholder="Escreva sua mensagem"
                    // Depois de um erro, o campo volta com o texto digitado (no sucesso, vazio)
                    defaultValue={estado.valores?.texto}
                    aria-invalid={erro ? true : undefined}
                    aria-describedby={erro ? "erro-mensagem" : undefined}
                    className={styles.textarea}
                    />
                </div>

                <div className={styles.enviar}>
                    <Button name="Enviar" nameCarregando="Enviando..." />
                </div>
            </div>

            {erro && <p id="erro-mensagem" className={styles.erro} role="alert">{erro}</p>}
        </form>
    )
}
