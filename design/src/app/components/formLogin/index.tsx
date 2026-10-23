"use client"

import styles from './styles.module.scss'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/input'
import { Button } from '@/components/button'
import { validarLogin } from '@/lib/validacao'
import { handleLogin } from '../../actions'

export function FormLogin(){
    const router = useRouter();
    const [estado, formAction] = useActionState(handleLogin, {});

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
        const erro = validarLogin(String(formData.get("email")), String(formData.get("senha")));

        if(erro){
            e.preventDefault();
            toast.error(erro);
        }
    }

    return (
        <form action={formAction} onSubmit={handleSubmit} className={styles.form} noValidate>
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
            autoComplete="current-password"
            required
            />

            {/* Ainda não existe rota de recuperação de senha na API */}
            <button type="button" className={styles.esqueceu} disabled title="Em breve">
                Esqueceu sua senha? <span className={styles.emBreve}>Em breve</span>
            </button>

            <Button name="ENTRAR" nameCarregando="Entrando..." />

            <p className={styles.rodape}>
                Ainda não tem conta? <Link href="/cadastro" className={styles.link}>Cadastre-se</Link>
            </p>
        </form>
    )
}
