import type { SqlExecutor } from "../client";
import type { TransferenciaPendienteRow } from "./types";
import { listarTransferenciasPendientes } from "./transfer-queries";
import { verificarTransferenciaOperacion } from "./transfer-verification";
import { rechazarTransferenciaOperacion } from "./transfer-rejection";

export class PostgresTransfersService {
  constructor(private executor: SqlExecutor) {}

  async transferenciasPendientes(): Promise<TransferenciaPendienteRow[]> {
    return listarTransferenciasPendientes(this.executor);
  }

  async verificarTransferencia(id: string, verificadoPor: string, montoAcreditado?: number): Promise<boolean> {
    return verificarTransferenciaOperacion(this.executor, id, verificadoPor, montoAcreditado);
  }

  async rechazarTransferencia(id: string, verificadoPor: string, motivo: string): Promise<boolean> {
    return rechazarTransferenciaOperacion(this.executor, id, verificadoPor, motivo);
  }
}
