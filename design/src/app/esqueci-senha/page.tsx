import { AuthLayout } from '@/components/authLayout'
import { FormEsqueciSenha } from './components/formEsqueciSenha'

// Página pública: fora do matcher do middleware.ts, abre com ou sem sessão
export default function EsqueciSenha() {
  return (
    <AuthLayout>
      <FormEsqueciSenha />
    </AuthLayout>
  )
}
