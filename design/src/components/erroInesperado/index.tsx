"use client"

import { useEffect } from 'react'
import { Botao } from '../botao'
import { TelaErro } from '../telaErro'

interface Props {
    // Erro que o Next entrega ao error.tsx: vai só para o console, nunca para a tela
    error: Error & { digest?: string };
    // "Tentar novamente": monta a página de novo
    reset: () => void;
    // Início do perfil ("/professor", "/aluno", "/tutor"). Sem ele (global-error), não há "Voltar ao início"
    inicio?: string;
}

// Erro inesperado ao montar uma página (os erros da API já são tratados nas telas).
// O usuário vê só a mensagem amigável; os detalhes ficam no console para depuração
export function ErroInesperado({ error, reset, inicio }: Props){
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <TelaErro
        titulo="Algo deu errado"
        mensagem="Não foi possível abrir esta página. Tente novamente em alguns instantes."
        >
            <Botao onClick={reset}>Tentar novamente</Botao>
            {inicio && <Botao href={inicio} variante="secundario">Voltar ao início</Botao>}
        </TelaErro>
    )
}
