"use client"

import { useTransition } from 'react'
import { toast } from 'sonner'
import { ActionState } from './types'

// Roda uma Server Action a partir de um botão e mostra o resultado em toast.
// "pendente" fica true enquanto a ação roda: use para desabilitar o botão.
// Ex.: const { pendente, executar } = useAcao();
//      executar(() => handleRecusarPedido(id), () => setAberto(false))
export function useAcao(){
    const [pendente, startTransition] = useTransition();

    function executar(acao: () => Promise<ActionState>, aoSucesso?: () => void){
        startTransition(async () => {
            const resultado = await acao();

            if(resultado.error){
                toast.error(resultado.error);
                return;
            }

            if(resultado.sucesso) toast.success(resultado.sucesso);
            aoSucesso?.();
        });
    }

    return { pendente, executar }
}
