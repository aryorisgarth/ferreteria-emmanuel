import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { GastosCrud } from "@/components/crud/GastosCrud";
import { hoyISO } from "@/lib/format";
import * as api from "@/lib/inventory/api";
import { obtenerConfiguracion } from "@/lib/config";

export const metadata = { title: "Control de Gastos y Flujo Operativo" };

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; error?: string }>;
}) {
  const sp = await searchParams;

  const [todos, resumen, config] = await Promise.all([
    api.todosLosGastos(),
    api.resumen(),
    obtenerConfiguracion(),
  ]);

  return (
    <PageDocument seccion="Control Financiero" titulo="Gastos de Operación y Caja Chica">
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}
      <GastosCrud
        gastosIniciales={todos}
        fechaHoy={hoyISO()}
        resumenFinanciero={resumen}
        simboloMoneda={config.moneda.simbolo}
      />
    </PageDocument>
  );
}
