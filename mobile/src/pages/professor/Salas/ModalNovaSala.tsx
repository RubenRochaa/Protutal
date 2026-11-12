import React, { useContext, useState } from "react";

import { Janela } from "../../../components/Janela";
import { Input } from "../../../components/Input";
import { Select } from "../../../components/Select";
import { Button } from "../../../components/Button";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { getErrorMessage } from "../../../lib/getErrorMessage";
import { validarSala } from "../../../lib/validacao";

const OPCOES_SERIE = [
    { value: "1", label: "1ª série" },
    { value: "2", label: "2ª série" },
    { value: "3", label: "3ª série" },
]

interface ModalNovaSalaProps {
    visivel: boolean;
    onClose: () => void;
    onCriada: () => void;
}

// Formulário "Nova sala" do site (professor/components/formNovaSala): valida antes de enviar
// e cria pela rota P19 (POST /salas). O ano letivo começa no ano atual, como no site
export function ModalNovaSala({ visivel, onClose, onCriada }: ModalNovaSalaProps){
    const { showToast } = useContext(ToastContext);

    const [nome, setNome] = useState("");
    const [serie, setSerie] = useState("");
    const [anoLetivo, setAnoLetivo] = useState(String(new Date().getFullYear()));
    const [enviando, setEnviando] = useState(false);

    function fechar(){
        if(enviando) return;

        setNome("");
        setSerie("");
        setAnoLetivo(String(new Date().getFullYear()));
        onClose();
    }

    async function handleCriar(){
        const erro = validarSala(nome, serie, anoLetivo);

        if(erro){
            showToast("erro", erro);
            return;
        }

        setEnviando(true);

        try {
            await api.post("/salas", {
                nome: nome.trim(),
                serie: Number(serie),
                ano_letivo: Number(anoLetivo)
            });

            showToast("sucesso", "Sala criada com sucesso!");
            setEnviando(false);
            onCriada();
            setNome("");
            setSerie("");
            setAnoLetivo(String(new Date().getFullYear()));
            onClose();
        } catch(err) {
            showToast("erro", getErrorMessage(err));
            setEnviando(false);
        }
    }

    return (
        <Janela visivel={visivel} titulo="Nova sala" onClose={fechar}>
            <Input
            label="Nome da sala"
            placeholder="Ex.: 2º A"
            maxLength={100}
            value={nome}
            onChangeText={setNome}
            editable={!enviando}
            />

            <Select
            label="Série"
            options={OPCOES_SERIE}
            value={serie}
            onChange={setSerie}
            placeholder="Selecione a série"
            disabled={enviando}
            />

            <Input
            label="Ano letivo"
            placeholder="Ex.: 2026"
            keyboardType="number-pad"
            value={anoLetivo}
            onChangeText={setAnoLetivo}
            editable={!enviando}
            />

            <Button title="Criar sala" titleLoading="Criando..." loading={enviando} onPress={handleCriar} />
        </Janela>
    )
}
