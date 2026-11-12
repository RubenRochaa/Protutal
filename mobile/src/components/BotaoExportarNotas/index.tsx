import React, { useContext, useState } from "react";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";

import { Button } from "../Button";
import { ToastContext } from "../../contexts/ToastContext";

import { api } from "../../services/api";
import { getErrorMessage, getErrorStatus, MSG_SEM_CONEXAO } from "../../lib/getErrorMessage";

const TIPO_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

interface BotaoExportarNotasProps {
    // Sem sala escolhida o botão fica desabilitado
    idSala: number | null;
    // Filtros da P15 (ex.: { etapa: "2" }). Valor vazio = sem filtro
    filtros?: Record<string, string>;
}

// Botão "Exportar" do site (professor/components/botaoExportar). A API já devolve o .xlsx pronto
// (P15 - GET /salas/:id/notas/exportar): o celular baixa o arquivo com o token para a pasta
// temporária do app (expo-file-system) e abre o compartilhamento (expo-sharing), de onde o
// professor salva em Arquivos, abre no Excel ou manda por WhatsApp/e-mail
export function BotaoExportarNotas({ idSala, filtros = {} }: BotaoExportarNotasProps){
    const { showToast } = useContext(ToastContext);
    const [baixando, setBaixando] = useState(false);

    async function handleExportar(){
        if(!idSala) return showToast("erro", "Escolha a sala");

        const params = Object.fromEntries(Object.entries(filtros).filter(([, valor]) => valor !== ""));
        const query = new URLSearchParams(params).toString();
        const caminho = `/salas/${idSala}/notas/exportar`;

        setBaixando(true);

        let arquivo: File;

        try {
            // O nome do arquivo vem do Content-Disposition da API (ex.: notas_2_A_2026.xlsx).
            // idempotent: exportar de novo substitui a planilha anterior na pasta temporária
            arquivo = await File.downloadFileAsync(
                `${api.defaults.baseURL}${caminho}${query ? `?${query}` : ""}`,
                Paths.cache,
                {
                    headers: { Authorization: String(api.defaults.headers.common["Authorization"] ?? "") },
                    idempotent: true
                }
            );
        } catch {
            // O download não devolve a mensagem da API quando ela recusa (ex.: 403, 404):
            // a mesma chamada pelo axios traz o { error } e, no 401, o AuthContext desloga
            try {
                await api.get(caminho, { params });
                showToast("erro", MSG_SEM_CONEXAO);
            } catch(err) {
                if(getErrorStatus(err) !== 401) showToast("erro", getErrorMessage(err));
            }

            setBaixando(false);
            return;
        }

        try {
            if(!(await Sharing.isAvailableAsync())){
                showToast("erro", "O compartilhamento de arquivos não está disponível neste aparelho.");
                return;
            }

            await Sharing.shareAsync(arquivo.uri, {
                mimeType: TIPO_XLSX,
                UTI: "org.openxmlformats.spreadsheetml.sheet",
                dialogTitle: "Planilha de notas"
            });

            showToast("sucesso", "Planilha de notas exportada!");
        } catch {
            showToast("erro", "Não foi possível compartilhar a planilha.");
        } finally {
            setBaixando(false);
        }
    }

    return (
        <Button
        title="Exportar para Excel"
        titleLoading="Exportando..."
        loading={baixando}
        disabled={!idSala}
        onPress={handleExportar}
        />
    )
}
