"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/inventory/api";
import { AutorizacionError, exigirSesion } from "@/lib/auth";
import { mensaje, conParam, refrescar } from "./helpers";

export async function restaurarAction(formData?: FormData) {
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    if (process.env.NODE_ENV === "production") {
      throw new AutorizacionError(
        "OPERACIÓN_PROHIBIDA: La restauración a datos de demostración está terminantemente deshabilitada en entornos de producción."
      );
    }
    const confirmacion = formData?.get("confirmacion") ? String(formData.get("confirmacion")).trim() : "";
    if (confirmacion !== "RESTAURAR_DEMO_CONFIRMAR") {
      throw new Error(
        "Se requiere ingresar la frase de confirmación exacta 'RESTAURAR_DEMO_CONFIRMAR' para restablecer los datos de demostración."
      );
    }
    await api.restaurar();
  } catch (error) {
    redirect(conParam("/inicio", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/inicio", "aviso", "Se restauró el ejemplar de demostración."));
}

export async function guardarConfiguracionGeneralAction(formData: FormData) {
  let tabDestino = "empresa";
  try {
    await exigirSesion(["ADMINISTRADOR"]);
    const { obtenerConfiguracion, guardarConfiguracion } = await import("@/lib/config");
    const actual = await obtenerConfiguracion();

    const seccion = String(formData.get("seccion") || "empresa");

    if (seccion === "empresa") {
      tabDestino = "empresa";
      actual.empresa = {
        nombre: String(formData.get("nombre") || actual.empresa.nombre),
        bodega: String(formData.get("bodega") || actual.empresa.bodega),
        lema: String(formData.get("lema") || actual.empresa.lema),
        ruc: String(formData.get("ruc") || actual.empresa.ruc),
        direccion: String(formData.get("direccion") || actual.empresa.direccion),
        telefono: String(formData.get("telefono") || actual.empresa.telefono),
        correo: String(formData.get("correo") || actual.empresa.correo),
        pieFactura: String(formData.get("pieFactura") || actual.empresa.pieFactura),
        logoVariante: (String(formData.get("logoVariante") || actual.empresa.logoVariante) as any),
      };
    } else if (seccion === "moneda_impuesto") {
      tabDestino = "moneda";
      actual.moneda = {
        nombre: String(formData.get("monedaNombre") || actual.moneda.nombre),
        simbolo: String(formData.get("monedaSimbolo") || actual.moneda.simbolo),
        codigo: String(formData.get("monedaCodigo") || actual.moneda.codigo),
      };
      actual.impuesto = {
        nombre: String(formData.get("impuestoNombre") || actual.impuesto.nombre),
        porcentaje: Number(formData.get("impuestoPorcentaje") || actual.impuesto.porcentaje),
        aplicarPorDefecto: formData.get("aplicarPorDefecto") === "on",
      };
    } else if (seccion === "ventas") {
      tabDestino = "ventas";
      actual.ventas = {
        diasValidezCotizacion: Number(formData.get("diasValidezCotizacion") || 15),
        diasCreditoMaximo: Number(formData.get("diasCreditoMaximo") || 30),
        terminosCotizacion: String(formData.get("terminosCotizacion") || actual.ventas.terminosCotizacion),
      };
    } else if (seccion === "sistema") {
      tabDestino = "hora";
      actual.sistema = {
        zonaHoraria: String(formData.get("zonaHoraria") || actual.sistema.zonaHoraria),
        formatoFecha: String(formData.get("formatoFecha") || actual.sistema.formatoFecha),
      };
    }

    await guardarConfiguracion(actual);
  } catch (error) {
    redirect(conParam(`/configuracion?tab=${tabDestino}`, "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam(`/configuracion?tab=${tabDestino}`, "aviso", "Configuración guardada exitosamente."));
}
