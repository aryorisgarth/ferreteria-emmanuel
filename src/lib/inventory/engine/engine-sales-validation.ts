import { r2 } from "@/lib/format";
import type { DB, Factura } from "@/lib/types";
import { ReglaBodegaError, totalesLineas } from "./engine-core";

export function validarCreditoClienteEngine(
  db: DB,
  clienteId: string,
  totalConDescuento: number
) {
  const cliente = db.clientes.find((c) => c.id === clienteId);
  if (!cliente) {
    throw new ReglaBodegaError("El cliente especificado para el crédito no existe en el catálogo.");
  }
  if (cliente.activo === false) {
    throw new ReglaBodegaError(`El cliente "${cliente.nombre}" está inactivo y no tiene autorización para compras a crédito.`);
  }
  const limiteCredito = cliente.limiteCredito !== undefined ? cliente.limiteCredito : 0;
  if (limiteCredito <= 0) {
    throw new ReglaBodegaError(`El cliente "${cliente.nombre}" no tiene línea de crédito autorizada.`);
  }

  const facturasCreditoPendientes = db.facturas.filter(
    (f) => f.clienteId === clienteId && f.formaPago === "CREDITO" && f.estado === "EMITIDA" && !f.anulada
  );
  const totalPendiente = facturasCreditoPendientes.reduce((acc, f) => {
    const totalF = f.total !== undefined ? f.total : totalesLineas(f.items).total;
    return acc + totalF;
  }, 0);

  const nuevoSaldo = r2(totalPendiente + totalConDescuento);
  if (nuevoSaldo > limiteCredito) {
    throw new ReglaBodegaError(
      `Límite de crédito excedido para "${cliente.nombre}". Saldo actual pendiente: C$ ${totalPendiente.toFixed(2)}, nueva venta: C$ ${totalConDescuento.toFixed(2)}, total resultante: C$ ${nuevoSaldo.toFixed(2)}, límite autorizado: C$ ${limiteCredito.toFixed(2)}. Requiere autorización del propietario.`
    );
  }
}
