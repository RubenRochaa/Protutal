import { Botao } from '@/components/botao'
import { QuadroErro } from '@/components/telaErro'

// A A2 recusou a atividade: não existe (404), não é do aluno (403) ou o id é inválido (400).
// Também aparece quem é o tutor criador, até a visão dele existir (lote B3).
// Sem toast: a mensagem fica no quadro (com o mascote), com o caminho de volta para a lista
export function AtividadeIndisponivel(){
    return (
        <QuadroErro mensagem="Atividade não encontrada ou você não tem acesso a ela.">
            <Botao href="/aluno/atividades">Voltar para Minhas atividades</Botao>
        </QuadroErro>
    )
}
