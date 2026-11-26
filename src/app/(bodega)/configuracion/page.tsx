import { redirect } from "next/navigation";
import { Aviso, PageDocument } from "@/components/documentos/Pieza";
import { PanelConfiguracion } from "@/components/configuracion/PanelConfiguracion";
import { obtenerConfiguracion } from "@/lib/config";
import { exigirSesion } from "@/lib/auth";
import * as api from "@/lib/inventory/api";

export const metadata = { title: "Centro de Configuración" };

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ aviso?: string; error?: string; tab?: string }>;
}) {
  try {
    await exigirSesion(["ADMINISTRADOR"]);
  } catch {
    redirect(
      "/inicio?error=Acceso+denegado:+el+Centro+de+Configuraci%C3%B3n+est%C3%A1+restringido+exclusivamente+a+Administradores."
    );
  }

  const sp = await searchParams;
  const [modoDb, config] = await Promise.all([
    api.modo(),
    obtenerConfiguracion(),
  ]);

  return (
    <PageDocument
      seccion="Administración"
      titulo="Centro de Configuración y Parámetros"
    >
      {sp.aviso ? <Aviso tono="azul">{sp.aviso}</Aviso> : null}
      {sp.error ? <Aviso tono="rojo">{sp.error}</Aviso> : null}
      <PanelConfiguracion
        configuracion={config}
        modoDb={modoDb}
        tabInicial={sp.tab}
      />
    </PageDocument>
  );
}
