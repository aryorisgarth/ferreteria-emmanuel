import { getRepo } from "./api-core";

export async function ajustes(page: number = 1) {
  return getRepo().ajustes(page);
}

export async function registrarAjuste(input: any) {
  return getRepo().registrarAjuste(input);
}

export async function conteos(page: number = 1) {
  return getRepo().conteos(page);
}

export async function conteo(id: string) {
  return getRepo().conteo(id);
}

export async function registrarConteo(input: any) {
  return getRepo().registrarConteo(input);
}

export async function aplicarConteo(conteoId: string, usuario: string) {
  return getRepo().aplicarConteo(conteoId, usuario);
}
