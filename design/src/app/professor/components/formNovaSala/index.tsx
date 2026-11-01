"use client"

import styles from './styles.module.scss'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Button } from '@/components/button'
import { validarSala } from '@/lib/validacao'
import { handleCriarSala } from '../../actions'

interface Props {
    // Chamado depois que a sala foi criada (ex.: fechar o modal)
    onSucesso?: () => void;
}

const OPCOES_SERIE = [
    { valor: "1", rotulo: "1ª série" },
    { valor: "2", rotulo: "2ª série" },
    { valor: "3", rotulo: "3ª série" },
]

// Formulário (modelo para os outros formulários): valida no navegador,
// envia pela Server Action e mostra o resultado em toast.
export function FormNovaSala({ onSucesso }: Props){
    const [estado, formAction] = useActionState(handleCriarSala, {});

    // Cada resposta da Server Action vira um toast.
    // Só "estado" nas dependências: o toast sai uma vez por resposta,
    // mesmo que a tela de fora redesenhe e mande um onSucesso novo
    useEffect(() => {
        if(estado.error) toast.error(estado.error);

        if(estado.sucesso){
            toast.success(estado.sucesso);
            onSucesso?.();
        }
    }, [estado]);

    // Validação no navegador, antes de enviar: se falhar, nem chama a API
    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        const formData = new FormData(e.currentTarget);
        const erro = validarSala(
            String(formData.get("nome") ?? ""),
            String(formData.get("serie") ?? ""),
            String(formData.get("ano_letivo") ?? "")
        );

        if(erro){
            e.preventDefault();
            toast.error(erro);
        }
    }

    return (
        <form action={formAction} onSubmit={handleSubmit} className={styles.form} noValidate>
            <Input
            label="Nome da sala"
            name="nome"
            type="text"
            placeholder="Ex.: 2º A"
            maxLength={100}
            defaultValue={estado.valores?.nome}
            required
            />

            <div className={styles.linha}>
                <Select
                label="Série"
                name="serie"
                opcoes={OPCOES_SERIE}
                placeholder="Selecione a série"
                defaultValue={estado.valores?.serie}
                required
                />

                <Input
                label="Ano letivo"
                name="ano_letivo"
                type="number"
                step={1}
                placeholder="Ex.: 2026"
                defaultValue={estado.valores?.ano_letivo ?? new Date().getFullYear()}
                required
                />
            </div>

            <Button name="Criar sala" nameCarregando="Criando..." />
        </form>
    )
}
