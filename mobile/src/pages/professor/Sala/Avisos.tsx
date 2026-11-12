import React, { useCallback, useState } from "react";
import { Text, StyleSheet } from "react-native";

import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { ItemAviso } from "../../../components/ItemAviso";
import { ModalAviso } from "../../../components/ModalAviso";
import { ListaSala } from "./ListaSala";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { AvisoSala } from "../../../lib/types";
import { colors, fonts, fontSizes } from "../../../styles/theme";

// Turma > Avisos (site: avisos/components/listaAvisos): avisos publicados (A4, do mais recente
// para o mais antigo) e o cartão "Enviar aviso para a sala" (P3)
export function Avisos({ sala, cabecalho }: PropsAba){
    const [modalAberto, setModalAberto] = useState(false);

    const buscar = useCallback(async () => (await api.get<AvisoSala[]>(`/salas/${sala.id_sala}/avisos`)).data, [sala.id_sala])
    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    return (
        <>
            <ListaSala
            cabecalho={cabecalho}
            topo={
                <>
                    <Card title="Enviar aviso para a sala">
                        <Text style={styles.ajuda}>O aviso aparece para todos os alunos matriculados nesta sala.</Text>
                        <Button title="Enviar aviso" onPress={() => setModalAberto(true)} />
                    </Card>

                    {dados && <Text style={styles.titulo}>Avisos publicados ({dados.length})</Text>}
                </>
            }
            itens={dados ?? []}
            keyExtractor={(item) => String(item.id_aviso)}
            renderItem={({ item }) => <ItemAviso aviso={item} />}
            carregando={carregando}
            atualizando={atualizando}
            falhou={!dados}
            erro={erro}
            onAtualizar={atualizar}
            onTentarNovamente={tentarNovamente}
            vazio={`Nenhum aviso publicado nesta sala. Use "Enviar aviso" para mandar o primeiro.`}
            />

            <ModalAviso
            visivel={modalAberto}
            idSala={sala.id_sala}
            onClose={() => setModalAberto(false)}
            onEnviado={atualizar}
            />
        </>
    )
}

const styles = StyleSheet.create({
    ajuda:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    },
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    }
})
