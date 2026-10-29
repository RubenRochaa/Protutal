import { AuthLayout } from '@/components/authLayout'
import { FormLogin } from './components/formLogin'

interface Props {
  searchParams: Promise<{ cadastro?: string }>
}

export default async function Page({ searchParams }: Props) {
  // O cadastro redireciona para "/?cadastro=ok" para o login mostrar o aviso de confirmação
  const { cadastro } = await searchParams

  return (
    <AuthLayout aba="entrar">
      <FormLogin cadastroConcluido={cadastro === "ok"} />
    </AuthLayout>
  )
}
