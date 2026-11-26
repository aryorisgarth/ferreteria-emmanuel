export interface TransferenciaPendienteRow {
  id: string;
  facturaId: string | null;
  cotizacionId: string | null;
  clienteId: string | null;
  clienteNombre: string;
  cajeroId: string;
  cajeroNombre: string;
  bancoOrigen: string;
  bancoDestino: string;
  referenciaBancaria: string;
  monto: number;
  montoAcreditado: number | null;
  moneda: string;
  comprobanteUrl: string | null;
  estado: string;
  estadoComercial: string;
  verificadoPor: string | null;
  fechaVerificacion: string | null;
  motivoRechazo: string | null;
  fecha: string;
  facturaNumero: string | null;
}
