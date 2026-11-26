import type { Acta, Solicitud } from "@/lib/types";
import { idProducto } from "./seed-products-data";

export function solicitudesSeed(): Solicitud[] {
  const pid = idProducto;
  return [
    {
      id: "sol-ent-1",
      numero: "SM-2026-00001",
      estado: "ENTREGADO",
      solicitante: "Ana Rivera",
      oficinaId: "of-direccion",
      destinatario: "Ana Rivera",
      observaciones: "Clavos para archivo y estantería.",
      fecha: "2026-11-01",
      actaId: "acta-ent-1",
      stockAplicado: true,
      creadoPor: "Ana Rivera",
      items: [
        { id: "item-ent-1", productoId: pid("FE-001"), cantidad: 10, unidadMedida: "UNIDAD", observacion: "" },
      ],
    },
    {
      id: "sol-apr-1",
      numero: "SM-2026-00002",
      estado: "APROBADO",
      solicitante: "Carlos Méndez",
      oficinaId: "of-obras",
      destinatario: "Carlos Méndez",
      observaciones: "Cascos para cuadrilla de losa. El descargo se hará al entregar.",
      fecha: "2026-11-01",
      actaId: "acta-apr-1",
      stockAplicado: false,
      creadoPor: "Carlos Méndez",
      items: [
        { id: "item-apr-1", productoId: pid("FE-012"), cantidad: 2, unidadMedida: "UNIDAD", observacion: "" },
      ],
    },
    {
      id: "sol-pen-1",
      numero: "SM-2026-00003",
      estado: "PENDIENTE_DE_REVISION",
      solicitante: "Marta Solís",
      oficinaId: "of-servicios",
      destinatario: "Marta Solís",
      observaciones: "Pedido mixto. Sigue en borrador y no altera existencias.",
      fecha: "2026-11-01",
      actaId: null,
      stockAplicado: false,
      creadoPor: "Marta Solís",
      items: [
        { id: "item-pen-1", productoId: pid("FE-010"), cantidad: 5, unidadMedida: "UNIDAD", observacion: "" },
        { id: "item-pen-2", productoId: pid("FE-004"), cantidad: 2, unidadMedida: "BOLSA", observacion: "No sumar con los discos." },
      ],
    },
  ];
}

export function actasSeed(): Acta[] {
  const pid = idProducto;
  return [
    {
      id: "acta-ent-1",
      numero: "AE-2026-00001",
      solicitudId: "sol-ent-1",
      esSalidaDirecta: false,
      oficinaId: "of-direccion",
      destinatario: "Ana Rivera",
      fecha: "2026-11-01",
      concepto: "Entrega según solicitud SM-2026-00001",
      ejecutada: true,
      items: [
        { id: "acta-item-ent-1", productoId: pid("FE-001"), cantidad: 10, unidadMedida: "UNIDAD", observacion: "", solicitudItemId: "item-ent-1" },
      ],
    },
    {
      id: "acta-apr-1",
      numero: "AE-2026-00002",
      solicitudId: "sol-apr-1",
      esSalidaDirecta: false,
      oficinaId: "of-obras",
      destinatario: "Carlos Méndez",
      fecha: "2026-11-01",
      concepto: "Cascos para cuadrilla de losa. El descargo se hará al entregar.",
      ejecutada: false,
      items: [
        { id: "acta-item-apr-1", productoId: pid("FE-012"), cantidad: 2, unidadMedida: "UNIDAD", observacion: "", solicitudItemId: "item-apr-1" },
      ],
    },
    {
      id: "acta-dir-1",
      numero: "AE-2026-00003",
      solicitudId: null,
      esSalidaDirecta: true,
      oficinaId: "of-taller",
      destinatario: "Luis Romero",
      fecha: "2026-11-01",
      concepto: "Salida directa al taller",
      ejecutada: true,
      items: [
        { id: "acta-item-dir-clavo", productoId: pid("FE-001"), cantidad: 4, unidadMedida: "UNIDAD", observacion: "" },
      ],
    },
    {
      id: "acta-dir-2",
      numero: "AE-2026-00004",
      solicitudId: null,
      esSalidaDirecta: true,
      oficinaId: "of-servicios",
      destinatario: "Servicios Generales",
      fecha: "2026-10-30",
      concepto: "Dotación de protección",
      ejecutada: true,
      items: [
        { id: "acta-item-dir-guantes", productoId: pid("FE-011"), cantidad: 6, unidadMedida: "PAR", observacion: "" },
        { id: "acta-item-dir-cascos", productoId: pid("FE-012"), cantidad: 3, unidadMedida: "UNIDAD", observacion: "" },
      ],
    },
  ];
}
