import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "@fontsource/manrope/latin-400.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
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
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Emmanuel",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1E293B",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const usuario = cookieStore.get("fe_usuario")?.value || "";

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var m = document.cookie.match(/(?:^|;\\s*)fe_usuario=([^;]+)/);
                  var u = m ? decodeURIComponent(m[1]).toLowerCase() : 'general';
                  var t = localStorage.getItem('fe_theme_' + u) || 'emmanuel';
                  var map = {
                    emmanuel: { c: '#FACC15', h: '#EAB308', t: '#0F172A', l: '#FEF9C3', b: '#FDE047', r: 'rgba(234, 179, 8, 0.25)', ha: '#EAB308', hbg: '#FEFCE8', hsub: '#FEF9C3', hbrd: '#FDE047', hinp: '#FFFFFF', htx: '#713F12', htxm: '#A16207', hic: '#713F12' },
                    azul: { c: '#2563EB', h: '#1D4ED8', t: '#FFFFFF', l: '#EFF6FF', b: '#BFDBFE', r: 'rgba(37, 99, 235, 0.25)', ha: '#2563EB', hbg: '#EFF6FF', hsub: '#DBEAFE', hbrd: '#BFDBFE', hinp: '#FFFFFF', htx: '#1E3A8A', htxm: '#1D4ED8', hic: '#1E3A8A' },
                    esmeralda: { c: '#059669', h: '#047857', t: '#FFFFFF', l: '#F0FDF4', b: '#A7F3D0', r: 'rgba(5, 150, 105, 0.25)', ha: '#059669', hbg: '#F0FDF4', hsub: '#DCFCE7', hbrd: '#A7F3D0', hinp: '#FFFFFF', htx: '#064E3B', htxm: '#047857', hic: '#064E3B' },
                    rosa: { c: '#DB2777', h: '#BE185D', t: '#FFFFFF', l: '#FDF2F8', b: '#FBCFE8', r: 'rgba(219, 39, 119, 0.25)', ha: '#DB2777', hbg: '#FDF2F8', hsub: '#FCE7F3', hbrd: '#FBCFE8', hinp: '#FFFFFF', htx: '#831843', htxm: '#9D174D', hic: '#831843' },
                    lila: { c: '#7C3AED', h: '#6D28D9', t: '#FFFFFF', l: '#F5F3FF', b: '#DDD6FE', r: 'rgba(124, 58, 237, 0.25)', ha: '#7C3AED', hbg: '#F5F3FF', hsub: '#EDE9FE', hbrd: '#DDD6FE', hinp: '#FFFFFF', htx: '#4C1D95', htxm: '#5B21B6', hic: '#4C1D95' },
                    naranja: { c: '#EA580C', h: '#C2410C', t: '#FFFFFF', l: '#FFF7ED', b: '#FED7AA', r: 'rgba(234, 88, 12, 0.25)', ha: '#EA580C', hbg: '#FFF7ED', hsub: '#FFEDD5', hbrd: '#FED7AA', hinp: '#FFFFFF', htx: '#7C2D12', htxm: '#9A3412', hic: '#7C2D12' }
                  };
                  var s = map[t] || map.emmanuel;
                  var r = document.documentElement;
                  r.style.setProperty('--theme-primary', s.c);
                  r.style.setProperty('--theme-primary-hover', s.h);
                  r.style.setProperty('--theme-primary-contrast', s.t);
                  r.style.setProperty('--theme-accent-light', s.l);
                  r.style.setProperty('--theme-accent-border', s.b);
                  r.style.setProperty('--theme-ring', s.r);
                  r.style.setProperty('--theme-header-accent', s.ha);
                  r.style.setProperty('--theme-header-bg', s.hbg);
                  r.style.setProperty('--theme-header-subnav-bg', s.hsub);
                  r.style.setProperty('--theme-header-border', s.hbrd);
                  r.style.setProperty('--theme-header-input-bg', s.hinp);
                  r.style.setProperty('--theme-header-text', s.htx);
                  r.style.setProperty('--theme-header-text-muted', s.htxm);
                  r.style.setProperty('--theme-header-icon', s.hic);
                  r.setAttribute('data-theme', t);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-[#F8FAFC] font-body text-slate-900 antialiased selection:bg-brand-yellow/30 selection:text-slate-900">
        <ToastProvider>
          <ThemeProvider usuarioInicial={usuario}>
            {children}
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
