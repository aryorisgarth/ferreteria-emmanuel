import { r2 } from "@/lib/format";
import type {
  DB,
  Movimiento,
  MovimientoValorado,
  MovimientoVista,
  OrigenMovimiento,
  TipoMovimiento,
} from "@/lib/types";
import { exigirProducto, ordenKardex } from "./engine-helpers";

export function enriquecer(db: DB, mov: Movimiento): MovimientoVista {
  const producto = exigirProducto(db, mov.productoId);
  const oficina = db.oficinas.find((o) => o.id === mov.oficinaId);
  return {
    ...mov,
    codigo: producto.codigo,
    nombre: producto.nombre,
    codigoBarras: producto.codigoBarras,
    oficinaNombre: oficina?.nombre ?? "",
  };
}

export function filtrarKardex(
  db: DB,
  filtro: {
    productoId?: string;
    codigo?: string;
    codigoBarras?: string;
    desde?: string;
    hasta?: string;
    tipo?: TipoMovimiento | "";
    origen?: OrigenMovimiento | "";
    referencia?: string;
    busqueda?: string;
    soloAuditoria?: boolean;
  },
): MovimientoVista[] {
  const codigoBuscado = filtro.codigo?.trim().toLowerCase();
  const codigoBarrasBuscado = filtro.codigoBarras?.trim().toLowerCase();
  const referenciaBuscada = filtro.referencia?.trim().toLowerCase();
  const busquedaRapida = filtro.busqueda?.trim().toLowerCase();

  return db.movimientos
    .filter((m) => {
      if (filtro.productoId && m.productoId !== filtro.productoId) return false;
      if (filtro.desde && m.fecha < filtro.desde) return false;
      if (filtro.hasta && m.fecha > filtro.hasta) return false;
      if (filtro.tipo && m.tipo !== filtro.tipo) return false;
      if (filtro.origen && m.origen !== filtro.origen) return false;
      if (filtro.soloAuditoria && !m.esAuditoria) return false;

      const producto = db.productos.find((p) => p.id === m.productoId);
      if (codigoBuscado) {
        if (!producto || !producto.codigo.toLowerCase().includes(codigoBuscado)) return false;
      }
      if (codigoBarrasBuscado) {
        if (!producto || !producto.codigoBarras || !producto.codigoBarras.toLowerCase().includes(codigoBarrasBuscado)) return false;
      }
      if (referenciaBuscada) {
        const coincideRef =
          (m.numeroReferencia && m.numeroReferencia.toLowerCase().includes(referenciaBuscada)) ||
          m.id.toLowerCase().includes(referenciaBuscada) ||
          (m.idempotencyKey && m.idempotencyKey.toLowerCase().includes(referenciaBuscada));
        if (!coincideRef) return false;
      }
      if (busquedaRapida) {
        const prodMatch = producto && (
          producto.codigo.toLowerCase().includes(busquedaRapida) ||
          (producto.codigoBarras && producto.codigoBarras.toLowerCase().includes(busquedaRapida)) ||
          producto.nombre.toLowerCase().includes(busquedaRapida)
        );
        const movMatch =
          (m.numeroReferencia && m.numeroReferencia.toLowerCase().includes(busquedaRapida)) ||
          (m.concepto && m.concepto.toLowerCase().includes(busquedaRapida)) ||
          (m.destinatario && m.destinatario.toLowerCase().includes(busquedaRapida)) ||
          (m.usuario && m.usuario.toLowerCase().includes(busquedaRapida));

        if (!prodMatch && !movMatch) return false;
      }
      return true;
    })
    .sort(ordenKardex)
    .map((m) => enriquecer(db, m));
}

export function valorarMovimientoProspectivo(
  mov: MovimientoVista,
  costoUnitarioRef?: number,
): MovimientoValorado {
  if (mov.costoUnitario !== undefined && mov.costoUnitario !== null) {
    const cu = mov.costoUnitario;
    const ve = mov.entradas > 0 ? r2(mov.entradas * cu) : null;
    const vs = mov.salidas > 0 ? r2(mov.salidas * cu) : null;
    const sv = r2(mov.stockSaldo * cu);
    return { ...mov, costoUnitario: cu, valorEntrada: ve, valorSalida: vs, saldoValorado: sv };
  }
  if (costoUnitarioRef !== undefined && costoUnitarioRef > 0) {
    const cu = r2(costoUnitarioRef);
    const ve = mov.entradas > 0 ? r2(mov.entradas * cu) : null;
    const vs = mov.salidas > 0 ? r2(mov.salidas * cu) : null;
    const sv = r2(mov.stockSaldo * cu);
    return { ...mov, costoUnitario: cu, valorEntrada: ve, valorSalida: vs, saldoValorado: sv };
  }
  return {
    ...mov,
    costoUnitario: null,
    valorEntrada: null,
    valorSalida: null,
    saldoValorado: null,
  };
}
