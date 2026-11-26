import { paginar } from "@/lib/format";
import {
  aplicarConteoFisico,
  crearAjuste,
  crearConteoFisico,
  detalleConteo,
  historialAjustes,
  historialConteos,
  type ParametrosAjuste,
  type ParametrosConteoFisico,
} from "@/lib/inventory/engine";
import { consultar, transaccion } from "@/lib/inventory/store";

export function ajustes(page?: number) {
  return consultar((db) => {
    const list = historialAjustes(db);
    return page ? paginar(list, page) : { rows: list, total: list.length, pages: 1, page: 1 };
  });
}

export function registrarAjuste(input: ParametrosAjuste) {
  return transaccion((db) => crearAjuste(db, input));
}

export function conteos(page?: number) {
  return consultar((db) => {
    const list = historialConteos(db);
    return page ? paginar(list, page) : { rows: list, total: list.length, pages: 1, page: 1 };
  });
}

export function conteo(id: string) {
  return consultar((db) => detalleConteo(db, id));
}

export function registrarConteo(input: ParametrosConteoFisico) {
  return transaccion((db) => crearConteoFisico(db, input));
}

export function aplicarConteo(conteoId: string, usuario: string) {
  return transaccion((db) => aplicarConteoFisico(db, conteoId, usuario));
}
