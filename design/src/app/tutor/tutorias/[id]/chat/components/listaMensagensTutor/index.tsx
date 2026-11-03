"use client"

import styles from './styles.module.scss'
import { useEffect, useRef } from 'react'
import { formatarDataHora } from '@/lib/formatacao'
import { MensagemTutoria } from '@/lib/types'
import { Avatar } from '@/components/avatar'
import { Etiqueta } from '@/components/etiqueta'

interface Props {
    // Já em ordem cronológica (a O2 manda da mais antiga para a mais recente)
    mensagens: MensagemTutoria[];
}

// Bolhas do chat (cópia da lista do aluno com o lado trocado): as do tutor à direita ("Você"),
// as do tutorado à esquerda, com o nome. Roda no navegador só para descer a rolagem
export function ListaMensagensTutor({ mensagens }: Props){
    const listaRef = useRef<HTMLOListElement>(null);

    // Abriu a tela, enviou ou atualizou: mostra a mensagem mais recente
    useEffect(() => {
        const lista = listaRef.current;
        if(lista) lista.scrollTop = lista.scrollHeight;
    }, [mensagens]);

    return (
        <ol ref={listaRef} className={styles.lista} aria-label="Mensagens da tutoria">
            {mensagens.map((mensagem) => {
                const minha = mensagem.remetente.tipo === "tutor"
                const classesBolha = [
                    styles.bolha,
                    mensagem.assunto ? styles.comunicado : "",
                ].join(" ")

                return (
                    <li key={mensagem.id_mensagem} className={minha ? `${styles.item} ${styles.minha}` : styles.item}>
                        {!minha && <Avatar nome={mensagem.remetente.nome} />}

                        <div className={styles.corpo}>
                            <p className={styles.autor}>{minha ? "Você" : mensagem.remetente.nome}</p>

                            <div className={classesBolha}>
                                {mensagem.assunto && (
                                    <div className={styles.cabecalho}>
                                        <Etiqueta cor="destaque">Comunicado</Etiqueta>
                                        <p className={styles.assunto}>{mensagem.assunto}</p>
                                    </div>
                                )}

                                <p className={styles.texto}>{mensagem.texto}</p>
                            </div>

                            <time dateTime={mensagem.data_envio} className={styles.data}>
                                {formatarDataHora(mensagem.data_envio)}
                            </time>
                        </div>
                    </li>
                )
            })}
        </ol>
    )
}
