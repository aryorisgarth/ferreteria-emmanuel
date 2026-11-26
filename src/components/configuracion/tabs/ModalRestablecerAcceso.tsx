"use client";

import { useState } from "react";
import { KeyRound, Check, Copy } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { adminRestablecerAccesoAction } from "@/app/actions/recuperacion.actions";
import type { ConfiguracionSistema } from "@/lib/config";

interface ModalRestablecerAccesoProps {
  abierto: boolean;
  alCerrar: () => void;
  usuario: ConfiguracionSistema["usuarios"][number] | null;
}

export function ModalRestablecerAcceso({
  abierto,
  alCerrar,
  usuario,
}: ModalRestablecerAccesoProps) {
  const [claveGenerada, setClaveGenerada] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCerrar = () => {
    setClaveGenerada(null);
    setCopiado(false);
    setError(null);
    alCerrar();
  };

  const handleGenerar = async () => {
    if (!usuario) return;
    setCargando(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("usuarioId", usuario.id);
      const res = await adminRestablecerAccesoAction(fd);
      if (res.ok && res.claveTemporal) setClaveGenerada(res.claveTemporal);
      else setError(res.error || "No se pudo restablecer el acceso.");
    } finally {
      setCargando(false);
    }
  };

  const copiarClave = () => {
    if (!claveGenerada) return;
    navigator.clipboard.writeText(claveGenerada);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <Modal
      abierto={abierto}
      alCerrar={handleCerrar}
      titulo="Restablecer Acceso de Usuario"
      subtitulo="Generación de credencial temporal de un solo uso."
    >
      <div className="space-y-4">
        {claveGenerada ? (
          <div className="space-y-3.5 animate-in fade-in">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold">
              Credencial temporal generada con éxito para @{usuario?.usuario}.
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Clave Temporal</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={claveGenerada}
                  className="h-10 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 font-mono text-sm font-bold text-slate-900"
                />
                <button type="button" onClick={copiarClave} className="btn btn-amarillo h-10 px-3 text-xs font-bold gap-1">
                  {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
              <p className="font-bold">Instrucciones para el empleado:</p>
              <p>1. Entregue esta clave temporal personalmente al operador (@{usuario?.usuario}).</p>
              <p>2. Al ingresar con ella, el sistema le exigirá definir su contraseña definitiva.</p>
            </div>
            <button type="button" onClick={handleCerrar} className="btn btn-amarillo w-full h-10 text-xs font-bold">
              Listo, Cerrar
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-600">
              <KeyRound size={18} className="text-slate-500 shrink-0 mt-0.5" />
              <div>
                ¿Deseas restablecer el acceso para <span className="font-bold text-slate-900">{usuario?.nombre}</span> (@
                {usuario?.usuario})? Se invalidarán sus sesiones activas previas.
              </div>
            </div>
            {error && <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">{error}</div>}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={handleCerrar} className="h-9 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">
                Cancelar
              </button>
              <button type="button" disabled={cargando} onClick={handleGenerar} className="btn btn-amarillo h-9 px-4 text-xs font-bold gap-1 shadow-xs">
                {cargando ? "Generando..." : "Generar Clave Temporal"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
