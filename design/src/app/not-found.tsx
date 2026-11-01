import { getPerfilServer } from '@/lib/cookieServer'
import { Botao } from '@/components/botao'
import { TelaErro } from '@/components/telaErro'

// 404: rota que não existe. Aparece sem Header (fica fora dos layouts das áreas).
// "Voltar ao início" leva ao início do perfil logado (cookie "perfil") ou ao login
export default async function NaoEncontrada(){
    const perfil = await getPerfilServer()

    return (
        <TelaErro
        titulo="Página não encontrada"
        mensagem="A página que você procura não existe ou foi movida."
        >
            <Botao href={perfil ? `/${perfil}` : "/"}>Voltar ao início</Botao>
        </TelaErro>
    )
}
