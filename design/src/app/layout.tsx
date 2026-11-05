import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google"
import "./globals.scss";
import { Toaster } from "sonner";

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
  return (
    <html lang="pt-BR" className={poppins.variable}>
      <body>
        <Toaster
        position="bottom-right"
        richColors
        closeButton
        />
          {children}
        </body>
    </html>
  );
}
