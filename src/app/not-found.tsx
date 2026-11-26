import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="max-w-md border border-black p-8">
        <div className="h-1.5 bg-[#003DA5]" />
        <div className="h-1 bg-[#F5C518]" />
        <h1 className="mt-6 font-display text-4xl">Este folio no está en el libro</h1>
        <Link className="btn btn-azul mt-6" href="/inicio">
          Volver al parte diario
        </Link>
      </div>
    </main>
  );
}
