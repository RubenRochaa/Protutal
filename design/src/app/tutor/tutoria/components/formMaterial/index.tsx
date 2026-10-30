"use client"

import styles from './styles.module.scss'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Textarea } from '@/components/textarea'
import { FileUpload } from '@/components/fileUpload'
import { Button } from '@/components/button'
import { handleAnexarMaterial } from '../../../actions'

interface Props {
    // Salas em que o tutor tem tutoria ativa (só nelas a T5 aceita o envio)
    salas: { valor: string; rotulo: string }[];
}

// Card "Anexar materiais" do print 2 (rota T5, multipart pela Server Action).
// FileUpload já valida formato e tamanho; depois do sucesso o React limpa o formulário
export function FormMaterial({ salas }: Props){
    const [estado, formAction] = useActionState(handleAnexarMaterial, {});

    useEffect(() => {
        if(estado.error) toast.error(estado.error);
        if(estado.sucesso) toast.success(estado.sucesso);
    }, [estado]);

    // Validação no navegador antes de chamar a API (mesmas regras da T5)
    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        const dados = new FormData(e.currentTarget);
        const titulo = String(dados.get("titulo") ?? "").trim();
        const arquivo = dados.get("file");

        let erro: string | null = null;
        if(titulo === "") erro = "O título do material é obrigatório";
        else if(titulo.length > 150) erro = "O título do material deve ter no máximo 150 caracteres";
        else if(!(arquivo instanceof File) || arquivo.size === 0) erro = "Escolha o arquivo do material.";

        if(erro){
            e.preventDefault();
            toast.error(erro);
        }
    }

    return (
        <form action={formAction} onSubmit={handleSubmit} className={styles.form} noValidate>
            {/* Com uma sala só, o select fica escondido e a sala vai direto */}
            {salas.length === 1 ? (
                <input type="hidden" name="id_sala" value={salas[0].valor} />
            ) : (
                <Select label="Sala" name="id_sala" opcoes={salas} />
            )}

            <Input
            label="Nome do arquivo"
            name="titulo"
            placeholder="Digite o nome do material"
            maxLength={150}
            defaultValue={estado.valores?.titulo}
            />

            <Textarea
            label="Descrição (opcional)"
            name="descricao"
            rows={2}
            defaultValue={estado.valores?.descricao}
            />

            <FileUpload />

            <div className={styles.enviar}>
                <Button name="Anexar" nameCarregando="Enviando..." />
            </div>
        </form>
    )
}
