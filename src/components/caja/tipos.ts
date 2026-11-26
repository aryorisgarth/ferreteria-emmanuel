import type { Cliente, Cotizacion, ProductoVista, TurnoCaja } from "@/lib/types";
import type { ConfiguracionSistema } from "@/lib/config";

export interface ItemCarritoPOS {
  producto: ProductoVista;
  cantidad: number;
  precioPersonalizado?: number;
  descuentoUnitario?: number;
  exentoIva?: boolean;
  esCotizacion?: boolean;
  cotizacionId?: string;
  cotizacionNumero?: string;
  cotizacionVersion?: number;
  cotizacionItemId?: string;
  cantidadMaximaPermitida?: number;
}

export type FormaPagoPOS = "EFECTIVO" | "TRANSFERENCIA" | "MIXTO" | "CREDITO";

export interface CajaProps {
  catalogo: ProductoVista[];
  clientes: Cliente[];
  fecha: string;
  turno: TurnoCaja | null;
  config: ConfiguracionSistema;
  ticketExitoso: any | null;
  cotizaciones?: Cotizacion[];
}
