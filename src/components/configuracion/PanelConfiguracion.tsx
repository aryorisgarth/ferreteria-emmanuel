"use client";

import React, { useState, useEffect } from "react";
import type { SeccionConfiguracionId, PanelConfiguracionProps } from "./types";
import { ConfiguracionSidebar } from "./layout/ConfiguracionSidebar";
import { ConfiguracionMobileNav } from "./layout/ConfiguracionMobileNav";
import { ConfiguracionHeader } from "./layout/ConfiguracionHeader";
import { GRUPOS_CONFIGURACION } from "./layout/navigation-items";

import { ConfiguracionEmpresa } from "./tabs/ConfiguracionEmpresa";
import { ConfiguracionMonedaImpuesto } from "./tabs/ConfiguracionMonedaImpuesto";
import { ConfiguracionVentas } from "./tabs/ConfiguracionVentas";
import { ConfiguracionCajaPagos } from "./tabs/ConfiguracionCajaPagos";
import { ConfiguracionInventarioParametros } from "./tabs/ConfiguracionInventarioParametros";
import { ConfiguracionUsuarios } from "./tabs/ConfiguracionUsuarios";
import { ConfiguracionDispositivoHardware } from "./tabs/ConfiguracionDispositivoHardware";
import { SelectorTema } from "./SelectorTema";
import { ConfiguracionBackups } from "./tabs/ConfiguracionBackups";
import { ConfiguracionHora } from "./tabs/ConfiguracionHora";

const TODAS_LAS_SECCIONES = GRUPOS_CONFIGURACION.flatMap((g) => g.items.map((i) => i.id));

export function PanelConfiguracion({
  configuracion,
  modoDb,
  tabInicial,
}: PanelConfiguracionProps) {
  const [seccionActiva, setSeccionActiva] = useState<SeccionConfiguracionId>(() => {
    if (tabInicial && (TODAS_LAS_SECCIONES as string[]).includes(tabInicial)) {
      return tabInicial as SeccionConfiguracionId;
    }
    return "empresa";
  });

  useEffect(() => {
    if (tabInicial && (TODAS_LAS_SECCIONES as string[]).includes(tabInicial)) {
      setSeccionActiva(tabInicial as SeccionConfiguracionId);
    }
  }, [tabInicial]);

  const cambiarSeccion = (id: SeccionConfiguracionId) => {
    setSeccionActiva(id);
    if (typeof window !== "undefined") {
      window.history.replaceState({}, "", `/configuracion?tab=${id}`);
    }
  };

  return (
    <div className="space-y-4">
      <ConfiguracionHeader seccionActiva={seccionActiva} modoDb={modoDb} />
      <ConfiguracionMobileNav seccionActiva={seccionActiva} onCambiarSeccion={cambiarSeccion} />

      <div className="flex flex-col lg:flex-row gap-6 items-start relative">
        <div className="hidden lg:block shrink-0">
          <ConfiguracionSidebar seccionActiva={seccionActiva} onCambiarSeccion={cambiarSeccion} />
        </div>

        <main className="flex-1 w-full min-w-0 min-h-0">
          {seccionActiva === "empresa" && (
            <ConfiguracionEmpresa empresa={configuracion.empresa} />
          )}
          {seccionActiva === "ventas_impuestos" && (
            <div className="space-y-5">
              <ConfiguracionMonedaImpuesto
                moneda={configuracion.moneda}
                impuesto={configuracion.impuesto}
              />
              <ConfiguracionVentas ventas={configuracion.ventas} />
            </div>
          )}
          {seccionActiva === "caja_pagos" && <ConfiguracionCajaPagos />}
          {seccionActiva === "inventario" && <ConfiguracionInventarioParametros />}
          {seccionActiva === "usuarios" && (
            <ConfiguracionUsuarios usuarios={configuracion.usuarios} />
          )}
          {seccionActiva === "dispositivo" && <ConfiguracionDispositivoHardware />}
          {seccionActiva === "apariencia" && <SelectorTema />}
          {seccionActiva === "mantenimiento_bd" && <ConfiguracionBackups />}
          {seccionActiva === "sistema_hora" && (
            <ConfiguracionHora sistema={configuracion.sistema} />
          )}
        </main>
      </div>
    </div>
  );
}
