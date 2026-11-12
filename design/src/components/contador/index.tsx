"use client"

import styles from './styles.module.scss'
import { useEffect } from 'react'
import { useContadores } from '@/lib/useContadores'

interface Props {
    valor?: number;
    // "canto": em cima, à direita do ícone (o pai precisa de position: relative). Sem isso, fica ao lado do texto
    canto?: boolean;
    // "claro": fundo branco e número vermelho, para ficar visível dentro de um botão vermelho
    claro?: boolean;
}

// Texto da bolinha: acima de 9 mostra "9+"
export function textoContador(valor: number){
    return valor > 9 ? "9+" : String(valor)
}

// Texto lido pelo leitor de tela (ex.: "3 novidades")
export function descricaoContador(valor: number){
    return valor === 1 ? "1 novidade" : `${valor} novidades`
}

// Bolinha vermelha com número, como o contador de apps de celular. Com 0 (ou sem valor) não aparece
export function Contador({ valor, canto = false, claro = false }: Props){
    if(!valor || valor <= 0) return null

    const classes = [styles.contador, canto ? styles.canto : "", claro ? styles.claro : ""].join(" ")

    return (
        <span className={classes}>
            <span aria-hidden="true">{textoContador(valor)}</span>
            <span className={styles.leitor}>({descricaoContador(valor)})</span>
        </span>
    )
}

interface ContadorTutoriaProps {
    idTutoria: number;
    // "chat": só as mensagens novas; "total": mensagens + avisos da sala
    tipo: "chat" | "total";
    claro?: boolean;
}

// Bolinha de uma tutoria dentro das telas (cards e botão "Abrir chat"): lê o mesmo resultado do Header
export function ContadorTutoria({ idTutoria, tipo, claro }: ContadorTutoriaProps){
    const { chatPorTutoria, porTutoria } = useContadores()

    return <Contador valor={(tipo === "chat" ? chatPorTutoria : porTutoria)[idTutoria]} claro={claro} />
}

interface MarcarVisitaProps {
    tipo: "notas" | "chat" | "avisos";
    // id_tutoria (chat) ou id_sala (avisos)
    id?: string | number;
}

// Não mostra nada: grava a "última visita" da tela ao abrir, e a mantém em dia enquanto ela estiver aberta
export function MarcarVisita({ tipo, id }: MarcarVisitaProps){
    const { registrarVisita } = useContadores()

    useEffect(() => {
        if(tipo === "notas") return registrarVisita("notas")
        if(id === undefined) return

        return registrarVisita(`${tipo}:${id}`)
    }, [tipo, id, registrarVisita])

    return null
}
