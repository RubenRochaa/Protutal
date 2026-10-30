"use client"

import styles from './styles.module.scss'
import Link from 'next/link'
import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/input'
import { Button } from '@/components/button'
import { validarNovaSenha } from '@/lib/validacao'
import { handleRedefinirSenha } from '../../actions'

interface Props {
    // token que veio no link do e-mail ("" quando a URL não tem ?token=)
    token: string;
}

export function FormRedefinirSenha({ token }: Props){
    const router = useRouter();
    const [estado, formAction] = useActionState(handleRedefinirSenha, {});

    // Cada resposta da Server Action vira um toast; no sucesso volta para o login
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
        const erro = validarNovaSenha(String(formData.get("senha")), String(formData.get("confirmacao")));

        if(erro){
            e.preventDefault();
            toast.error(erro);
        }
    }

    // Sem token na URL, ou a API recusou o token: não adianta mostrar o formulário
    if(token === "" || estado.tokenInvalido){
        return (
            <div className={styles.form}>
                <div className={styles.cabecalho}>
                    <h2 className={styles.titulo}>Link inválido ou expirado</h2>
                    <p className={styles.texto}>
                        Este link de redefinição não vale mais. Ele dura 30 minutos e só pode ser usado uma vez.
                    </p>
                </div>

                <Link href="/esqueci-senha" className={styles.botaoLink}>Pedir um novo link</Link>

                <p className={styles.rodape}>
                    <Link href="/" className={styles.link}>Voltar para o login</Link>
                </p>
            </div>
        )
    }

    return (
        <form action={formAction} onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.cabecalho}>
                <h2 className={styles.titulo}>Criar nova senha</h2>
                <p className={styles.texto}>Digite a nova senha duas vezes para confirmar.</p>
            </div>

            <input type="hidden" name="token" value={token} />

            <Input
            label="Nova senha"
            name="senha"
            type="password"
            placeholder="Digite a nova senha"
            autoComplete="new-password"
            required
            />

            <Input
            label="Confirmar senha"
            name="confirmacao"
            type="password"
            placeholder="Digite a nova senha de novo"
            autoComplete="new-password"
            required
            />

            <Button name="Salvar nova senha" nameCarregando="Salvando..." />

            <p className={styles.rodape}>
                <Link href="/" className={styles.link}>Voltar para o login</Link>
            </p>
        </form>
    )
}
