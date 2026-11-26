"use client";

import { useState } from "react";
import { LogIn, KeyRound } from "lucide-react";
import { EscenaConstruccion } from "./escena/EscenaConstruccion";
import { PanelFormularioLogin } from "./PanelFormularioLogin";
import { FormularioSolicitarRecuperacion } from "./FormularioSolicitarRecuperacion";
import { Modal } from "@/components/ui/Modal";
import { Logo } from "@/components/marca/Logo";

interface FormularioLoginProps {
  errorInicial?: string;
  volverUrl?: string;
}

export function FormularioLogin({ errorInicial, volverUrl = "/inicio" }: FormularioLoginProps) {
  const [panelVisible, setPanelVisible] = useState(true);
  const [modalRecuperar, setModalRecuperar] = useState(false);

  return (
    <div className="relative flex w-full min-h-dvh bg-slate-950 overflow-hidden select-none">
      {/* 1. ESCENA ARQUITECTÓNICA DE FONDO Y PRINCIPAL */}
      <div
        className={`relative flex-1 min-h-dvh transition-all duration-500 ease-in-out ${
          panelVisible ? "lg:mr-[460px] xl:mr-[500px]" : "w-full mr-0"
        }`}
      >
        {/* Cabecera institucional superior izquierda sobre la escena */}
        <div className="absolute top-5 left-5 z-20 flex items-center gap-3">
          <div className="bg-slate-900/90 p-2 sm:px-3 sm:py-2 rounded-2xl border border-slate-800 backdrop-blur-md shadow-lg flex items-center gap-2">
            <Logo variante="light" className="h-7 sm:h-9 w-auto" prioridad />
            <span className="hidden md:inline text-[11px] font-bold text-amber-400 border-l border-slate-700 pl-2">
              Arquitectura e Ingeniería
            </span>
          </div>
        </div>

        {/* Botón flotante para reabrir panel de login si está oculto */}
        {!panelVisible && (
          <div className="absolute top-5 right-5 z-20 animate-in fade-in zoom-in-95 duration-300">
            <button
              type="button"
              onClick={() => setPanelVisible(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-xl shadow-amber-500/20 border border-amber-300 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <LogIn size={16} />
              <span>Acceder al Sistema</span>
            </button>
          </div>
        )}

        {/* Lienzo interactivo de construcción isométrica */}
        <EscenaConstruccion className="w-full h-full min-h-dvh" />
      </div>

      {/* 2. PANEL LATERAL RETRÁCTIL DE AUTENTICACIÓN */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[460px] xl:w-[500px] z-30 transition-transform duration-500 ease-in-out shadow-2xl ${
          panelVisible ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <PanelFormularioLogin
          volverUrl={volverUrl}
          errorInicial={errorInicial}
          onOcultar={() => setPanelVisible(false)}
          onAbrirRecuperacion={() => setModalRecuperar(true)}
        />
      </div>

      {/* Modal de recuperación de contraseña por correo */}
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
