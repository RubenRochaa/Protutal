"use client"

import styles from './styles.module.scss'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight, Plus } from 'lucide-react'
import { Sala } from '@/lib/types'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { Modal } from '@/components/modal'
import { FormNovaSala } from '../formNovaSala'

interface Props {
    salas: Sala[];
}

// Valor dos selects que significa "sem filtro"
const TODAS = "todas"

const OPCOES_SERIE = [
    { valor: TODAS, rotulo: "Todas" },
    { valor: "1", rotulo: "1ª série" },
    { valor: "2", rotulo: "2ª série" },
    { valor: "3", rotulo: "3ª série" },
]

// Lista com filtro (modelo para as outras telas de lista).
// Os dados chegam prontos do servidor (page.tsx); aqui só filtramos na memória,
// porque a rota P20 não tem filtros. Nenhuma chamada à API sai do navegador.
export function ListaSalas({ salas }: Props){
    const [busca, setBusca] = useState("");
    const [serie, setSerie] = useState(TODAS);
    const [ano, setAno] = useState(TODAS);
    const [modalAberto, setModalAberto] = useState(false);

    // Anos que aparecem nas salas, do mais novo para o mais antigo
    const anos = [...new Set(salas.map((sala) => sala.ano_letivo))].sort((a, b) => b - a);
    const opcoesAno = [
        { valor: TODAS, rotulo: "Todos" },
        ...anos.map((a) => ({ valor: String(a), rotulo: String(a) })),
    ];

    const salasFiltradas = salas.filter((sala) =>
        sala.nome.toLowerCase().includes(busca.trim().toLowerCase()) &&
        (serie === TODAS || String(sala.serie) === serie) &&
        (ano === TODAS || String(sala.ano_letivo) === ano)
    );

    function limparFiltros(){
        setBusca("");
        setSerie(TODAS);
        setAno(TODAS);
    }

    return (
        <div className={styles.container}>
            <div className={styles.topo}>
                {salas.length > 0 && (
                    <div className={styles.filtros}>
                        <Input
                        label="Buscar pelo nome"
                        name="busca"
                        type="search"
                        placeholder="Ex.: 2º A"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        />

                        <Select
                        label="Série"
                        name="filtro_serie"
                        opcoes={OPCOES_SERIE}
                        value={serie}
                        onChange={(e) => setSerie(e.target.value)}
                        />

                        <Select
                        label="Ano letivo"
                        name="filtro_ano"
                        opcoes={opcoesAno}
                        value={ano}
                        onChange={(e) => setAno(e.target.value)}
                        />
                    </div>
                )}

                <button type="button" className={styles.botao} onClick={() => setModalAberto(true)}>
                    <Plus size={20} aria-hidden="true" />
                    Nova sala
                </button>
            </div>

            {salas.length === 0 ? (
                <EmptyState mensagem={`Você ainda não tem salas. Clique em "Nova sala" para criar a primeira.`} />
            ) : salasFiltradas.length === 0 ? (
                <div className={styles.semResultado}>
                    <EmptyState mensagem="Nenhuma sala encontrada com esses filtros. Limpe os filtros para ver todas." />
                    <button type="button" className={styles.botaoSecundario} onClick={limparFiltros}>
                        Limpar filtros
                    </button>
                </div>
            ) : (
                <ul className={styles.lista}>
                    {salasFiltradas.map((sala) => (
                        <li key={sala.id_sala}>
                            {/* Cada sala leva para a tela de detalhe (rota P1) */}
                            <Link href={`/professor/salas/${sala.id_sala}`} className={styles.link}>
                                <ListItem direita={<ChevronRight size={20} aria-hidden="true" />}>
                                    <span className={styles.nome}>{sala.nome}</span>
                                    <span className={styles.detalhe}>
                                        {sala.serie}ª série · {sala.ano_letivo}
                                    </span>
                                </ListItem>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <Modal aberto={modalAberto} onFechar={() => setModalAberto(false)} titulo="Nova sala">
                {/* Só monta o formulário com o modal aberto: cada abertura começa limpa */}
                {modalAberto && <FormNovaSala onSucesso={() => setModalAberto(false)} />}
            </Modal>
        </div>
    )
}
