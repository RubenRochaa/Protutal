"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { FileSpreadsheet } from 'lucide-react'
import { MSG_SEM_CONEXAO } from '@/lib/getErrorMessage'
import { Botao } from '@/components/botao'

interface Props {
    // Sem sala escolhida o botão fica desabilitado
    idSala: number | null;
    // Filtros da P15 (ex.: { etapa: "2" }). Valor vazio = sem filtro
    filtros?: Record<string, string>;
}

// Nome que vem no Content-Disposition da API (ex.: attachment; filename="notas_2_A_2026.xlsx")
function nomeDoArquivo(disposicao: string | null){
    const encontrado = disposicao?.match(/filename="?([^";]+)"?/)

    return encontrado ? encontrado[1] : "notas.xlsx"
}

// Botão "Exportar" (Figma p16). Não chama a API direto (o token é httpOnly):
// pede o arquivo ao Route Handler do Next (app/api/professor/.../exportar), que chama a P15.
// Erro vira toast; 401 leva para a sessão expirada.
export function BotaoExportar({ idSala, filtros = {} }: Props){
    const router = useRouter();
    const [baixando, setBaixando] = useState(false);

    async function handleExportar(){
        if(!idSala) return toast.error("Escolha a sala");

        const query = new URLSearchParams(Object.entries(filtros).filter(([, valor]) => valor !== "")).toString();
        setBaixando(true);

        try {
            const resposta = await fetch(`/api/professor/salas/${idSala}/notas/exportar${query ? `?${query}` : ""}`);

            if(resposta.status === 401) return router.push("/sessao-expirada");

            if(!resposta.ok){
                const corpo = await resposta.json().catch(() => ({}));
                return toast.error(corpo.error ?? MSG_SEM_CONEXAO);
            }

            // Cria um link temporário para o navegador salvar o arquivo
            const arquivo = await resposta.blob();
            const url = URL.createObjectURL(arquivo);
            const link = document.createElement("a");
            link.href = url;
            link.download = nomeDoArquivo(resposta.headers.get("content-disposition"));
            link.click();
            URL.revokeObjectURL(url);

            toast.success("Planilha de notas exportada!");
        } catch {
            toast.error(MSG_SEM_CONEXAO);
        } finally {
            setBaixando(false);
        }
    }

    return (
        <Botao onClick={handleExportar} disabled={!idSala} carregando={baixando}>
            {/* Enquanto exporta, o Loader toma o lugar do ícone */}
            {!baixando && <FileSpreadsheet size={18} aria-hidden="true" />}
            {baixando ? "Exportando..." : "Exportar"}
        </Botao>
    )
}
