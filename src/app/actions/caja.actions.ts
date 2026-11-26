"use server";

import { redirect } from "next/navigation";
import * as api from "@/lib/inventory/api";
import { ReglaBodegaError } from "@/lib/inventory/engine";
import type { FormaPago } from "@/lib/types";
import { exigirSesion } from "@/lib/auth";
import { conParam, mensaje, refrescar, usuario } from "./helpers";
import { lineasVentaValidadas } from "./validaciones";

export async function cobrarAction(formData: FormData) {
  let id = "";
  try {
    const sesion = await exigirSesion(["ADMINISTRADOR", "CAJERO"]);
    const items = await lineasVentaValidadas(formData, sesion.rol);
    const descuento = formData.get("descuento") ? Number(formData.get("descuento")) : undefined;
    const exenta = formData.get("exenta") === "true" || formData.get("exenta") === "1";
    const montoRecibido = formData.get("recibido") ? Number(formData.get("recibido")) : undefined;
    const claveIdempotencia = String(formData.get("claveIdempotencia") || "").trim() || undefined;

    // Validación estricta del descuento global en cabecera
    if (descuento !== undefined) {
      if (isNaN(descuento) || descuento < 0) {
        throw new ReglaBodegaError("El monto de descuento debe ser mayor o igual a cero.");
      }
      const subtotalItems = items.reduce((s, it) => s + it.cantidad * it.precio, 0);
      if (descuento > subtotalItems) {
        throw new ReglaBodegaError("El descuento no puede superar el subtotal de la venta.");
      }
      if (sesion.rol !== "ADMINISTRADOR" && subtotalItems > 0) {
        const pctGlobal = (descuento / subtotalItems) * 100;
        if (pctGlobal > 3.01) {
          throw new ReglaBodegaError(
            `Descuento global de C$ ${descuento.toFixed(2)} (${pctGlobal.toFixed(1)}%) no autorizado. El límite máximo para su rol es 3%. Requiere autorización de Administrador.`
          );
        }
      }
    }

    const cotizacionId = String(formData.get("cotizacionId") || "").trim() || undefined;
    const formaPago = String(formData.get("formaPago") || "EFECTIVO") as FormaPago;
    const bancoOrigen = String(formData.get("bancoOrigen") || "").trim() || undefined;
    const bancoDestino = String(formData.get("bancoDestino") || "").trim() || undefined;
    const referenciaBancaria = String(formData.get("referenciaBancaria") || "").trim() || undefined;
    const montoEfectivo = formData.get("montoEfectivo") ? Number(formData.get("montoEfectivo")) : undefined;
    const montoTransferencia = formData.get("montoTransferencia") ? Number(formData.get("montoTransferencia")) : undefined;

    // Validación estricta de transferencias bancarias y pagos mixtos (Política A)
    if (formaPago === "TRANSFERENCIA" || formaPago === "MIXTO") {
      if (!referenciaBancaria) {
        throw new ReglaBodegaError("El número de referencia bancaria o comprobante es obligatorio para ventas por transferencia.");
      }
      if (!bancoDestino) {
        throw new ReglaBodegaError("Debe seleccionar el banco de destino para registrar la transferencia.");
      }
      if (formaPago === "MIXTO") {
        if (!montoEfectivo || montoEfectivo <= 0) {
          throw new ReglaBodegaError("En pagos mixtos debe ingresar un monto de efectivo mayor a cero.");
        }
        if (!montoTransferencia || montoTransferencia <= 0) {
          throw new ReglaBodegaError("En pagos mixtos debe ingresar un monto de transferencia mayor a cero.");
        }
      }
    }

    id = await api.emitirFactura({
      cliente: String(formData.get("cliente") || "Público general"),
      clienteId: String(formData.get("clienteId") || "") || null,
      cotizacionId,
      fecha: String(formData.get("fecha") || ""),
      notas: String(formData.get("notas") || ""),
      creadoPor: await usuario(),
      formaPago,
      origen: cotizacionId ? "COTIZACION" : "CAJA",
      items,
      descuento,
      exenta,
      montoRecibido,
      claveIdempotencia,
      bancoOrigen,
      bancoDestino,
      referenciaBancaria,
      montoEfectivo,
      montoTransferencia,
    });
  } catch (error) {
    redirect(conParam("/caja", "error", mensaje(error)));
  }
  refrescar();
  const vuelto = formData.get("vuelto") ? `&vuelto=${formData.get("vuelto")}` : "";
  const recibido = formData.get("recibido") ? `&recibido=${formData.get("recibido")}` : "";
  redirect(`/caja?ticket=${id}${vuelto}${recibido}&aviso=${encodeURIComponent("Venta procesada con éxito.")}`);
}

export async function abrirTurnoCajaAction(formData: FormData) {
  const montoInicial = Number(formData.get("montoInicial") || 0);
  try {
    await exigirSesion(["ADMINISTRADOR", "CAJERO"]);
    await api.abrirTurno({
      montoInicial,
      usuario: await usuario(),
      fecha: String(formData.get("fecha") || ""),
    });
  } catch (error) {
    redirect(conParam("/caja", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/caja", "aviso", `Turno de caja abierto correctamente con fondo de C$ ${montoInicial.toFixed(2)}`));
}

export async function registrarMovimientoCajaAction(formData: FormData) {
  const tipo = String(formData.get("tipo") || "EGRESO") as "INGRESO" | "EGRESO";
  const monto = Number(formData.get("monto") || 0);
  const concepto = String(formData.get("concepto") || "");
  try {
    await exigirSesion(["ADMINISTRADOR", "CAJERO"]);
    await api.registrarMovimientoCaja({
      tipo,
      monto,
      concepto,
      usuario: await usuario(),
    });
  } catch (error) {
    redirect(conParam("/caja", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/caja", "aviso", `Movimiento de caja (${tipo}) de C$ ${monto.toFixed(2)} registrado.`));
}

export async function cerrarTurnoCajaAction(formData: FormData) {
  const montoFinalReal = Number(formData.get("montoFinalReal") || 0);
  const notas = String(formData.get("notas") || "");
  try {
    await exigirSesion(["ADMINISTRADOR", "CAJERO"]);
    await api.cerrarTurno({
      montoFinalReal,
      notas,
      usuario: await usuario(),
    });
  } catch (error) {
    redirect(conParam("/caja", "error", mensaje(error)));
  }
  refrescar();
  redirect(conParam("/caja", "aviso", "Turno de caja cerrado exitosamente. Arqueo completado."));
}
