import { buscarTutorias } from '../buscas'

// Não existe rota de detalhe de tutoria: buscamos a lista do aluno (A3) e procuramos o id da URL.
// O id vem como texto e sem tratar (ex.: "abc"): se não bater com nenhuma tutoria, "tutoria" vem null
export async function buscarTutoria(id: string){
    const resultado = await buscarTutorias()

    if("erro" in resultado) return resultado

    return { tutoria: resultado.dados.find((item) => String(item.id_tutoria) === id) ?? null }
}
