import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import { Janela } from "../../../components/Janela";
import { Input } from "../../../components/Input";
import { Avatar } from "../../../components/Avatar";
import { Button } from "../../../components/Button";
import { ToastContext } from "../../../contexts/ToastContext";

import { api } from "../../../services/api";
import { getErrorMessage, getErrorStatus } from "../../../lib/getErrorMessage";
import { AlunoSala } from "../../../lib/types";
import { colors, fonts, fontSizes, spacing } from "../../../styles/theme";

// Menos que isso traz quase todos os alunos do sistema: nem chama a API
const MINIMO_BUSCA = 2;
// Espera depois da última tecla antes de buscar, para não chamar a API a cada letra
const ESPERA_MS = 300;

type Busca =
    | { situacao: "curta" }
    | { situacao: "buscando" }
    | { situacao: "pronta"; alunos: AlunoSala[] }
    | { situacao: "erro" };

interface ModalMatriculaProps {
    idSala: number;
    visivel: boolean;
    // Ids dos alunos que já estão na sala (P23)
    matriculados: number[];
    onClose: () => void;
    onMatriculado: () => void;
}

// Modal "Adicionar alunos" do site (alunos/components/modalMatricula):
// busca por nome ou e-mail (P21 - GET /alunos?busca=) e matricula (P22 - POST /salas/:id/matriculas).
// A API recusa aluno já matriculado nesta sala ou em outra sala do mesmo ano letivo (409)
export function ModalMatricula({ idSala, visivel, matriculados, onClose, onMatriculado }: ModalMatriculaProps){
    const { showToast } = useContext(ToastContext);

    const [termo, setTermo] = useState("");
    const [busca, setBusca] = useState<Busca>({ situacao: "curta" });
    // Aluno sendo matriculado agora (um por vez) e os matriculados enquanto o modal está aberto
    const [enviando, setEnviando] = useState<number | null>(null);
    const [novos, setNovos] = useState<number[]>([]);

    // Número da última busca: a resposta de uma busca antiga é descartada
    const ultimaBusca = useRef(0);

    useEffect(() => {
        const texto = termo.trim();
        const numero = ++ultimaBusca.current;

        if(texto.length < MINIMO_BUSCA){
            setBusca({ situacao: "curta" });
            return;
        }

        setBusca({ situacao: "buscando" });

        const espera = setTimeout(async () => {
            try {
                const alunos = (await api.get<AlunoSala[]>("/alunos", { params: { busca: texto } })).data;
                if(numero !== ultimaBusca.current) return;

                setBusca({ situacao: "pronta", alunos });
            } catch(err) {
                if(numero !== ultimaBusca.current) return;

                if(getErrorStatus(err) !== 401) showToast("erro", getErrorMessage(err));
                setBusca({ situacao: "erro" });
            }
        }, ESPERA_MS);

        // Nova tecla antes dos 300 ms: cancela a busca agendada
        return () => clearTimeout(espera);
    }, [termo, showToast])

    function fechar(){
        // Cada abertura começa limpa
        setTermo("");
        setNovos([]);
        onClose();
    }

    async function matricular(aluno: AlunoSala){
        setEnviando(aluno.id_aluno);

        try {
            await api.post(`/salas/${idSala}/matriculas`, { id_aluno: aluno.id_aluno });

            showToast("sucesso", `${aluno.nome}: Aluno matriculado com sucesso!`);
            setNovos((atual) => [...atual, aluno.id_aluno]);
            onMatriculado();
        } catch(err) {
            if(getErrorStatus(err) !== 401) showToast("erro", getErrorMessage(err));
        } finally {
            setEnviando(null);
        }
    }

    function jaMatriculado(idAluno: number){
        return matriculados.includes(idAluno) || novos.includes(idAluno);
    }

    return (
        <Janela visivel={visivel} titulo="Adicionar alunos" onClose={fechar}>
            <Input
            label="Buscar aluno pelo nome ou e-mail"
            placeholder="Ex.: Ana"
            autoCapitalize="none"
            autoCorrect={false}
            value={termo}
            onChangeText={setTermo}
            icon="search"
            />

            {busca.situacao === "curta" && <Text style={styles.aviso}>Digite pelo menos {MINIMO_BUSCA} letras para buscar.</Text>}
            {busca.situacao === "buscando" && <Text style={styles.aviso}>Buscando...</Text>}
            {busca.situacao === "erro" && <Text style={styles.aviso}>Não foi possível buscar. Tente digitar de novo.</Text>}
            {busca.situacao === "pronta" && busca.alunos.length === 0 && (
                <Text style={styles.aviso}>Nenhum aluno encontrado. Confira o nome ou o e-mail.</Text>
            )}

            {busca.situacao === "pronta" && busca.alunos.map((aluno) => {
                const naSala = jaMatriculado(aluno.id_aluno);
                const carregando = enviando === aluno.id_aluno;

                return (
                    <View key={aluno.id_aluno} style={styles.item}>
                        <View style={styles.linha}>
                            <Avatar nome={aluno.nome} />
                            <View style={styles.dados}>
                                <Text style={styles.nome}>{aluno.nome}</Text>
                                <Text style={styles.email}>{aluno.email}</Text>
                            </View>
                        </View>

                        <Button
                        title={naSala ? "Já matriculado" : "Matricular"}
                        titleLoading="Matriculando..."
                        loading={carregando}
                        disabled={naSala || enviando !== null}
                        onPress={() => matricular(aluno)}
                        />
                    </View>
                )
            })}
        </Janela>
    )
}

const styles = StyleSheet.create({
    aviso:{
        fontFamily: fonts.regular,
        fontSize: 14,
        color: colors.gray700
    },
    item:{
        gap: spacing.sm,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray300
    },
    linha:{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.md
    },
    dados:{
        flex: 1
    },
    nome:{
        fontFamily: fonts.semibold,
        fontSize: fontSizes.base,
        color: colors.black
    },
    email:{
        fontFamily: fonts.regular,
        fontSize: 13,
        color: colors.gray700
    }
})
