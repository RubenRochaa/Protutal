"use client"

import styles from './styles.module.scss'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/input'
import { Button } from '@/components/button'
import { validarCadastro } from '@/lib/validacao'
import { handleCadastro } from '../../actions'

export function FormCadastro(){
    const router = useRouter();
    const [estado, formAction] = useActionState(handleCadastro, {});

    // Cada resposta da Server Action vira um toast
    useEffect(() => {
        if(estado.error) toast.error(estado.error);

        if(estado.sucesso){
            toast.success(estado.sucesso);
            if(estado.redirecionar) router.push(estado.redirecionar);
        }
    }, [estado, router]);

    // Validação no navegador, antes de enviar: se falhar, nem chama a API
    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        const formData = new FormData(e.currentTarget);
        const erro = validarCadastro(
            String(formData.get("nome")),
            String(formData.get("email")).trim(),
            String(formData.get("senha"))
        );

        if(erro){
            e.preventDefault();
            toast.error(erro);
        }
    }

    return (
        <form action={formAction} onSubmit={handleSubmit} className={styles.form} noValidate>
            <Input
            label="Nome"
            name="nome"
            type="text"
            placeholder="Digite seu nome"
            autoComplete="name"
            defaultValue={estado.valores?.nome}
            required
            />

            <Input
            label="E-mail"
            name="email"
            type="email"
            placeholder="Digite seu email"
            autoComplete="email"
            defaultValue={estado.valores?.email}
            required
            />

            <Input
            label="Senha"
            name="senha"
            type="password"
            placeholder="Digite sua senha"
            autoComplete="new-password"
            required
            />

            <Button name="Enviar" nameCarregando="Enviando..." />

            <p className={styles.rodape}>
                Tem conta? <Link href="/" className={styles.link}>Faça o login</Link>
            </p>
        </form>
    )
}
