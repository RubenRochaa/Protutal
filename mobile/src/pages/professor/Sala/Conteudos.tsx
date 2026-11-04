import React, { useCallback, useContext, useState } from "react";
import { View, StyleSheet } from "react-native";

import { Janela } from "../../../components/Janela";
import { Input } from "../../../components/Input";
import { Button } from "../../../components/Button";
import { ItemLista } from "../../../components/ItemLista";
import { ToastContext } from "../../../contexts/ToastContext";
import { ListaSala } from "./ListaSala";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useAcao } from "../../../lib/useAcao";
import { useBuscar } from "../../../lib/useBuscar";
import { ConteudoSala } from "../../../lib/types";
import { spacing } from "../../../styles/theme";

// Turma > Conteúdos (site: conteudos/components/listaConteudos): conteúdos da sala (P2),
// busca feita no celular (a P2 não tem filtro) e "Novo conteúdo" (P25)
export function Conteudos({ sala, cabecalho }: PropsAba){
    const { showToast } = useContext(ToastContext);
    const { executando, executar } = useAcao();

    const [busca, setBusca] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [nome, setNome] = useState("");

    const buscar = useCallback(async () => (await api.get<ConteudoSala[]>(`/salas/${sala.id_sala}/conteudos`)).data, [sala.id_sala])
    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    const conteudos = (dados ?? []).filter((conteudo) => conteudo.nome.toLowerCase().includes(busca.trim().toLowerCase()));

    function fecharModal(){
        if(executando) return;

        setNome("");
        setModalAberto(false);
    }

    // Mesmas validações do site (e da P25) antes de chamar a API
    async function handleCadastrar(){
        if(nome.trim() === "") return showToast("erro", "O campo nome é obrigatório");
        if(nome.trim().length > 100) return showToast("erro", "O nome deve ter no máximo 100 caracteres");

        const ok = await executar(
            () => api.post(`/salas/${sala.id_sala}/conteudos`, { nome: nome.trim() }),
            "Conteúdo cadastrado com sucesso!",
            atualizar
        );

        if(ok){
            setNome("");
            setModalAberto(false);
        }
    }

    return (
        <>
            <ListaSala
            cabecalho={cabecalho}
            topo={
                <>
                    <Button title="+ Novo conteúdo" onPress={() => setModalAberto(true)} />

                    {(dados?.length ?? 0) > 0 && (
                        <Input label="Buscar conteúdo" placeholder="Ex.: Clima" value={busca} onChangeText={setBusca} icon="search" />
                    )}
                </>
            }
            itens={conteudos}
            keyExtractor={(item) => String(item.id_conteudo)}
            renderItem={({ item }) => <ItemLista titulo={item.nome} />}
            carregando={carregando}
            atualizando={atualizando}
            falhou={!dados}
            erro={erro}
            onAtualizar={atualizar}
            onTentarNovamente={tentarNovamente}
            vazio={(dados?.length ?? 0) === 0
                ? `A sala ainda não tem conteúdos. Toque em "Novo conteúdo" para cadastrar o primeiro.`
                : "Nenhum conteúdo encontrado com essa busca."}
            />

            <Janela visivel={modalAberto} titulo="Novo conteúdo" onClose={fecharModal}>
                <Input
                label="Nome do conteúdo"
                placeholder="Ex.: Relevo brasileiro"
                maxLength={100}
                value={nome}
                onChangeText={setNome}
                editable={!executando}
                />

                <View style={styles.acoes}>
                    <Button title="Cadastrar" titleLoading="Cadastrando..." loading={executando} onPress={handleCadastrar} />
                    <Button title="Cancelar" variant="secundario" onPress={fecharModal} disabled={executando} />
                </View>
            </Janela>
        </>
    )
}

const styles = StyleSheet.create({
    acoes:{
        gap: spacing.md
    }
})
