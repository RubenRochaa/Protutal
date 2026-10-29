import { NextRequest, NextResponse } from 'next/server'
import { isAxiosError } from 'axios'
import { api } from '@/services/api'
import { getCookieServer, getPerfilServer } from '@/lib/cookieServer'
import { getErrorMessage, MSG_SESSAO_EXPIRADA } from '@/lib/getErrorMessage'

// Filtros que a P15 aceita (os mesmos da P14). Qualquer outro parâmetro é ignorado
const FILTROS = ["etapa", "id_conteudo", "id_aluno", "id_tutor_sala"]

interface Contexto {
    params: Promise<{ id_sala: string }>;
}

// Download do Excel de notas (rota P15 - GET /salas/:id/notas/exportar).
// O navegador não consegue ler o token (cookie httpOnly), então ele chama este Route Handler:
// aqui no servidor lemos o cookie, chamamos a API e devolvemos o arquivo com os cabeçalhos dela.
// Em erro, devolve { error } em JSON com o mesmo status, para a tela mostrar no toast.
export async function GET(req: NextRequest, { params }: Contexto){
    const { id_sala } = await params
    const token = await getCookieServer()
    const perfil = await getPerfilServer()

    if(!token || perfil !== "professor") return NextResponse.json({ error: MSG_SESSAO_EXPIRADA }, { status: 401 });

    const filtros: Record<string, string> = {}
    for(const nome of FILTROS){
        const valor = req.nextUrl.searchParams.get(nome)
        if(valor) filtros[nome] = valor
    }

    try {
        const response = await api.get<ArrayBuffer>(`/salas/${encodeURIComponent(id_sala)}/notas/exportar`, {
            params: filtros,
            responseType: "arraybuffer",
            headers: { Authorization: `Bearer ${token}` }
        })

        return new NextResponse(response.data, {
            status: 200,
            headers: {
                "Content-Type": String(response.headers["content-type"] ?? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
                // O nome do arquivo vem da API (ex.: notas_2_A_2026.xlsx)
                "Content-Disposition": String(response.headers["content-disposition"] ?? `attachment; filename="notas.xlsx"`),
            }
        })
    } catch(err) {
        // Com responseType "arraybuffer", o erro { error } da API também chega em bytes
        // (no Node, como Buffer): convertemos para JSON para o getErrorMessage ler a mensagem
        const bytes = isAxiosError(err) ? err.response?.data : undefined
        if(isAxiosError(err) && err.response && (Buffer.isBuffer(bytes) || bytes instanceof ArrayBuffer)){
            try {
                const texto = Buffer.isBuffer(bytes) ? bytes.toString("utf-8") : Buffer.from(bytes).toString("utf-8")
                err.response.data = JSON.parse(texto)
            } catch {
                err.response.data = {}
            }
        }

        const status = isAxiosError(err) && err.response ? err.response.status : 503

        return NextResponse.json({ error: getErrorMessage(err) }, { status })
    }
}
