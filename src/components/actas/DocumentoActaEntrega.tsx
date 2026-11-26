import { Logo, MarcaAguaImpresion } from "@/components/marca/Logo";
import { etiquetaUnidad, fechaLarga, numero } from "@/lib/format";
import type { ActaDetalle } from "@/lib/inventory/modelos";

export function DocumentoActaEntrega({ acta }: { acta: ActaDetalle }) {
  const totalCantidad = acta.items.reduce((acc, it) => acc + (it.cantidad || 0), 0);

  return (
    <div className="bg-white rounded border border-slate-300 p-6 md:p-8 space-y-5 shadow-2xs relative overflow-hidden print:p-0 print:border-none print:shadow-none">
      <MarcaAguaImpresion orientacion="vertical" />

      {/* Encabezado Institucional */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <Logo variante="color" className="h-9 w-auto shrink-0" />
        <div className="text-center flex-1">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#dc2626]">
            FERRETERÍA EMMANUEL · CONTROL DE DESPACHOS Y BODEGA
          </div>
          <h1 className="text-sm sm:text-base font-extrabold text-[#1e40af] uppercase tracking-wide">
            Acta Oficial de Entrega y Despacho de Materiales
          </h1>
        </div>
        <div className="text-right font-mono">
          <span className="text-[10px] font-bold uppercase text-slate-400 block">Folio Acta</span>
          <span className="text-base font-bold text-slate-900">{acta.numero}</span>
        </div>
      </div>

      {/* Datos del Despacho */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50/80 p-3.5 rounded border border-slate-200 text-xs">
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Destinatario / Quien Recibe:</span>
          <span className="font-bold text-slate-900">{acta.destinatario}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Dependencia / Obra:</span>
          <span className="font-semibold text-slate-800">{acta.oficinaNombre}</span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Documento de Origen:</span>
          <span className="font-mono font-bold text-slate-800">
            {acta.esSalidaDirecta ? "Salida Directa" : (acta.solicitudNumero || "Solicitud")}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-bold uppercase text-slate-500 block">Fecha de Emisión:</span>
          <span className="font-medium text-slate-800">{fechaLarga(acta.fecha)}</span>
        </div>
      </div>

      {acta.concepto && (
        <div className="text-xs bg-white p-2.5 rounded border border-slate-200">
          <span className="font-bold text-slate-700">Concepto / Destino del Material:</span>{" "}
          <span className="text-slate-600">{acta.concepto}</span>
        </div>
      )}

      {/* Tabla Cuadriculada de Materiales */}
      <div className="overflow-x-auto">
        <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-xs">
          <thead>
            <tr className="bg-black text-white text-[11px] font-bold text-center leading-tight">
              <th className="border border-black py-2 px-1.5 w-10">No.</th>
              <th className="border border-black py-2 px-2 w-28">Código</th>
              <th className="border border-black py-2 px-3 text-left">Descripción del Material</th>
              <th className="border border-black py-2 px-2 text-center w-24">U. Medida</th>
              <th className="border border-black py-2 px-2 text-center w-24">Cant. Despachada</th>
              <th className="border border-black py-2 px-3 text-left">Observaciones</th>
            </tr>
          </thead>
          <tbody className="bg-transparent text-black text-xs">
            {acta.items.map((it, idx) => (
              <tr key={it.id || idx}>
                <td className="border border-black py-1.5 px-1.5 text-center">{idx + 1}</td>
                <td className="border border-black py-1.5 px-2 text-center font-mono font-medium">{it.codigo}</td>
                <td className="border border-black py-1.5 px-3 text-left font-semibold">{it.nombre}</td>
                <td className="border border-black py-1.5 px-2 text-center">{etiquetaUnidad(it.unidadMedida)}</td>
                <td className="border border-black py-1.5 px-2 text-center font-bold font-mono text-sm">{numero(it.cantidad)}</td>
                <td className="border border-black py-1.5 px-3 text-left text-slate-600">{it.observacion || "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold text-xs">
              <td colSpan={4} className="border border-black py-2 px-3 text-right">
                TOTAL GENERAL ({acta.items.length} RENGLONES):
              </td>
              <td className="border border-black py-2 px-2 text-center font-mono text-sm">{numero(totalCantidad)}</td>
              <td className="border border-black py-2 px-3 text-slate-500 font-normal">UNIDADES TOTALES</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Bloque de Firmas Institucionales Tripartitas */}
      <div className="pt-8 pb-2 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-xs">
        <div>
          <div className="border-t border-slate-800 w-44 mx-auto pt-1 font-bold text-slate-900">
            Entregó Bodega
          </div>
          <div className="text-[10px] text-slate-500">Despacho & Kárdex</div>
        </div>
        <div>
          <div className="border-t border-slate-800 w-44 mx-auto pt-1 font-bold text-slate-900">
            {acta.destinatario}
          </div>
          <div className="text-[10px] text-slate-500">Recibí Conforme (Destinatario)</div>
        </div>
        <div>
          <div className="border-t border-slate-800 w-44 mx-auto pt-1 font-bold text-slate-900">
            Vo. Bo. Almacén Central
          </div>
          <div className="text-[10px] text-slate-500">Supervisión / Auditoría</div>
        </div>
      </div>
    </div>
  );
}
