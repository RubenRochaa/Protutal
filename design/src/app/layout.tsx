import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google"
import "./globals.scss";
import { ProvedorAcessibilidade } from "@/lib/acessibilidade";
import { SCRIPT_ACESSIBILIDADE } from "@/lib/acessibilidadeConfig";
import { ToasterTema } from "@/components/acessibilidade/toasterTema";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Protutal",
  description: "Tutoria entre alunos da rede SESI",
};

// Celular: a página usa a largura real da tela. O zoom continua liberado (acessibilidade).
// themeColor pinta a barra do navegador no Android com o vermelho do Protutal (--red-700)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#C00000",
};

export default function RootLayout({
  children,
}: Readonly <{
  children: React.ReactNode;
}>) {
  // suppressHydrationWarning: o script do <head> coloca data-tema, data-daltonico e data-fonte
  // no <html> antes do React carregar, e eles não existem no HTML do servidor
  return (
    <html lang="pt-BR" className={poppins.variable} suppressHydrationWarning>
      <head>
        {/* Acessibilidade: aplica as escolhas salvas antes da página aparecer (sem piscar o tema) */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_ACESSIBILIDADE }} />
      </head>
      <body>
        <ProvedorAcessibilidade>
          <ToasterTema />
          {children}
        </ProvedorAcessibilidade>
      </body>
    </html>
  );
}
