"use client"

import { useEffect } from 'react'
import { toast } from 'sonner'
import { Botao } from '@/components/botao'
import { QuadroErro } from '@/components/telaErro'

interface Props {
    mensagem: string;
    // true quando a API respondeu 403 (sala de outro professor)
    acessoNegado?: boolean;
}

// A P1 recusou a sala: não existe (404), é de outro professor (403) ou o id é inválido (400).
// Mostra a mensagem da API no toast e o quadro com o mascote e o caminho de volta.
// No 403 o quadro mostra o texto padrão de acesso negado e volta para o início
export function SalaIndisponivel({ mensagem, acessoNegado = false }: Props){
    useEffect(() => {
        // O id evita toast repetido quando o efeito roda mais de uma vez
        toast.error(mensagem, { id: "sala-indisponivel" });
    }, [mensagem]);

    if(acessoNegado){
        return (
            <QuadroErro mensagem="Você não tem permissão para ver esta página.">
                <Botao href="/professor">Voltar ao início</Botao>
            </QuadroErro>
        )
    }

    return (
        <QuadroErro mensagem={mensagem}>
            <Botao href="/professor#salas">Voltar para Minhas salas</Botao>
        </QuadroErro>
    )
}
