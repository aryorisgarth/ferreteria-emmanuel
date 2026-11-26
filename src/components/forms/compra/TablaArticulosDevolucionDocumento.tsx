import { dinero, etiquetaUnidad, numero } from "@/lib/format";

export function TablaArticulosDevolucionDocumento({
  items,
  simbolo = "C$",
}: {
  items: any[];
  simbolo?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded">
        Seleccione una factura de compra para listar los artículos disponibles a devolver.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="tabla-reporte-institucional w-full border-collapse border border-black font-sans text-xs">
        <thead>
          <tr className="bg-black text-white text-[11px] font-bold text-center leading-tight">
            <th className="border border-black py-2 px-1.5 w-10">No.</th>
            <th className="border border-black py-2 px-3 text-left">Artículo / Descripción</th>
            <th className="border border-black py-2 px-2 text-center w-24">U. Medida</th>
            <th className="border border-black py-2 px-2 text-center w-28">Cant. Comprada</th>
            <th className="border border-black py-2 px-2 text-right w-28">Costo Unit. ({simbolo})</th>
            <th className="border border-black py-2 px-2 text-center w-32 bg-red-950">Cant. Devolver</th>
            <th className="border border-black py-2 px-3 text-left">Motivo Específico</th>
          </tr>
        </thead>
        <tbody className="bg-transparent text-black text-xs">
          {items.map((it: any, idx: number) => (
            <tr key={it.id || idx}>
              <td className="border border-black py-1.5 px-1.5 text-center">{idx + 1}</td>
              <td className="border border-black py-1.5 px-3 text-left">
                <span className="font-bold text-slate-900 block">{it.nombre || `Producto ${it.productoId}`}</span>
                <span className="font-mono text-[10px] text-slate-500">{it.codigo || ""}</span>
                <input type="hidden" name="productoId" value={it.productoId} />
                <input type="hidden" name="precio" value={it.precio} />
              </td>
              <td className="border border-black py-1.5 px-2 text-center">{etiquetaUnidad(it.unidadMedida)}</td>
              <td className="border border-black py-1.5 px-2 text-center font-mono font-bold text-slate-700">
                {numero(it.cantidad)}
              </td>
              <td className="border border-black py-1.5 px-2 text-right font-mono text-slate-700">
                {dinero(it.precio, simbolo)}
              </td>
              <td className="border border-black py-1.5 px-2 text-center bg-red-50/50">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max={it.cantidad}
                  defaultValue="0"
                  name="cantidad"
                  className="h-8 w-24 rounded border border-red-300 bg-white text-center font-bold font-mono text-xs focus:border-red-600 outline-none"
                />
              </td>
              <td className="border border-black py-1.5 px-3 text-left">
                <input
                  type="text"
                  name="observacion"
                  placeholder="Ej. Roto, dañado, vencido..."
                  className="h-8 w-full rounded border border-slate-300 px-2 text-xs outline-none focus:border-blue-600"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
