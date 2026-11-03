import { Botao } from '@/components/botao'
import { QuadroErro } from '@/components/telaErro'

// A tutoria do id da URL não está na lista do aluno (A3): não existe, não é dele ou o id é inválido.
// Não há rota de detalhe de tutoria, então o detalhe, o chat e a avaliação procuram na A3.
// Sem toast: a mensagem fica no quadro (com o mascote), com o caminho de volta para a lista
export function TutoriaNaoEncontrada(){
    return (
        <QuadroErro mensagem="Tutoria não encontrada.">
            <Botao href="/aluno/tutoria">Voltar para Minhas tutorias</Botao>
        </QuadroErro>
    )
}
