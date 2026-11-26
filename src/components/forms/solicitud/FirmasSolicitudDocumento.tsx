"use client";

export function FirmasSolicitudDocumento({ fecha }: { fecha: string }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-200 text-xs">
        <span className="font-bold text-slate-900 uppercase">Fecha de Entrega:</span>
        <input
          type="date"
          name="fechaEntrega"
          defaultValue={fecha}
          className="border border-slate-300 rounded px-2.5 py-1 text-xs font-bold text-slate-900 outline-none bg-white"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-center text-xs">
        <div className="border-t border-slate-400 pt-1.5">
          <div className="text-[11px] text-slate-500">Nombre / Firma</div>
          <div className="font-bold text-slate-900 uppercase mt-0.5">RECIBE</div>
        </div>
        <div className="border-t border-slate-400 pt-1.5">
          <div className="text-[11px] text-slate-500">Bodega / Responsable</div>
          <div className="font-bold text-slate-900 uppercase mt-0.5">ENTREGA</div>
        </div>
        <div className="border-t border-slate-400 pt-1.5">
          <div className="text-[11px] text-slate-500">Autoriza</div>
          <div className="font-bold text-slate-900 uppercase mt-0.5">AUTORIZADO / SOLICITADO POR</div>
        </div>
      </div>
    </>
  );
}
