"use client"

import styles from './styles.module.scss'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { AlunoSala } from '@/lib/types'
import { Modal } from '@/components/modal'
import { Input } from '@/components/input'
import { ListItem } from '@/components/listItem'
import { Avatar } from '@/components/avatar'
import { buscarAlunos, handleMatricular } from '../../actions'

interface Props {
    idSala: number;
    aberto: boolean;
    // Ids dos alunos que já estão na sala (P23)
    matriculados: number[];
    onFechar: () => void;
}

// Menos que isso traz quase todos os alunos do sistema: nem chama a API
const MINIMO_BUSCA = 2

// Espera depois da última tecla antes de buscar, para não chamar a API a cada letra
const ESPERA_MS = 300

type Busca =
    | { situacao: "curta" }
    | { situacao: "buscando" }
    | { situacao: "pronta"; alunos: AlunoSala[] }
    | { situacao: "erro" }

// Modal "Adicionar alunos": busca por nome ou e-mail (P21) e matricula (P22).
// As duas chamadas rodam no servidor, pelas Server Actions de ../../actions.
export function ModalMatricula({ idSala, aberto, matriculados, onFechar }: Props){
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
            const resultado = await buscarAlunos(texto);
            if(numero !== ultimaBusca.current) return;

            if("error" in resultado){
                toast.error(resultado.error);
                setBusca({ situacao: "erro" });
                return;
            }

            setBusca({ situacao: "pronta", alunos: resultado.alunos });
        }, ESPERA_MS);

        // Nova tecla antes dos 300 ms: cancela a busca agendada
        return () => clearTimeout(espera);
    }, [termo]);

    function handleFechar(){
        // Cada abertura começa limpa
        setTermo("");
        setNovos([]);
        onFechar();
    }

    async function matricular(aluno: AlunoSala){
        setEnviando(aluno.id_aluno);
        const resultado = await handleMatricular(idSala, aluno.id_aluno);
        setEnviando(null);

        if(resultado.error){
            toast.error(resultado.error);
            return;
        }

        toast.success(`${aluno.nome}: ${resultado.sucesso}`);
        setNovos((atual) => [...atual, aluno.id_aluno]);
    }

    function jaMatriculado(idAluno: number){
        return matriculados.includes(idAluno) || novos.includes(idAluno);
    }

    return (
        <Modal aberto={aberto} onFechar={handleFechar} titulo="Adicionar alunos">
            <div className={styles.conteudo}>
                <Input
                label="Buscar aluno pelo nome ou e-mail"
                name="busca_aluno"
                type="search"
                placeholder="Ex.: Ana"
                autoComplete="off"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                />

                <div aria-live="polite">
                    {busca.situacao === "curta" && (
                        <p className={styles.aviso}>Digite pelo menos {MINIMO_BUSCA} letras para buscar.</p>
                    )}

                    {busca.situacao === "buscando" && <p className={styles.aviso}>Buscando...</p>}

                    {busca.situacao === "erro" && (
                        <p className={styles.aviso}>Não foi possível buscar. Tente digitar de novo.</p>
                    )}

                    {busca.situacao === "pronta" && busca.alunos.length === 0 && (
                        <p className={styles.aviso}>Nenhum aluno encontrado. Confira o nome ou o e-mail.</p>
                    )}
                </div>

                {busca.situacao === "pronta" && busca.alunos.length > 0 && (
                    <ul className={styles.lista}>
                        {busca.alunos.map((aluno) => {
                            const naSala = jaMatriculado(aluno.id_aluno);
                            const carregando = enviando === aluno.id_aluno;

                            return (
                                <li key={aluno.id_aluno}>
                                    <ListItem
                                    inicio={<Avatar nome={aluno.nome} />}
                                    direita={
                                        <button
                                        type="button"
                                        className={naSala ? styles.botaoMatriculado : styles.botao}
                                        disabled={naSala || enviando !== null}
                                        onClick={() => matricular(aluno)}
                                        >
                                            {naSala ? "Já matriculado" : carregando ? "Matriculando..." : "Matricular"}
                                        </button>
                                    }
                                    >
                                        <span className={styles.nome}>{aluno.nome}</span>
                                        <span className={styles.email}>{aluno.email}</span>
                                    </ListItem>
                                </li>
                            )
                        })}
                    </ul>
                )}
            </div>
        </Modal>
    )
}
