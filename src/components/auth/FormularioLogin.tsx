"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { EscenaConstruccion } from "./escena/EscenaConstruccion";
import { PanelFormularioLogin } from "./PanelFormularioLogin";
import { FormularioSolicitarRecuperacion } from "./FormularioSolicitarRecuperacion";
import { Modal } from "@/components/ui/Modal";
import { Logo } from "@/components/marca/Logo";
import { BotonFullscreen } from "@/components/pwa/BotonFullscreen";

interface FormularioLoginProps {
  errorInicial?: string;
  volverUrl?: string;
}

export function FormularioLogin({ errorInicial, volverUrl = "/inicio" }: FormularioLoginProps) {
  const [panelVisible, setPanelVisible] = useState(true);
  const [modalRecuperar, setModalRecuperar] = useState(false);

  return (
    <div className="relative flex w-full h-[100dvh] min-h-[100dvh] bg-slate-950 overflow-hidden select-none">
      {/* HEADER FLOTANTE SOBRE LA MAQUETA */}
      <header
        className={`absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 pt-[calc(0.6rem+env(safe-area-inset-top,0px))] pointer-events-none transition-opacity duration-300 ${
          !panelVisible ? "flex" : "hidden lg:flex"
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900/85 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-slate-800 backdrop-blur-md shadow-md">
            <Logo variante="light" className="h-6 sm:h-8 w-auto" prioridad />
          </div>
          <BotonFullscreen />
        </div>

        {/* Acciones superiores: Restaurar Login cuando el panel esté oculto */}
        <div className="pointer-events-auto flex items-center gap-2">
          {!panelVisible && (
            <button
              type="button"
              onClick={() => setPanelVisible(true)}
              title="Abrir formulario de inicio de sesión"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-400/20 border border-amber-300 transition active:scale-95 cursor-pointer"
            >
              <LogIn size={15} />
              <span className="hidden sm:inline">Iniciar Sesión</span>
            </button>
          )}
        </div>
      </header>

      {/* CONTENEDOR FLEXIBLE ADAPTABLE:
          - Monitor grande (2xl): 60% escena / 40% login
          - Laptop (xl/lg): 55% escena / 45% login
          - Tablet horizontal (md landscape): 50% escena / 50% login
          - Tablet vertical (md portrait): 35% superior escena / 65% inferior login
          - Móvil vertical: 100% login (o 100% maqueta si se oculta)
      */}
      <div className="relative flex flex-col md:portrait:flex-col lg:flex-row w-full h-full">
        {/* ÁREA DE LA ESCENA ARQUITECTÓNICA */}
        <main
          className={`relative h-full transition-all duration-500 ease-in-out flex items-center justify-center overflow-hidden ${
            !panelVisible
              ? "w-full flex-1"
              : "hidden lg:flex lg:w-[55%] 2xl:w-[60%] md:portrait:flex md:portrait:h-[35%] md:portrait:w-full md:landscape:w-1/2"
          }`}
        >
          <EscenaConstruccion className="w-full h-full" />
        </main>

        {/* ÁREA DEL FORMULARIO DE LOGIN */}
        <aside
          className={`relative h-full transition-all duration-500 ease-in-out z-20 ${
            !panelVisible
              ? "hidden"
              : "w-full flex-1 lg:w-[45%] 2xl:w-[40%] md:portrait:h-[65%] md:portrait:w-full md:landscape:w-1/2"
          }`}
        >
          <PanelFormularioLogin
            volverUrl={volverUrl}
            errorInicial={errorInicial}
            onOcultar={() => setPanelVisible(false)}
            onAbrirRecuperacion={() => setModalRecuperar(true)}
          />
        </aside>
      </div>

      {/* Modal de recuperación */}
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
