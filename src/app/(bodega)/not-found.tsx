import Link from "next/link";

export default function BodegaNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold text-slate-800">Elemento no encontrado</h2>
      <p className="mt-2 text-sm text-slate-500">El registro solicitado no existe o fue movido.</p>
      <Link href="/inicio" className="btn btn-azul mt-4">
        Volver al Inicio
      </Link>
    </div>
  );
}

