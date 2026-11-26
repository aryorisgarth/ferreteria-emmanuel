import { supabaseAdmin } from "@/lib/supabase/admin";
import * as local from "@/lib/inventory/local";
import * as remoto from "@/lib/inventory/supabase-bodega";
import { getCommercialRepository, getStorageProvider } from "@/lib/repositories";

export function conexion() {
  return supabaseAdmin();
}

export async function modo() {
  if (conexion()) return "supabase" as const;
  if (getStorageProvider() === "postgres") return "postgres" as const;
  return "local" as const;
}

export function getRepo(): any {
  if (getStorageProvider() === "postgres") {
    return getCommercialRepository();
  }
  return local;
}

export async function restaurar() {
  if (getStorageProvider() === "postgres") {
    throw new Error("En PostgreSQL la restauración se realiza mediante pg_restore o scripts SQL.");
  }
  return local.restaurar();
}

export async function fecha() {
  const sb = conexion();
  if (sb) return remoto.fecha(sb);
  if (getStorageProvider() === "postgres") {
    return new Date().toISOString().slice(0, 10);
  }
  return local.fecha();
}
