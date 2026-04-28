import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Planificador de comidas",
  description: "App local para recetas, menú semanal y lista de la compra.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">
        <div className="app-shell">
          <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
            <header className="card-surface sticky top-4 z-20 mb-6 rounded-[2rem] px-4 py-4 backdrop-blur sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href="/" className="text-lg font-extrabold tracking-tight text-foreground">
                    Planificador casero
                  </Link>
                  <p className="text-sm text-muted">
                    Recetas, menú semanal y compra pensados para cocinar con calma.
                  </p>
                </div>
                <nav className="flex flex-wrap gap-2 text-sm font-semibold">
                  <Link
                    href="/recetas"
                    className="rounded-full border border-line bg-surface-strong px-4 py-2 text-foreground hover:-translate-y-0.5 hover:border-accent hover:text-accent-strong"
                  >
                    Recetas
                  </Link>
                  <Link
                    href="/menu"
                    className="rounded-full border border-line bg-surface-strong px-4 py-2 text-foreground hover:-translate-y-0.5 hover:border-accent hover:text-accent-strong"
                  >
                    Menú
                  </Link>
                  <Link
                    href="/compra"
                    className="rounded-full border border-line bg-surface-strong px-4 py-2 text-foreground hover:-translate-y-0.5 hover:border-accent hover:text-accent-strong"
                  >
                    Compra
                  </Link>
                </nav>
              </div>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
