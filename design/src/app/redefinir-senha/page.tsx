import { AuthLayout } from '@/components/authLayout'
import { FormRedefinirSenha } from './components/formRedefinirSenha'

interface Props {
  searchParams: Promise<{ token?: string | string[] }>
}

// Página pública aberta pelo link do e-mail (/redefinir-senha?token=...).
// Fora do matcher do middleware.ts: abre com ou sem sessão
export default async function RedefinirSenha({ searchParams }: Props) {
  const { token } = await searchParams

  return (
    <AuthLayout>
      <FormRedefinirSenha token={typeof token === "string" ? token : ""} />
    </AuthLayout>
  )
}
