import {
  obtenerConfiguracionJson,
  guardarConfiguracionJson,
  type ConfiguracionSistema,
} from "@/lib/config";
import type { IConfigRepository } from "../types";

export class JsonConfigRepository implements IConfigRepository {
  async obtener(): Promise<ConfiguracionSistema> {
    return obtenerConfiguracionJson();
  }

  async guardar(config: ConfiguracionSistema): Promise<void> {
    guardarConfiguracionJson(config);
  }
}
