"use client"

import styles from './styles.module.scss'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/button'
import { handleEnviarMensagem } from '../../../../actions'

interface Props {
    idTutoria: number;
}

const MSG_VAZIA = "Escreva a mensagem antes de enviar."

// Campo de mensagem e botão "Enviar" no rodapé do chat (rota O1, pela Server Action).
// Depois do envio o React limpa o campo, e a action atualiza a página com a mensagem nova
export function FormMensagem({ idTutoria }: Props){
    const [estado, formAction] = useActionState(handleEnviarMensagem, {});
    const [erro, setErro] = useState<string | null>(null);

    // Erro vira toast (ex.: 409 tutoria finalizada). O sucesso já aparece na lista, sem toast
    useEffect(() => {
        if(estado.error) toast.error(estado.error);
    }, [estado]);

    // Não envia mensagem vazia ou só com espaços
    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        const texto = String(new FormData(e.currentTarget).get("texto") ?? "").trim();

        if(texto === ""){
            e.preventDefault();
            setErro(MSG_VAZIA);
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

            <div className={styles.campo}>
                <label htmlFor="texto" className={styles.oculto}>Mensagem para o tutor</label>
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

                {erro && <p id="erro-mensagem" className={styles.erro} role="alert">{erro}</p>}
            </div>

            <div className={styles.enviar}>
                <Button name="Enviar" nameCarregando="Enviando..." />
            </div>
        </form>
    )
}
