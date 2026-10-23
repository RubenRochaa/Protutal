import { AuthLayout } from '@/components/authLayout'
import { FormLogin } from './components/formLogin'

export default function Page() {
  return (
    <AuthLayout aba="entrar">
      <FormLogin />
    </AuthLayout>
  )
}
