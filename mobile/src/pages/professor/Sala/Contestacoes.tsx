import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Badge } from "../../../components/Badge";
import { Button } from "../../../components/Button";
import { Janela } from "../../../components/Janela";
import { ItemLista } from "../../../components/ItemLista";
import { AbasSegmentadas } from "../../../components/AbasSegmentadas";
import { ModalResolverContestacao } from "../../../components/ModalResolverContestacao";
import { ListaSala } from "./ListaSala";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { formatarData, formatarNota } from "../../../lib/formatacao";
import { ContestacaoTutor, StatusContestacao } from "../../../lib/types";
import { colors, fonts, fontSizes } from "../../../styles/theme";

// "" = todas (os outros são os valores que a P16 aceita)
type Filtro = "" | StatusContestacao;

const ROTULO_STATUS: Record<StatusContestacao, string> = { pendente: "Pendente", aceita: "Aceita", recusada: "Recusada" };

// Atividades > Contestações (sem Figma; site: contestacoes/components/listaContestacoes):
// P16 (GET /contestacoes?id_sala=&status=), "Ver detalhe" e "Resolver" (T4) nas pendentes.
// O professor escolhe aceitar ou recusar dentro da janela, como no site
export function Contestacoes({ sala, cabecalho, status }: PropsAba){
    const [filtro, setFiltro] = useState<Filtro>(status ?? "");
    const [detalhe, setDetalhe] = useState<ContestacaoTutor | null>(null);
    const [resolver, setResolver] = useState<ContestacaoTutor | null>(null);

    const buscar = useCallback(async () => {
        const params: Record<string, string | number> = { id_sala: sala.id_sala };
        if(filtro) params.status = filtro;

        return (await api.get<ContestacaoTutor[]>("/contestacoes", { params })).data;
    }, [sala.id_sala, filtro])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    function abrirResolucao(contestacao: ContestacaoTutor){
        setDetalhe(null);
        setResolver(contestacao);
    }

    return (
        <>
            <ListaSala
            cabecalho={cabecalho}
            topo={
                <>
                    <AbasSegmentadas
                    rolavel
                    opcoes={[
                        { valor: "", rotulo: "Todas" },
                        { valor: "pendente", rotulo: "Pendentes" },
                        { valor: "aceita", rotulo: "Aceitas" },
                        { valor: "recusada", rotulo: "Recusadas" }
                    ]}
                    valor={filtro}
                    onChange={setFiltro}
                    />

                    {dados && !carregando && <Text style={styles.titulo}>Contestações ({dados.length})</Text>}
                </>
            }
            itens={dados ?? []}
            keyExtractor={(item) => String(item.id_contestacao)}
            renderItem={({ item }) => (
                <ItemLista
                titulo={`${item.aluno.nome} · ${item.atividade.titulo}`}
                detalhes={[`Nota ${formatarNota(item.nota.valor)} · tutor ${item.tutor.nome} · enviada em ${formatarData(item.data_envio)}`]}
                onPress={() => setDetalhe(item)}
                accessibilityLabel={`${item.aluno.nome}, ${item.atividade.titulo}. Ver detalhe`}
                >
                    <Badge label={ROTULO_STATUS[item.status]} variant={item.status === "pendente" ? "destaque" : "neutro"} />
                </ItemLista>
            )}
            carregando={carregando}
            atualizando={atualizando}
            falhou={!dados}
            erro={erro}
            onAtualizar={atualizar}
            onTentarNovamente={tentarNovamente}
            vazio={filtro ? "Nenhuma contestação com essa situação." : "Nenhum aluno contestou nota nesta sala."}
            />

            <Janela visivel={detalhe !== null} titulo="Contestação de nota" onClose={() => setDetalhe(null)}>
                {detalhe && (
                    <>
                        <Dado rotulo="Aluno" valor={detalhe.aluno.nome} />
                        <Dado
                        rotulo="Atividade"
                        valor={`${detalhe.atividade.titulo} (${detalhe.atividade.conteudo?.nome ?? "sem conteúdo"}, ${detalhe.atividade.etapa}ª etapa)`}
                        />
                        <Dado rotulo="Nota atual" valor={formatarNota(detalhe.nota.valor)} />
                        <Dado rotulo="Justificativa do aluno" valor={detalhe.comentario} />
                        <Dado rotulo="Situação" valor={ROTULO_STATUS[detalhe.status]} />
                        {detalhe.status !== "pendente" && detalhe.decisao && (
                            <Dado
                            rotulo={`Decisão${detalhe.data_resolucao ? ` (${formatarData(detalhe.data_resolucao)})` : ""}`}
                            valor={detalhe.decisao}
                            />
                        )}

                        {detalhe.status === "pendente" && <Button title="Resolver" onPress={() => abrirResolucao(detalhe)} />}
                    </>
                )}
            </Janela>

            <ModalResolverContestacao
            contestacao={resolver}
            onClose={() => setResolver(null)}
            onResolvida={atualizar}
            />
        </>
    )
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }){
    return (
        <View style={styles.dado}>
            <Text style={styles.rotulo}>{rotulo}</Text>
            <Text style={styles.valor}>{valor}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    titulo:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.tituloCard,
        color: colors.red700
    },
    dado:{
        gap: 2
    },
    rotulo:{
        fontFamily: fonts.medium,
        fontSize: fontSizes.rotulo,
        color: colors.gray700
    },
    valor:{
        fontFamily: fonts.regular,
        fontSize: 15,
        color: colors.black
    }
})
