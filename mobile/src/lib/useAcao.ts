import { useCallback, useContext, useState } from "react";

import { ToastContext } from "../contexts/ToastContext";
import { getErrorMessage, getErrorStatus } from "./getErrorMessage";

// Mesmo papel de design/src/lib/useAcao.ts: roda uma ação na API (POST/PATCH),
// mostra o toast de sucesso ou de erro e avisa a tela para buscar a lista de novo.
// Devolve true quando deu certo (ex.: para fechar o modal)
export function useAcao(){
    const { showToast } = useContext(ToastContext);
    const [executando, setExecutando] = useState(false);

    const executar = useCallback(async (acao: () => Promise<unknown>, mensagemSucesso: string, onSucesso?: () => void) => {
        setExecutando(true);

        try {
            await acao();
            showToast("sucesso", mensagemSucesso);
            onSucesso?.();
            return true;
        } catch(err) {
            // 401 o AuthContext já trata (desloga e avisa)
            if(getErrorStatus(err) !== 401) showToast("erro", getErrorMessage(err));
            return false;
        } finally {
            setExecutando(false);
        }
    }, [showToast])

    return { executando, executar };
}
