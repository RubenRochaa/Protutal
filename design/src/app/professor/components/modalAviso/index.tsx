"use client"

import lista from '@/app/professor/lista.module.scss'
import { useState } from 'react'
import { toast } from 'sonner'
import { Sala } from '@/lib/types'
import { textoVazio } from '@/lib/validacao'
import { useAcao } from '@/lib/useAcao'
import { Modal } from '@/components/modal'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Textarea } from '@/components/textarea'
import { Botao } from '@/components/botao'
import { handlePublicarAviso } from '../../actions'

interface Props {
    aberto: boolean;
    onFechar: () => void;
    // Dentro da sala: o aviso vai para esta sala
    idSala?: number;
    // Na tela Notificações: o professor escolhe a sala (lista da P20)
    salas?: Sala[];
}

// Mesmo limite do back-end (P3)
const MAX_TITULO = 150

// Modal "Enviar notificação" (Figma p02), adaptado à rota P3 (POST /salas/:id/avisos):
// a API não aceita destinatário (o aviso vai para todos os alunos da sala) e exige um título.
// Por isso "para quem", "ano" e "turma" saíram, e "ano/turma" virou um único select de sala.
export function ModalAviso({ aberto, onFechar, idSala, salas }: Props){
    const [sala, setSala] = useState("");
    const [titulo, setTitulo] = useState("");
    const [recado, setRecado] = useState("");
    const { pendente, executar } = useAcao();

    function fechar(){
        setSala("");
        setTitulo("");
        setRecado("");
        onFechar();
    }

    // Validação no navegador antes de chamar a API (as mesmas regras da P3)
    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        e.preventDefault();
        const destino = idSala ?? Number(sala);

        if(!destino) return toast.error("Escolha a sala do aviso");
        if(textoVazio(titulo)) return toast.error("O campo titulo é obrigatório");
        if(titulo.trim().length > MAX_TITULO) return toast.error(`O título deve ter no máximo ${MAX_TITULO} caracteres`);
        if(textoVazio(recado)) return toast.error("O campo conteudo é obrigatório");

        executar(() => handlePublicarAviso(destino, titulo, recado), fechar);
    }

    return (
        <Modal aberto={aberto} onFechar={fechar} titulo="Enviar aviso para a sala">
            <form onSubmit={handleSubmit} className={lista.form} noValidate>
                {idSala === undefined && (
                    <Select
                    label="Sala"
                    name="aviso_sala"
                    placeholder="Selecione a sala"
                    opcoes={(salas ?? []).map((s) => ({ valor: String(s.id_sala), rotulo: `${s.nome} (${s.ano_letivo})` }))}
                    value={sala}
                    onChange={(e) => setSala(e.target.value)}
                    />
                )}

                <Input
                label="Título"
                name="aviso_titulo"
                placeholder="Ex.: Entrega das atividades da etapa 2"
                maxLength={MAX_TITULO}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                />

                <Textarea
                label="Recado"
                name="aviso_recado"
                placeholder="Escreva o recado para os alunos"
                value={recado}
                onChange={(e) => setRecado(e.target.value)}
                />

                <p className={lista.detalhe}>
                    O aviso aparece para todos os alunos matriculados na sala. Só é possível publicar
                    quando a sala tem pelo menos uma tutoria ativa.
                </p>

                <div className={lista.formAcoes}>
                    <Botao variante="secundario" onClick={fechar} disabled={pendente}>Cancelar</Botao>
                    <Botao type="submit" disabled={pendente}>{pendente ? "Enviando..." : "Enviar"}</Botao>
                </div>
            </form>
        </Modal>
    )
}
