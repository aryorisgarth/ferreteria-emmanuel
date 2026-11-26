import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { exigirSesion } from "@/lib/auth";

export async function GET() {
  try {
    await exigirSesion(["ADMINISTRADOR"]);

    const rutaBase = process.env.DATA_DIR
      ? path.resolve(process.env.DATA_DIR)
      : path.join(process.cwd(), "data");

    const rutaBodega = process.env.DATA_BODEGA_PATH
      ? path.resolve(process.env.DATA_BODEGA_PATH)
      : path.join(rutaBase, "bodega.json");

    const rutaConfig = process.env.DATA_CONFIG_PATH
      ? path.resolve(process.env.DATA_CONFIG_PATH)
      : path.join(rutaBase, "configuracion.json");

    let bodegaData: any = {};
    let configData: any = {};

    if (process.env.STORAGE_PROVIDER === "postgres") {
      const { getCommercialRepository, getConfigRepository } = await import("@/lib/repositories");
      const [bodegaRespaldo, configRespaldo] = await Promise.all([
        getCommercialRepository().generarRespaldo(),
        getConfigRepository().obtener(),
      ]);
      bodegaData = bodegaRespaldo;
      configData = configRespaldo;
    } else {
      if (fs.existsSync(rutaBodega)) {
        try {
          bodegaData = JSON.parse(fs.readFileSync(rutaBodega, "utf8"));
        } catch {}
      }

      if (fs.existsSync(rutaConfig)) {
        try {
          configData = JSON.parse(fs.readFileSync(rutaConfig, "utf8"));
        } catch {}
      }
    }

    const payload = {
      empresa: "Ferretería Emmanuel",
      fechaExportacion: new Date().toISOString(),
      versionEsquema: "1.0",
      sistema: {
        configuracion: configData,
        baseDeDatos: bodegaData,
      },
    };

    const fechaHoy = new Date().toISOString().split("T")[0];
    const nombreArchivo = `respaldo-ferreteria-emmanuel-${fechaHoy}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${nombreArchivo}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "No autorizado para descargar copias de seguridad." },
      { status: 401 },
    );
  }
}

