import Link from "next/link";
import {
  ArrowLeftRight,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  FileCheck2,
  LogOut,
  Receipt,
  Settings,
  Truck,
  Users,
  Wallet,
  Warehouse,
} from "lucide-react";
import { salir } from "@/app/actions";
import { PageDocument } from "@/components/documentos/Pieza";

export const metadata = { title: "Más Módulos" };

const SECCIONES_MAS = [
  {
    titulo: "Ventas y Cobranza",
    items: [
      { href: "/facturas", label: "Facturas y Cobros", detalle: "Ventas emitidas, contado y fiados", icon: Receipt },
      { href: "/cobranza", label: "Cobranza y Transferencias", detalle: "Abonos a crédito y auditoría de transferencias bancarias", icon: Building2 },
      { href: "/clientes", label: "Directorio de Clientes", detalle: "Clientes frecuentes, albañiles y obras", icon: Users },
      { href: "/total-del-dia", label: "Arqueo / Total del Día", detalle: "Cuadre de caja y cierre de turno", icon: Receipt },
    ],
  },
  {
    titulo: "Bodega y Abastecimiento",
    items: [
      { href: "/kardex", label: "Kárdex de Existencias", detalle: "Historial completo de entradas y salidas", icon: BookOpen },
      { href: "/compras", label: "Compras de Mercadería", detalle: "Ingreso de productos por facturas de proveedor", icon: Truck },
      { href: "/proveedores", label: "Proveedores", detalle: "Distribuidoras de materiales", icon: Warehouse },
      { href: "/gastos", label: "Control de Gastos", detalle: "Salidas de dinero de caja chica", icon: Wallet },
      { href: "/movimientos", label: "Movimientos Directos", detalle: "Entradas y salidas manuales", icon: ArrowLeftRight },
      { href: "/solicitudes", label: "Solicitudes de Material", detalle: "Pedidos internos de bodega", icon: ClipboardList },
      { href: "/actas", label: "Actas de Entrega", detalle: "Comprobantes de entrega y descarga", icon: FileCheck2 },
    ],
  },
  {
    titulo: "Administración e Informes",
    items: [
      { href: "/reportes", label: "Centro de Reportes", detalle: "Consulta, filtros e impresión de documentos oficiales", icon: BarChart3 },
      { href: "/configuracion", label: "Configuración del Negocio", detalle: "Datos comerciales, ISV, CAI y respaldos", icon: Settings },
    ],
  },
];

export default function Mas() {
  return (
    <PageDocument seccion="Navegación Móvil" titulo="Todos los Módulos del Sistema">
      <div className="space-y-6">
        {SECCIONES_MAS.map((sec) => (
          <div key={sec.titulo} className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
              {sec.titulo}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sec.items.map((item) => {
                const Icono = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3.5 p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-brand-yellow hover:bg-slate-50 transition active:scale-[0.99]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                      <Icono size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-900 truncate">{item.label}</p>
                      <p className="text-xs text-slate-500 truncate">{item.detalle}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <form action={salir} className="pt-4">
          <button className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 p-3.5 text-sm font-bold text-rose-700 hover:bg-rose-100 transition">
            <LogOut size={16} />
            Cerrar Sesión Activa
          </button>
        </form>
      </div>
    </PageDocument>
  );
}
