"use client";

import { useEffect, useState } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { salir } from "@/app/actions";
import { HouseMark, Logo } from "@/components/marca/Logo";
import { Nav } from "@/components/layout/Nav";

interface SidebarProps {
  usuario: string;
  alertas?: {
    stockBajo?: number;
    porCobrar?: number;
  };
}

export function Sidebar({ usuario, alertas }: SidebarProps) {
  const [colapsado, setColapsado] = useState(false);
  const [cargado, setCargado] = useState(false);

  // Cargar preferencia guardada
  useEffect(() => {
    const guardado = localStorage.getItem("fe_sidebar_colapsado");
    if (guardado !== null) {
      setColapsado(guardado === "true");
    }
    setCargado(true);
  }, []);

  const toggleColapso = () => {
    const nuevo = !colapsado;
    setColapsado(nuevo);
    localStorage.setItem("fe_sidebar_colapsado", String(nuevo));
  };

  return (
    <aside
      className={`sticky top-3 my-3 ml-3 hidden h-[calc(100dvh-1.5rem)] shrink-0 flex-col rounded-3xl border border-slate-800/80 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white shadow-2xl shadow-slate-950/30 backdrop-blur-xl transition-all duration-300 ease-in-out lg:flex ${
        colapsado ? "w-20" : "w-64"
      }`}
    >
      {/* Header del Sidebar */}
      <div className={`flex items-center border-b border-slate-800/80 px-4 py-4.5 ${
        colapsado ? "justify-center" : "justify-between"
      }`}>
        {!colapsado ? (
          <div className="overflow-hidden">
            <Logo variante="light" compacto />
          </div>
        ) : (
          <div title="Ferretería Emmanuel" className="flex items-center justify-center">
            <HouseMark variante="light" className="h-8 w-auto" />
          </div>
        )}

        <button
          type="button"
          onClick={toggleColapso}
          title={colapsado ? "Expandir menú" : "Contraer menú"}
          className={`flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-800 hover:text-amber-400 ${
            colapsado ? "hidden" : "inline-flex"
          }`}
        >
          <PanelLeftClose size={17} />
        </button>
      </div>

      {/* Botón flotante para expandir si está colapsado */}
      {colapsado && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={toggleColapso}
            title="Expandir menú"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-800 hover:text-amber-400"
          >
            <PanelLeftOpen size={17} />
          </button>
        </div>
      )}

      {/* Navegación de secciones */}
      <Nav colapsado={colapsado} alertas={alertas} />

      {/* Footer del Sidebar con perfil y sesión */}
      <div className="border-t border-slate-800/80 p-3">
        {!colapsado ? (
          <div className="flex items-center justify-between rounded-2xl bg-slate-800/40 p-2.5 border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-xs font-black text-slate-950 shadow-xs">
                {usuario.charAt(0).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-xs font-bold text-slate-200">{usuario}</p>
                <p className="text-[10px] text-slate-400 font-medium">Mostrador / Caja</p>
              </div>
            </div>

            <form action={salir}>
              <button
                type="submit"
                title="Cerrar sesión"
                className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-400"
              >
                <LogOut size={16} />
              </button>
            </form>
          </div>
        ) : (
          <form action={salir} className="flex justify-center">
            <button
              type="submit"
              title="Cerrar sesión"
              className="flex h-10 w-10 items-center justify-center rounded-2xl text-slate-400 transition-colors hover:bg-rose-500/20 hover:text-rose-400"
            >
              <LogOut size={18} />
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
