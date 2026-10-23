"use client"

import styles from './styles.module.scss'
import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Modal } from '@/components/modal'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Button } from '@/components/button'
import { validarSala } from '@/lib/validacao'
import { handleCriarSala } from '../../actions'

const SERIES = [
    { valor: "1", rotulo: "1ª série" },
    { valor: "2", rotulo: "2ª série" },
    { valor: "3", rotulo: "3ª série" },
]

// Botão "Nova turma" + Modal com o formulário de criação (POST /salas)
export function NovaTurma(){
    const router = useRouter();
    const [aberto, setAberto] = useState(false);
    const [estado, formAction] = useActionState(handleCriarSala, {});

    const anoAtual = String(new Date().getFullYear());

    // Cada resposta da Server Action vira um toast
    useEffect(() => {
        if(estado.error){
            toast.error(estado.error);

            // Sessão expirada (401): a action já apagou os cookies
            if(estado.redirecionar) router.push(estado.redirecionar);
        }

        if(estado.sucesso){
            toast.success(estado.sucesso);
            setAberto(false);
        }
    }, [estado, router]);

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
        <>
            <button type="button" className={styles.novaTurma} onClick={() => setAberto(true)}>
                <Plus size={20} aria-hidden="true" />
                Nova turma
            </button>

            <Modal aberto={aberto} onFechar={() => setAberto(false)} titulo="Nova turma">
                <form action={formAction} onSubmit={handleSubmit} className={styles.form} noValidate>
                    <Input
                    label="Nome"
                    name="nome"
                    placeholder="Ex.: 3ºA"
                    maxLength={100}
                    defaultValue={estado.valores?.nome}
                    required
                    />

                    <Select
                    label="Série"
                    name="serie"
                    placeholder="Selecione a série"
                    opcoes={SERIES}
                    defaultValue={estado.valores?.serie}
                    required
                    />

                    <Input
                    label="Ano letivo"
                    name="ano_letivo"
                    type="number"
                    step={1}
                    defaultValue={estado.valores?.ano_letivo ?? anoAtual}
                    required
                    />

                    <Button name="Criar turma" nameCarregando="Criando..." />
                </form>
            </Modal>
        </>
    )
}
