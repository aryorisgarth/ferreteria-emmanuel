import { Firmas, Sello } from "@/components/documentos/Pieza";
import { Membrete } from "@/components/documentos/Membrete";
import { etiquetaUnidad, fechaLarga, numero } from "@/lib/format";
import type { ActaDetalle, SolicitudDetalle } from "@/lib/inventory/modelos";

export function SolicitudPapel({ solicitud }: { solicitud: SolicitudDetalle }) {
  return (
    <Membrete titulo="Solicitud de materiales" correlativo={solicitud.numero}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <Sello estado={solicitud.estado} />
        <p className="font-body text-sm">{fechaLarga(solicitud.fecha)}</p>
      </div>
      <dl className="grid gap-3 border border-black p-3 font-body text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em]">Solicitante</dt>
          <dd>{solicitud.solicitante}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em]">Dependencia</dt>
          <dd>{solicitud.oficinaNombre}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em]">Destinatario</dt>
          <dd>{solicitud.destinatario}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em]">Acta</dt>
          <dd>{solicitud.actaNumero ?? "Aún no emitida"}</dd>
        </div>
      </dl>
      {solicitud.observaciones ? <p className="mt-3 font-body text-sm">{solicitud.observaciones}</p> : null}
      <TablaLineas filas={solicitud.items} />
      <p className="mt-4 font-body text-xs leading-5">
        Este formulario queda en pendiente de revisión sin alterar existencias. El acta se emite al aprobar. El descargo del
        kárdex y la salida de stock ocurren solamente cuando el estado pasa a entregado, y una sola vez.
      </p>
      <Firmas etiquetas={["Solicitante", "Jefe de bodega", "Vo. Bo."]} />
    </Membrete>
  );
}

export function ActaPapel({ acta }: { acta: ActaDetalle }) {
  return (
    <Membrete titulo="Acta de entrega" correlativo={acta.numero}>
      <dl className="grid gap-3 border border-black p-3 font-body text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em]">Fecha</dt>
          <dd>{fechaLarga(acta.fecha)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em]">Destinatario</dt>
          <dd>{acta.destinatario}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em]">Dependencia</dt>
          <dd>{acta.oficinaNombre}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em]">Origen</dt>
          <dd>{acta.esSalidaDirecta ? "Salida directa" : acta.solicitudNumero}</dd>
        </div>
      </dl>
      <p className="mt-3 font-body text-sm">
        <span className="font-bold uppercase tracking-wider">{acta.ejecutada ? "Descargo ejecutado" : "Emitida sin descargo"}.</span>{" "}
        {acta.concepto}
      </p>
      <TablaLineas filas={acta.items} />
      <p className="mt-4 font-body text-xs leading-5">
        {acta.ejecutada
          ? "La cantidad de cada renglón ya salió del inventario y consta en el kárdex, vinculada a esta acta."
          : "El documento está emitido. El inventario se descuenta cuando la solicitud se marca entregada."}
      </p>
      <Firmas etiquetas={["Entrega", "Recibe", "Vo. Bo. bodega"]} />
    </Membrete>
  );
}

function TablaLineas({ filas }: { filas: ActaDetalle["items"] }) {
  return (
    <table className="tabla mt-4">
      <thead>
        <tr>
          <th>No.</th>
          <th>Código</th>
          <th>Descripción</th>
          <th>U. Medida</th>
          <th>Cantidad</th>
          <th>Observación</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((fila, indice) => (
          <tr key={fila.id}>
            <td>{indice + 1}</td>
            <td>{fila.codigo}</td>
            <td>{fila.nombre}</td>
            <td>{etiquetaUnidad(fila.unidadMedida)}</td>
            <td className="text-right">{numero(fila.cantidad)}</td>
            <td>{fila.observacion || "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
