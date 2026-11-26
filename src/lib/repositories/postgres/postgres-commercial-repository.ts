import type { ICommercialRepository, CommercialTransactionContext } from "../types";
import { getTransactionalClient, isPostgresConfigured, SqlExecutor } from "./client";
import { PostgresCommercialOperationsBase } from "./commercial-operations-base";
import { PostgresInvoicingService } from "./invoicing/invoicing-service";
import { PostgresTransfersService } from "./transfers/postgres-transfers-service";

export class PostgresCommercialRepository extends PostgresCommercialOperationsBase implements ICommercialRepository {
  private invoicingService: PostgresInvoicingService;
  private transfersService: PostgresTransfersService;

  constructor(customExecutor?: SqlExecutor) {
    super(customExecutor);
    this.invoicingService = new PostgresInvoicingService(this.executor, (id) => this.quotesService.cotizacion(id));
    this.transfersService = new PostgresTransfersService(this.executor);
  }

  async runTransaction<T>(
    operation: (repo: ICommercialRepository, ctx: CommercialTransactionContext) => Promise<T> | T
  ): Promise<T> {
    if (!isPostgresConfigured()) {
      const ctx: CommercialTransactionContext = {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        fechaInicio: new Date().toISOString(),
      };
      return await operation(this, ctx);
    }
    const txClient = await getTransactionalClient();
    const ctx: CommercialTransactionContext = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fechaInicio: new Date().toISOString(),
    };
    const scopedRepo = new PostgresCommercialRepository(txClient);
    try {
      const result = await operation(scopedRepo, ctx);
      await txClient.commit();
      return result;
    } catch (error) {
      await txClient.rollback();
      throw error;
    } finally {
      txClient.release();
    }
  }

  // --- Facturación e Idempotencia ---
  emitirFactura = (input: any) => this.invoicingService.emitirFactura(input);
  convertirCotizacionAVenta = (inputOId: any, creadoPor?: string, origen: any = "COTIZACION", formaPago: any = "EFECTIVO") =>
    this.invoicingService.convertirCotizacionAVenta(inputOId, creadoPor, origen, formaPago);

  // --- Transferencias Bancarias (Política A) ---
  transferenciasPendientes = () => this.transfersService.transferenciasPendientes();
  verificarTransferencia = (id: string, verificadoPor: string, montoAcreditado?: number) =>
    this.transfersService.verificarTransferencia(id, verificadoPor, montoAcreditado);
  rechazarTransferencia = (id: string, verificadoPor: string, motivo: string) =>
    this.transfersService.rechazarTransferencia(id, verificadoPor, motivo);
}
