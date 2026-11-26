import { paginar } from "@/lib/format";
import {
  editarMovimiento,
  fechaDelLibro,
  filtrarKardex,
  importarFilas,
  registrarEntrada,
  salidaDirecta,
  totalDelDia,
} from "@/lib/inventory/engine";
import type { FiltroKardex } from "@/lib/inventory/modelos";
import { consultar, restaurarLibro, transaccion } from "@/lib/inventory/store";
import type { FilaExcel, LineaCaptura } from "@/lib/types";

export function entrada(input: {
  productoId: string;
  cantidad: number;
  fecha: string;
  concepto: string;
  usuario: string;
  esAuditoria: boolean;
}) {
  transaccion((db) => registrarEntrada(db, input));
}

export function directa(input: {
  oficinaId: string;
  destinatario: string;
  fecha: string;
  concepto: string;
  usuario: string;
  esAuditoria: boolean;
  items: LineaCaptura[];
}) {
  return transaccion((db) => salidaDirecta(db, input).id);
}

export function kardex(filtro: FiltroKardex) {
  return consultar((db) => {
    const todos = filtrarKardex(db, filtro);
    if (filtro.page === "todas") {
      return { rows: todos, page: 1, pages: 1, total: todos.length };
    }
    return paginar(todos, filtro.page ?? 1);
  });
}

export function movimiento(id: string) {
  return consultar((db) => {
    const mov = filtrarKardex(db, {}).find((m) => m.id === id);
    return mov ?? null;
  });
}

export function editar(
  id: string,
  input: {
    cantidad: number;
    fecha: string;
    concepto: string;
    destinatario: string;
    oficinaId: string | null;
    esAuditoria: boolean;
    estadoAuditoria: "NORMAL" | "EN_AUDITORIA" | "OBSERVADO";
    usuario: string;
  },
) {
  transaccion((db) => editarMovimiento(db, id, input));
}

export function importar(filas: FilaExcel[], usuario: string) {
  return transaccion((db) => importarFilas(db, filas, usuario));
}

export function total(fecha: string, page: number) {
  return consultar((db) => paginar(totalDelDia(db, fecha), page));
}

export function restaurar() {
  restaurarLibro();
}

export function fecha() {
  return consultar((db) => fechaDelLibro(db));
}
