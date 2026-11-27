import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { WakeLockProvider } from "@/components/pwa/WakeLockProvider";
import { resolverTema, generarVariablesCssTema, type TemaId } from "@/lib/theme";
import { getAuthRepository } from "@/lib/repositories";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ferreteriaemmanuel.com.ni"),
  title: {
    default: "Ferretería Emmanuel",
    template: "%s · Ferretería Emmanuel",
  },
  description: "Sistema Integral de Gestión Comercial, Punto de Venta (POS) y Control de Bodega de Ferretería Emmanuel.",
  applicationName: "Ferretería Emmanuel",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Emmanuel",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F172A",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const usuario = cookieStore.get("fe_usuario")?.value || "";
  let temaId = cookieStore.get("fe_tema")?.value as TemaId | undefined;

  if (!temaId && usuario) {
    try {
      const repo = getAuthRepository();
      if ("obtenerTemaUsuario" in repo && typeof repo.obtenerTemaUsuario === "function") {
        temaId = (await repo.obtenerTemaUsuario(usuario)) as TemaId;
      }
    } catch {
      temaId = "emmanuel";
    }
  }

  const temaConfig = resolverTema(temaId || "emmanuel");
  const cssVariables = generarVariablesCssTema(temaConfig);

  return (
    <html lang="es" suppressHydrationWarning className="h-full" data-theme={temaConfig.id}>
      <head>
        <style id="fe-theme-inline" dangerouslySetInnerHTML={{ __html: cssVariables }} />
      </head>
      <body className="h-full bg-[#F8FAFC] font-body text-slate-900 antialiased selection:bg-brand-yellow/30 selection:text-slate-900">
        <ToastProvider>
          <ThemeProvider usuarioInicial={usuario} temaInicial={temaConfig.id}>
            <WakeLockProvider>
              <ServiceWorkerRegistrar />
              {children}
            </WakeLockProvider>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
