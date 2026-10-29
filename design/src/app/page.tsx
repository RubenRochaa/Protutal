import { AuthLayout } from '@/components/authLayout'
import { FormLogin } from './components/formLogin'

interface Props {
  searchParams: Promise<{ cadastro?: string; sessao?: string }>
}

export default async function Page({ searchParams }: Props) {
  // O cadastro redireciona para "/?cadastro=ok" para o login mostrar o aviso de confirmação.
  // A API respondeu 401 em alguma tela: volta para "/?sessao=expirada" (lib/sessaoExpirada.ts)
  const { cadastro, sessao } = await searchParams

  return (
    <AuthLayout aba="entrar">
      <FormLogin cadastroConcluido={cadastro === "ok"} sessaoExpirada={sessao === "expirada"} />
    </AuthLayout>
  )
}
