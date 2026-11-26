import type { RolUsuario } from "@/lib/auth";

export function rolToDb(rol: RolUsuario | string): string {
  const r = (rol || "").toUpperCase();
  if (r === "ADMINISTRADOR" || r === "ADMIN") return "admin";
  if (r === "CAJERO") return "cajero";
  if (r === "BODEGUERO" || r === "BODEGA") return "bodega";
  if (r === "VENDEDOR") return "vendedor";
  return (rol || "").toLowerCase();
}

export function rolFromDb(rol: string): RolUsuario {
  const r = (rol || "").toLowerCase();
  if (r === "admin" || r === "administrador") return "ADMINISTRADOR";
  if (r === "cajero") return "CAJERO";
  if (r === "bodega" || r === "bodeguero") return "BODEGUERO";
  if (r === "vendedor") return "VENDEDOR";
  return "CAJERO";
}
