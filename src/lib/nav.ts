export const NAV = [
  { grupo: "Hoy", href: "/inicio", label: "Hoy", icon: "control", mobile: true },
  { grupo: "Hoy", href: "/caja", label: "Caja", icon: "caja", mobile: true },
  { grupo: "Hoy", href: "/inventario", label: "Inventario", icon: "inventario", mobile: true },
  { grupo: "Ventas", href: "/cotizaciones", label: "Cotizaciones", icon: "cotizaciones", mobile: true },
  { grupo: "Ventas", href: "/facturas", label: "Facturas", icon: "facturas", mobile: false },
  { grupo: "Gente", href: "/clientes", label: "Clientes", icon: "clientes", mobile: false },
  { grupo: "Gente", href: "/proveedores", label: "Proveedores", icon: "proveedores", mobile: false },
  { grupo: "Compras", href: "/compras", label: "Compras", icon: "compras", mobile: false },
  { grupo: "Compras", href: "/gastos", label: "Gastos", icon: "gastos", mobile: false },
  { grupo: "Bodega", href: "/movimientos", label: "Movimientos", icon: "movimientos", mobile: false },
  { grupo: "Bodega", href: "/kardex", label: "Kárdex", icon: "kardex", mobile: false },
  { grupo: "Bodega", href: "/solicitudes", label: "Solicitudes", icon: "solicitudes", mobile: false },
  { grupo: "Bodega", href: "/actas", label: "Actas", icon: "actas", mobile: false },
] as const;

export const INSTITUCION = {
  nombre: "Ferretería Emmanuel",
  bodega: "Bodega Central de Materiales",
  ruc: "J0310000000000",
  direccion: "Managua, Nicaragua - De la rotonda 2c. al sur",
  contacto: "Atención al Cliente y Ventas",
  telefono: "+505 2222-3344 / 8888-9900",
  correo: "contacto@ferreteriaemmanuel.com",
};
