"use client"

import styles from './styles.module.scss'
import { useEffect, useRef } from 'react'
import { formatarDataHora } from '@/lib/formatacao'
import { MensagemTutoria } from '@/lib/types'
import { AvatarIniciais } from '../../../../../components/avatarIniciais'
import { SeloStatus } from '../../../../../components/seloStatus'

interface Props {
    // Já em ordem cronológica (a O2 manda da mais antiga para a mais recente)
    mensagens: MensagemTutoria[];
}

// Bolhas do chat, como no print: as do aluno à direita ("Você"), as do tutor à esquerda (com o nome).
// Precisa rodar no navegador só para descer a rolagem até a última mensagem
export function ListaMensagens({ mensagens }: Props){
    const listaRef = useRef<HTMLOListElement>(null);

    // Abriu a tela, enviou ou atualizou: mostra a mensagem mais recente
    useEffect(() => {
        const lista = listaRef.current;
        if(lista) lista.scrollTop = lista.scrollHeight;
    }, [mensagens]);

    return (
        <ol ref={listaRef} className={styles.lista} aria-label="Mensagens da tutoria">
            {mensagens.map((mensagem) => {
                const minha = mensagem.remetente.tipo === "tutorado"
                const classesBolha = [
                    styles.bolha,
                    mensagem.assunto ? styles.comunicado : "",
                ].join(" ")

                return (
                    <li key={mensagem.id_mensagem} className={minha ? `${styles.item} ${styles.minha}` : styles.item}>
                        {!minha && <AvatarIniciais nome={mensagem.remetente.nome} />}

                        <div className={styles.corpo}>
                            <p className={styles.autor}>{minha ? "Você" : mensagem.remetente.nome}</p>

                            <div className={classesBolha}>
                                {mensagem.assunto && (
                                    <div className={styles.cabecalho}>
                                        <SeloStatus texto="Comunicado" cor="vermelho" />
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
