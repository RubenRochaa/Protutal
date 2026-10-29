"use client"

import styles from './styles.module.scss'
import lista from '@/app/professor/lista.module.scss'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { ConteudoSala } from '@/lib/types'
import { textoVazio } from '@/lib/validacao'
import { useAcao } from '@/lib/useAcao'
import { Card } from '@/components/card'
import { Input } from '@/components/input'
import { ListItem } from '@/components/listItem'
import { EmptyState } from '@/components/emptyState'
import { Modal } from '@/components/modal'
import { Botao } from '@/components/botao'
import { toast } from 'sonner'
import { handleCadastrarConteudo } from '@/app/professor/actions'

interface Props {
    idSala: number;
    conteudos: ConteudoSala[];
}

// Mesmo limite do back-end (P25)
const MAX_NOME = 100

// Lista de conteúdos com busca na memória (a P2 não tem filtro) e o botão "Novo conteúdo"
export function ListaConteudos({ idSala, conteudos }: Props){
    const [busca, setBusca] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [nome, setNome] = useState("");
    const { pendente, executar } = useAcao();

    const filtrados = conteudos.filter((c) => c.nome.toLowerCase().includes(busca.trim().toLowerCase()));

    function fecharModal(){
        setNome("");
        setModalAberto(false);
    }

    // Validação no navegador antes de chamar a API (as mesmas regras da P25)
    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();

        if(textoVazio(nome)) return toast.error("O campo nome é obrigatório");
        if(nome.trim().length > MAX_NOME) return toast.error(`O nome deve ter no máximo ${MAX_NOME} caracteres`);

        executar(() => handleCadastrarConteudo(idSala, nome), fecharModal);
    }

    return (
        <div className={lista.tela}>
            <p className={lista.ajuda}>
                Cadastre aqui os conteúdos de Geografia trabalhados nesta sala (ex.: &quot;Relevo brasileiro&quot;).
                Os tutores escolhem um destes conteúdos ao criar cada atividade.
            </p>

            <div className={lista.topo}>
                {conteudos.length > 0 && (
                    <div className={styles.busca}>
                        <Input
                        label="Buscar conteúdo"
                        name="busca_conteudo"
                        type="search"
                        placeholder="Ex.: Clima"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                )}

                <Botao onClick={() => setModalAberto(true)}>
                    <Plus size={20} aria-hidden="true" />
                    Novo conteúdo
                </Botao>
            </div>

            <Card titulo={`Conteúdos (${conteudos.length})`} sublinhado>
                {conteudos.length === 0 ? (
                    <EmptyState mensagem={`A sala ainda não tem conteúdos. Clique em "Novo conteúdo" para cadastrar o primeiro.`} />
                ) : filtrados.length === 0 ? (
                    <EmptyState mensagem="Nenhum conteúdo encontrado com essa busca." />
                ) : (
                    <ul className={styles.grade}>
                        {filtrados.map((conteudo) => (
                            <li key={conteudo.id_conteudo}>
                                <ListItem><span className={lista.nome}>{conteudo.nome}</span></ListItem>
                            </li>
                        ))}
                    </ul>
                )}
            </Card>

            <Modal aberto={modalAberto} onFechar={fecharModal} titulo="Novo conteúdo">
                <form onSubmit={handleSubmit} className={lista.form} noValidate>
                    <Input
                    label="Nome do conteúdo"
                    name="nome_conteudo"
                    placeholder="Ex.: Relevo brasileiro"
                    maxLength={MAX_NOME}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    />
                    <p className={lista.detalhe}>
                        Se outra sala já cadastrou um conteúdo com o mesmo nome, ele é reaproveitado.
                    </p>

                    <div className={lista.formAcoes}>
                        <Botao variante="secundario" onClick={fecharModal} disabled={pendente}>Cancelar</Botao>
                        <Botao type="submit" disabled={pendente}>{pendente ? "Cadastrando..." : "Cadastrar"}</Botao>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
