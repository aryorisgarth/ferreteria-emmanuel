"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Lock,
  Package,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  User,
  Users,
} from "lucide-react";
import { loginAction, solicitarRecuperacionAction } from "@/app/actions";
import type { ResultadoAccion } from "@/app/actions/helpers";
import { FormularioSolicitarRecuperacion } from "./FormularioSolicitarRecuperacion";
import { HouseMark, Logo } from "@/components/marca/Logo";
import { Modal } from "@/components/ui/Modal";

interface FormularioLoginProps {
  errorInicial?: string;
  volverUrl?: string;
}

const estadoInicial: ResultadoAccion = null;

export function FormularioLogin({ errorInicial, volverUrl = "/inicio" }: FormularioLoginProps) {
  const [estado, formAction, pendiente] = useActionState(loginAction, estadoInicial);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [mostrarClave, setMostrarClave] = useState(false);
  const [recordar, setRecordar] = useState(true);

  // Modal de recuperación
  const [modalRecuperar, setModalRecuperar] = useState(false);
  const [recuperacionEstado, setRecuperacionEstado] = useState<{
    ok?: boolean;
    mensaje?: string;
    error?: string;
  } | null>(null);
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false);

  // Cuentas rápidas de acceso
  const cuentasDemo = [
    { label: "Caja / Mostrador", user: "cajero", pass: "caja123", icon: ShoppingCart, desc: "Cobros y tickets" },
    { label: "Bodega / Almacén", user: "bodega", pass: "bodega123", icon: Package, desc: "Kárdex y existencias" },
    { label: "Administrador", user: "admin", pass: "admin123", icon: ShieldCheck, desc: "Control total y ajustes" },
  ];

  const cargarCredenciales = (u: string, p: string) => {
    setUsuario(u);
    setClave(p);
  };

  const errorMostrar = estado?.error || errorInicial;

  return (
    <div className="flex min-h-dvh w-full flex-col lg:flex-row bg-slate-100">
      {/* 1. LADO IZQUIERDO: Hero / Showcase Institucional (Visible en PC y Tablet) */}
      <div className="relative hidden w-full lg:flex lg:w-1/2 flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-8 xl:p-14 text-white overflow-hidden border-r border-slate-800">
        {/* Patrón de fondo geométrico sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

        {/* Header superior */}
        <div className="relative z-10 flex items-center justify-between">
          <Logo variante="light" className="h-11 xl:h-12 w-auto" prioridad />
          <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-bold text-brand-yellow border border-slate-700">
            Versión 2.0 · Nicaragua
          </span>
        </div>

        {/* Mensaje Principal y Propuesta de Valor */}
        <div className="relative z-10 my-auto py-10 max-w-lg space-y-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-brand-yellow border border-amber-500/20">
              <Building2 size={14} /> Ferretería Emmanuel
            </span>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Sistema Integral de Gestión Comercial y Control de Bodega
            </h1>
            <p className="text-sm xl:text-base text-slate-400 leading-relaxed">
              Administración unificada de mostrador, cobros en Córdobas (C$), facturación con RUC, auditoría de kárdex y despachos de almacén.
            </p>
          </div>

          {/* Tres Pilares Operativos */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3.5 rounded-xl bg-slate-800/40 p-3.5 border border-slate-800/80 backdrop-blur-xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-brand-yellow font-bold">
                <ShoppingCart size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Punto de Venta POS de Alto Rendimiento</p>
                <p className="text-[11px] text-slate-400">Cobro rápido en efectivo con cálculo de vuelto, transferencias y control de fiados.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl bg-slate-800/40 p-3.5 border border-slate-800/80 backdrop-blur-xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                <Package size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Kárdex y Existencias en Tiempo Real</p>
                <p className="text-[11px] text-slate-400">Control estricto de entradas, salidas y alertas inmediatas de mercadería en nivel crítico.</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl bg-slate-800/40 p-3.5 border border-slate-800/80 backdrop-blur-xs">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 font-bold">
                <Receipt size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-200">Cotizaciones Formales y Facturación RUC</p>
                <p className="text-[11px] text-slate-400">Emisión de cotizaciones a contratistas convertibles a factura en 1 solo clic.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Institucional */}
        <div className="relative z-10 flex items-center justify-between border-t border-slate-800/80 pt-4 text-[11px] text-slate-400 font-medium">
          <span>Ferretería Emmanuel</span>
          <span>Managua, Nicaragua (GMT-6)</span>
        </div>
      </div>

      {/* 2. LADO DERECHO: Formulario de Inicio de Sesión */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md space-y-6">
          {/* Cabecera en Móvil y Escritorio con Logo Oficial Completo */}
          <div className="text-center lg:text-left space-y-3">
            <div className="flex justify-center lg:justify-start">
              <div className="bg-[#1E293B] px-4 py-2.5 rounded-2xl shadow-md border border-slate-700/60 inline-flex items-center">
                <Logo variante="dark" className="h-10 sm:h-12 w-auto" prioridad />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Iniciar Sesión
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Ingresa tus credenciales para acceder al mostrador o la bodega.
            </p>
          </div>

          {/* Mensaje de Error si falla la autenticación */}
          {errorMostrar && (
            <div className="flex items-start gap-3 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle size={18} className="shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">
                {errorMostrar}
              </div>
            </div>
          )}

          {/* Formulario de Login */}
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="volver" value={volverUrl} />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Usuario del Sistema <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="text"
                  name="usuario"
                  required
                  autoFocus
                  autoComplete="username"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="Ej. cajero, admin, bodega"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Contraseña <span className="text-amber-500">*</span>
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type={mostrarClave ? "text" : "password"}
                  name="clave"
                  required
                  autoComplete="current-password"
                  value={clave}
                  onChange={(e) => setClave(e.target.value)}
                  placeholder="Tu contraseña de acceso"
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-11 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setMostrarClave(!mostrarClave)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {mostrarClave ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  name="recordar"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-400 h-4 w-4 border-slate-300"
                />
                Recordar sesión (30 días)
              </label>

              <Link
                href="/recuperar"
                className="font-bold text-amber-600 hover:text-amber-700 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={pendiente}
              className="btn btn-amarillo w-full h-12 text-sm font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition active:scale-[0.99]"
            >
              {pendiente ? "Verificando credenciales..." : "Ingresar al Sistema"}
            </button>
          </form>

          {/* Accesos Rápidos por Rol para Pruebas / Demostración */}
          <div className="pt-4 border-t border-slate-200 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">
              Acceso Rápido por Rol
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {cuentasDemo.map((c) => {
                const Icon = c.icon;
                const seleccionada = usuario === c.user;

                return (
                  <button
                    key={c.user}
                    type="button"
                    onClick={() => cargarCredenciales(c.user, c.pass)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition ${
                      seleccionada
                        ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <Icon size={16} className={seleccionada ? "text-brand-yellow" : "text-slate-400 mb-1"} />
                    <span className="text-xs font-bold leading-tight">{c.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">@{c.user}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Recuperación Segura por Correo */}
      <Modal
        abierto={modalRecuperar}
        alCerrar={() => setModalRecuperar(false)}
        titulo="Recuperación de Contraseña"
        subtitulo="Enlace temporal seguro para restablecer el acceso a su cuenta."
        anchoMax="md"
      >
        <div className="py-2">
          <FormularioSolicitarRecuperacion />
        </div>
      </Modal>
    </div>
  );
}

