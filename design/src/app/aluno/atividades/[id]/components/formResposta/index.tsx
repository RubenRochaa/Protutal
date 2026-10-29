"use client"

import styles from './styles.module.scss'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/card'
import { FileUpload } from '@/components/fileUpload'
import { Button } from '@/components/button'
import { handleEnviarResposta } from '../../../../actions'

interface Props {
    idAtividade: number;
    // Prazo já passou: a API aceita, mas marca "entregue com atraso"
    vencida: boolean;
}

const MSG_SEM_ARQUIVO = "Escolha o arquivo da resposta antes de enviar."

// Card "Envie sua resposta" (rota A14): arquivo obrigatório e comentário opcional.
// Segue o modelo do FormNovaSala: valida no navegador, envia pela Server Action e mostra toast.
// No sucesso, a action atualiza a página, e este card dá lugar ao "Sua resposta"
export function FormResposta({ idAtividade, vencida }: Props){
    const [estado, formAction] = useActionState(handleEnviarResposta, {});
    const [erroArquivo, setErroArquivo] = useState<string | null>(null);

    // Cada resposta da Server Action vira um toast
    useEffect(() => {
        if(estado.error) toast.error(estado.error);
        if(estado.sucesso) toast.success(estado.sucesso);
    }, [estado]);

    // Validação no navegador: sem arquivo, mostra o erro no formulário e nem chama a API.
    // Formato e tamanho o FileUpload já confere ao escolher o arquivo
    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        const arquivo = new FormData(e.currentTarget).get("file");

        if(!(arquivo instanceof File) || arquivo.size === 0){
            e.preventDefault();
            setErroArquivo(MSG_SEM_ARQUIVO);
        }
    }

    return (
        <Card titulo="Envie sua resposta">
            <form
            action={formAction}
            onSubmit={handleSubmit}
            // Escolheu um arquivo (ou mexeu no comentário): o aviso de "sem arquivo" some
            onChange={() => setErroArquivo(null)}
            className={styles.form}
            noValidate
            >
                <input type="hidden" name="id_atividade" value={idAtividade} />

                <div className={styles.campo}>
                    <FileUpload required />

                    {erroArquivo && <p className={styles.erro} role="alert">{erroArquivo}</p>}
                </div>

                <div className={styles.campo}>
                    <label htmlFor="texto" className={styles.label}>Comentário (opcional)</label>
                    <textarea
                    id="texto"
                    name="texto"
                    rows={4}
                    placeholder="Escreva um comentário para o tutor"
                    defaultValue={estado.valores?.texto}
                    className={styles.textarea}
                    />
                </div>

                {vencida && (
                    <p className={styles.aviso} role="status">
                        O prazo terminou. Sua resposta será registrada como entregue com atraso.
                    </p>
                )}

                <Button name="Enviar resposta" nameCarregando="Enviando..." />
            </form>
        </Card>
    )
}
