import { AuthLayout } from '@/components/authLayout'
import { FormCadastro } from './components/formCadastro'

export default function Cadastro() {
  return (
    <AuthLayout aba="cadastrar">
      <FormCadastro />
    </AuthLayout>
  )
}
