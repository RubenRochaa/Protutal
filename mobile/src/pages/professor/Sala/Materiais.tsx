import React, { useCallback, useState } from "react";
import { Text, StyleSheet } from "react-native";

import { Select } from "../../../components/Select";
import { ItemMaterial } from "../../../components/ItemMaterial";
import { ListaSala } from "./ListaSala";
import { PropsAba } from "./tipos";

import { api } from "../../../services/api";
import { useBuscar } from "../../../lib/useBuscar";
import { formatarData } from "../../../lib/formatacao";
import { MaterialSala, TutorSala } from "../../../lib/types";
import { colors, fonts, fontSizes } from "../../../styles/theme";

interface Dados {
    materiais: MaterialSala[];
    // null = a P24 falhou: o filtro de tutor não aparece
    tutores: TutorSala[] | null;
}

// Atividades > Materiais (sem Figma; site: materiais/page.tsx). Só consulta: quem anexa é o tutor (T5).
// A A5 não aceita filtro: o filtro por tutor é feito no celular. O select usa a P24, que só traz
// tutores ativos: material de tutor revogado aparece só em "Todos os tutores"
export function Materiais({ sala, cabecalho }: PropsAba){
    const [tutor, setTutor] = useState("");

    const buscar = useCallback(async (): Promise<Dados> => {
        const [materiais, tutores] = await Promise.all([
            api.get<MaterialSala[]>(`/salas/${sala.id_sala}/materiais`).then((r) => r.data),
            api.get<TutorSala[]>(`/salas/${sala.id_sala}/tutores`).then((r) => r.data).catch(() => null)
        ]);

        return { materiais, tutores };
    }, [sala.id_sala])

    const { dados, erro, carregando, atualizando, atualizar, tentarNovamente } = useBuscar(buscar);

    const materiais = (dados?.materiais ?? []).filter((m) => !tutor || String(m.tutor.id_tutor_sala) === tutor);

    return (
        <ListaSala
        cabecalho={cabecalho}
        topo={
            <>
                <Text style={styles.ajuda}>Materiais de apoio que os tutores anexaram para os tutorados desta sala.</Text>

                {dados?.tutores && (
                    <Select
                    label="Tutor"
                    options={[
                        { value: "", label: "Todos os tutores" },
                        ...dados.tutores.map((t) => ({ value: String(t.id_tutor_sala), label: t.aluno.nome }))
                    ]}
                    value={tutor}
                    onChange={setTutor}
                    />
                )}

                {dados && <Text style={styles.titulo}>Materiais ({materiais.length})</Text>}
            </>
        }
        itens={materiais}
        keyExtractor={(item) => String(item.id_material)}
        renderItem={({ item }) => (
            <ItemMaterial material={item} detalhe={`Enviado por ${item.tutor.nome} em ${formatarData(item.data_envio)}`} />
        )}
        carregando={carregando}
        atualizando={atualizando}
        falhou={!dados}
        erro={erro}
        onAtualizar={atualizar}
        onTentarNovamente={tentarNovamente}
        vazio={tutor ? "Nenhum material enviado por este tutor." : "Nenhum material enviado pelos tutores desta sala."}
        />
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
