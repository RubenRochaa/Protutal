"use client"

import styles from './styles.module.scss'
import pagina from '../../../../pagina.module.scss'
import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card } from '@/components/card'
import { Input } from '@/components/input'
import { Select } from '@/components/select'
import { Textarea } from '@/components/textarea'
import { Button } from '@/components/button'
import { Botao } from '@/components/botao'
import { handleCriarAtividade } from '../../../../actions'

interface Opcao {
    valor: string;
    rotulo: string;
}

interface Props {
    idTutoria: number;
    conteudos: Opcao[];
    tipos: Opcao[];
}

const OPCOES_ETAPA = [
    { valor: "1", rotulo: "1ª etapa" },
    { valor: "2", rotulo: "2ª etapa" },
    { valor: "3", rotulo: "3ª etapa" },
]

// Mensagem da T9 quando o professor não liberou (pode_criar_ativ = false)
const MSG_SEM_PERMISSAO = "O professor não liberou a criação de atividades"

// Mesmas regras da T9, conferidas antes de enviar. O prazo é horário de São Paulo (UTC-3)
function validar(dados: FormData): string | null {
    const titulo = String(dados.get("titulo") ?? "").trim()
    const prazo = String(dados.get("prazo") ?? "")

    if(!dados.get("id_conteudo")) return "Escolha o conteúdo da atividade."
    if(titulo === "") return "O campo titulo é obrigatório"
    if(titulo.length > 150) return "O titulo deve ter no máximo 150 caracteres"
    if(!dados.get("tipo")) return "Escolha o tipo da atividade."
    if(!dados.get("etapa")) return "Escolha a etapa."
    if(prazo === "") return "O campo prazo é obrigatório"

    const data = new Date(`${prazo}:00-03:00`)
    if(Number.isNaN(data.getTime())) return "O campo prazo deve ser uma data válida"
    if(data <= new Date()) return "O prazo deve ser uma data futura"

    return null
}

// Formulário do print 5 com os campos que a API exige e o print não tinha
// (conteúdo, tipo e etapa). Envia pela Server Action (T9) e abre o detalhe da atividade criada
export function FormAtividade({ idTutoria, conteudos, tipos }: Props){
    const router = useRouter();
    const [estado, formAction] = useActionState(handleCriarAtividade, {});
    const [semPermissao, setSemPermissao] = useState(false);

    useEffect(() => {
        if(estado.error){
            toast.error(estado.error);
            if(estado.error === MSG_SEM_PERMISSAO) setSemPermissao(true);
        }

        if(estado.sucesso){
            toast.success(estado.sucesso);
            if(estado.redirecionar) router.push(estado.redirecionar);
        }
    }, [estado, router]);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>){
        const erro = validar(new FormData(e.currentTarget));

        if(erro){
            e.preventDefault();
            toast.error(erro);
        }
    }

    const valores = estado.valores

    return (
        <>
            {semPermissao && (
                <p className={pagina.aviso} role="alert">
                    O professor não liberou a criação de atividades nesta sala. Fale com ele para liberar.
                </p>
            )}

            <Card className={styles.card}>
                <form action={formAction} onSubmit={handleSubmit} className={styles.form} noValidate>
                    <input type="hidden" name="id_tutoria" value={idTutoria} />

                    <Input
                    label="Nome"
                    name="titulo"
                    placeholder="Insira o nome da atividade"
                    maxLength={150}
                    defaultValue={valores?.titulo}
                    />

                    <Select label="Conteúdo" name="id_conteudo" opcoes={conteudos} placeholder="Escolha o conteúdo" defaultValue={valores?.id_conteudo} />

                    <div className={styles.linha}>
                        <Select label="Tipo" name="tipo" opcoes={tipos} placeholder="Escolha o tipo" defaultValue={valores?.tipo} />
                        <Select label="Etapa" name="etapa" opcoes={OPCOES_ETAPA} placeholder="Escolha a etapa" defaultValue={valores?.etapa} />
                    </div>

                    <Input
                    label="Prazo de entrega"
                    name="prazo"
                    type="datetime-local"
                    defaultValue={valores?.prazo}
                    />

                    <Textarea
                    label="Descrição (opcional)"
                    name="descricao"
                    placeholder="Insira a descrição da tarefa"
                    defaultValue={valores?.descricao}
                    />

                    <div className={styles.acoes}>
                        <Button name="Enviar" nameCarregando="Enviando..." />
                        <Botao variante="secundario" href="/tutor/atividades">Cancelar</Botao>
                    </div>
                </form>
            </Card>
        </>
    )
}
