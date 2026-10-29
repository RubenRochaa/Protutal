"use client"

import styles from './styles.module.scss'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/input'
import { Button } from '@/components/button'
import { validarLogin } from '@/lib/validacao'
import { MSG_SESSAO_EXPIRADA } from '@/lib/getErrorMessage'
import { handleLogin } from '../../actions'
import { AvisoConfirmacao } from '../avisoConfirmacao'

interface Props {
    // true quando o usuário acabou de se cadastrar (veio de /?cadastro=ok)
    cadastroConcluido?: boolean;
    // true quando a API respondeu 401 em outra tela (veio de /?sessao=expirada)
    sessaoExpirada?: boolean;
}

export function FormLogin({ cadastroConcluido = false, sessaoExpirada = false }: Props){
    const router = useRouter();
    const [estado, formAction] = useActionState(handleLogin, {});

    // Avisa uma vez e tira o "?sessao=expirada" da URL (para não repetir ao recarregar)
    useEffect(() => {
        if(!sessaoExpirada) return;

        toast.error(MSG_SESSAO_EXPIRADA, { id: "sessao-expirada" });
        router.replace("/");
    }, [sessaoExpirada, router]);

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

            {/* Login recusado (403) por e-mail não confirmado, ou cadastro recém-feito */}
            {estado.emailNaoConfirmado ? (
                <AvisoConfirmacao
                texto="Seu e-mail ainda não foi confirmado."
                textoBotao="Reenviar e-mail de confirmação"
                />
            ) : cadastroConcluido && (
                <AvisoConfirmacao
                texto="Enviamos um link de confirmação para o seu e-mail."
                textoBotao="Não recebeu? Reenviar e-mail"
                />
            )}

            <Button name="ENTRAR" nameCarregando="Entrando..." />

            <p className={styles.rodape}>
                Ainda não tem conta? <Link href="/cadastro" className={styles.link}>Cadastre-se</Link>
            </p>
        </form>
    )
}
