"use client"

import "./globals.scss";
import { Poppins } from "next/font/google"
import { ErroInesperado } from '@/components/erroInesperado'

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

// Erro no próprio layout raiz: esta tela substitui o layout.tsx inteiro,
// por isso tem <html> e <body> próprios e importa o globals.scss. Aparece sem Header
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }){
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body>
        <ErroInesperado error={error} reset={reset} />
      </body>
    </html>
  );
}
