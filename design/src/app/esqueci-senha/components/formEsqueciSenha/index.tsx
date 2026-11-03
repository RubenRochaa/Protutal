"use client"

import styles from './styles.module.scss'
import Link from 'next/link'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/input'
import { Button } from '@/components/button'
import { Mascote } from '@/components/mascote'
import { MASCOTES } from '@/lib/mascotes'
import { validarEmailRecuperacao } from '@/lib/validacao'
import { handleSolicitarRedefinicao } from '../../actions'

// Depois de um envio, o botão fica bloqueado esse tempo (como o reenvio da confirmação)
const ESPERA_REENVIO_S = 60

export function FormEsqueciSenha(){
    const [estado, formAction] = useActionState(handleSolicitarRedefinicao, {});
    const [restante, setRestante] = useState(0);

    // Cada resposta da Server Action vira um toast; no sucesso começa a contagem de 60 s
    useEffect(() => {
        if(estado.error) toast.error(estado.error);

        if(estado.sucesso){
            toast.success(estado.sucesso);
            setRestante(ESPERA_REENVIO_S);
        }
    }, [estado]);

    // Contagem regressiva: diminui 1 por segundo até zerar
    useEffect(() => {
        if(restante <= 0) return;

        const timer = setTimeout(() => setRestante(restante - 1), 1000);
        return () => clearTimeout(timer);
    }, [restante]);

    // Validação no navegador, antes de enviar: se falhar, nem chama a API
    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        const formData = new FormData(e.currentTarget);
        const erro = validarEmailRecuperacao(String(formData.get("email")));

        if(erro){
            e.preventDefault();
            toast.error(erro);
        }
    }

    return (
        <form action={formAction} onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.cabecalho}>
                <h2 className={styles.titulo}>Esqueceu sua senha?</h2>
                <p className={styles.texto}>
                    Digite o e-mail institucional do seu cadastro. Vamos enviar um link para você criar uma nova senha.
                </p>
            </div>

            <Input
            label="E-mail"
            name="email"
            type="email"
            placeholder="Digite seu email"
            autoComplete="email"
            defaultValue={estado.valores?.email}
            required
            />

            {/* Mensagem neutra da API: aparece exista o e-mail ou não */}
            {estado.sucesso && (
                <div className={styles.aviso} role="status">
                    <Mascote imagem={MASCOTES.email} className={styles.mascote} />
                    <p>{estado.sucesso}</p>
                </div>
            )}

            <Button
            name={restante > 0 ? `Enviar de novo em ${restante}s` : "Enviar link"}
            nameCarregando="Enviando..."
            disabled={restante > 0}
            />

            <p className={styles.rodape}>
                Lembrou a senha? <Link href="/" className={styles.link}>Voltar para o login</Link>
            </p>
        </form>
    )
}
