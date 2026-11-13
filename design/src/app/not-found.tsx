import { getPerfilServer } from '@/lib/cookieServer'
import { Botao } from '@/components/botao'
import { TelaErro } from '@/components/telaErro'
import { BotaoAcessibilidade } from '@/components/acessibilidade'

// 404: rota que não existe. Aparece sem Header (fica fora dos layouts das áreas).
// "Voltar ao início" leva ao início do perfil logado (cookie "perfil") ou ao login
export default async function NaoEncontrada(){
    const perfil = await getPerfilServer()

    return (
        <>
        {/* Sem Header: o botão de Acessibilidade fica no canto superior direito */}
        <BotaoAcessibilidade />
        <TelaErro
        titulo="Página não encontrada"
        mensagem="A página que você procura não existe ou foi movida."
        >
            <Botao href={perfil ? `/${perfil}` : "/"}>Voltar ao início</Botao>
        </TelaErro>
        </>
    )
}
