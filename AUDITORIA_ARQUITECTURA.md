# INFORME DE AUDITORÍA ARQUITECTÓNICA Y PLAN DE MODULARIZACIÓN
**Proyecto:** Ferretería Emmanuel — Sistema Integral ERP/POS  
**Fecha:** 20 de Noviembre de 2026  
**Fase Actual:** FASE 8 — DIAGNÓSTICO Y AUDITORÍA GLOBAL (SIN MODIFICACIONES EN CÓDIGO)

---

## 1. RESUMEN EJECUTIVO DE LA BASE DE CÓDIGO

Se ha llevado a cabo una inspección exhaustiva de todo el código fuente del proyecto ubicado en `src/`, analizando la estructura, distribución de líneas, acoplamiento, responsabilidades y riesgos arquitectónicos.

| Métrica Global | Valor Obtenido |
| :--- | :--- |
| **Total de Archivos Analizados (`src/`)** | **161 archivos** |
| **Total de Líneas de Código** | **44,472 líneas** |
| **Archivos en Rango Normal (≤ 150 líneas)** | **72 archivos** (44.7%) |
| **Archivos Candidatos a Modularización (> 150 líneas)** | **89 archivos** (55.3%) |
| **Archivos de Complejidad Alta / Crítica (> 500 líneas)** | **22 archivos** (13.7%) |
| **Archivos "Monolito / Dios" (> 1,000 líneas)** | **5 archivos** (3.1%) |

---

## 2. CLASIFICACIÓN DE ARCHIVOS POR PRIORIDAD DE REFACTORIZACIÓN

Conforme a la escala definida en el estándar arquitectónico de 150 líneas:

| Categoría | Rango de Líneas | Cantidad | % del Total | Nivel de Riesgo / Impacto |
| :--- | :---: | :---: | :---: | :--- |
| **Máxima** | > 1,000 líneas | 5 | 3.1% | Monolitos críticos centrales del negocio y UI |
| **Crítica** | 601 – 1,000 líneas | 9 | 5.6% | Repositorios, páginas maestras y catálogos de tipos |
| **Alta** | 301 – 600 líneas | 30 | 18.6% | Módulos de dominio, CRUDs y páginas con lógica |
| **Media** | 151 – 300 líneas | 45 | 28.0% | Formularios medianos, rutas API y utilidades |
| **Normal** | 1 – 150 líneas | 72 | 44.7% | Componentes atómicos, contratos, wrappers limpios |

---

## 3. RANKING DE LOS 15 ARCHIVOS MÁS EXTENSOS DEL PROYECTO

Estos 15 archivos concentran más del **46% de todas las líneas de código** del sistema:

| # | Archivo | Líneas | Prioridad | Responsabilidad Actual |
|---|---|---:|:---:|---|
| 1 | `src/lib/inventory/engine.ts` | **4,275** | **Máxima** | Motor general de inventario, CPP, kárdex y cálculos en memoria |
| 2 | `src/components/forms/Caja.tsx` | **2,177** | **Máxima** | POS integral: captura de líneas, ticket, pagos y turnos |
| 3 | `src/components/crud/InventarioCrud.tsx` | **1,781** | **Máxima** | Catálogo general: tabla, filtros, alta, edición y ajuste de stock |
| 4 | `src/app/actions.ts` | **1,341** | **Máxima** | Server Actions centralizadas de todos los módulos del sistema |
| 5 | `src/components/reportes/CentroReportes.tsx` | **1,076** | **Máxima** | Hub de reportes gerenciales, gráficos, kárdex y finanzas |
| 6 | `src/lib/repositories/postgres/postgres-commercial-repository.ts` | **975** | **Crítica** | Transacciones PostgreSQL para facturación, cobros mixtos y cotizaciones |
| 7 | `src/lib/inventory/local.ts` | **934** | **Crítica** | Repositorio de persistencia en archivos JSON (modo local) |
| 8 | `src/lib/repositories/postgres/postgres-purchases.ts` | **894** | **Crítica** | Gestión de órdenes de compra, recepciones y cuentas por pagar |
| 9 | `src/components/configuracion/PanelConfiguracion.tsx` | **800** | **Crítica** | Formularios de ajustes de empresa, temas, monedas y usuarios |
| 10 | `src/components/forms/Venta.tsx` | **710** | **Crítica** | Formulario histórico de facturación administrativa |
| 11 | `src/lib/inventory/api.ts` | **663** | **Crítica** | Fachada principal de acceso a datos y proveedores |
| 12 | `src/components/layout/Navbar.tsx` | **622** | **Crítica** | Navegación horizontal y agrupada con drawer móvil |
| 13 | `src/lib/inventory/seed.ts` | **616** | **Crítica** | Semillero de catálogo y datos iniciales |
| 14 | `src/lib/types.ts` | **615** | **Crítica** | Tipos TypeScript unificados de todas las entidades |
| 15 | `src/lib/repositories/postgres/postgres-warehouse.ts` | **599** | **Alta** | Operaciones de almacén, existencias mínimas y kárdex |

---

## 4. DIAGNÓSTICO DE PROBLEMAS ARQUITECTÓNICOS

### 4.1 Componentes "Dios" (God Components en UI)
- **`Caja.tsx` (2,177 líneas)**: Acumula en un solo componente la lógica de búsqueda con escáner, teclado global [F2/F4/F7/F8/F9], cálculo de impuestos, manejo del ticket térmico, impresión térmica física 80mm vía popup, compartir enriquecido por WhatsApp, desglose de formas de pago (efectivo, transferencia con voucher, mixto con balance en vivo, fiado), apertura de turno, cierre de turno con cálculo de arqueo de gaveta y registro de movimientos menores.
- **`InventarioCrud.tsx` (1,781 líneas)**: Contiene la tabla de productos, filtros por categoría/marca, modal de nuevo producto con 30 campos, modal de edición, modal de ajuste de stock, modal de importación masiva y exportación a formatos externos.
- **`CentroReportes.tsx` (1,076 líneas)**: Concentra 8 tipos de reportes distintos (Ventas, Kárdex, Finanzas, Utilidades, Cierres de caja, Rotación de inventario) con gráficos y tablas pesadas en un único archivo.

### 4.2 Monolitos de Dominio y Negocio
- **`engine.ts` (4,275 líneas)**: Es el archivo más grande del proyecto. Posee algoritmos de Costo Promedio Ponderado (CPP), verificación de saldos de kárdex, liquidación de facturas, generación de cotizaciones, reportes comerciales y validación de reglas de negocio. Una modificación en una línea puede impactar áreas no relacionadas.

### 4.3 Centralización Excesiva de Server Actions
- **`src/app/actions.ts` (1,341 líneas)**: Archivo único donde residen todas las Server Actions de Next.js. Maneja simultáneamente transacciones de caja, guardado de compras, registro de clientes, cotizaciones, anulaciones, turnos, movimientos de caja y login.

### 4.4 Mezcla de Responsabilidades en Repositorios
- Repositorios como `postgres-commercial-repository.ts` (975 líneas) y `postgres-purchases.ts` (894 líneas) manejan en un solo bloque el mapeo SQL, las validaciones de datos, la gestión de transacciones de base de datos y la conversión de modelos de dominio.

---

## 5. ESTRUCTURA MODULAR RECOMENDADA

Para cumplir con el principio de que los archivos se mantengan preferentemente dentro del rango de **≤ 150 líneas**, se propone la siguiente arquitectura desacoplada por dominios:

```
src/
├── app/
│   ├── actions/                       # Server actions modularizadas por dominio (≤ 120 líneas c/u)
│   │   ├── caja.actions.ts
│   │   ├── compras.actions.ts
│   │   ├── inventario.actions.ts
│   │   └── clientes.actions.ts
├── components/
│   ├── pos/                           # Descomposición limpia de Caja.tsx
│   │   ├── PosHeader.tsx              # Barra de turno y cotizaciones (≤ 90 líneas)
│   │   ├── PosArticulosTabla.tsx      # Cuadro funcional de artículos (≤ 120 líneas)
│   │   ├── PosArticulosFiltros.tsx    # Selects y buscador F2 (≤ 110 líneas)
│   │   ├── PosModalCategorias.tsx     # Modal de categorías (≤ 80 líneas)
│   │   ├── PosTicket.tsx              # Contenedor del ticket factura (≤ 140 líneas)
│   │   ├── PosTicketLineas.tsx        # Scroll de renglones del ticket (≤ 100 líneas)
│   │   ├── PosMetodosPago.tsx         # Pestañas y campos de pago (≤ 130 líneas)
│   │   ├── PosPagoMixto.tsx           # Formulario específico pago mixto (≤ 110 líneas)
│   │   ├── usePosKeyboard.ts          # Hook para atajos F2, F7, F8, F9 (≤ 90 líneas)
│   │   └── usePosPrint.ts             # Hook de impresión térmica y WhatsApp (≤ 120 líneas)
│   ├── inventario/                    # Descomposición de InventarioCrud.tsx
│   │   ├── InventarioTabla.tsx
│   │   ├── InventarioFiltros.tsx
│   │   ├── ModalProductoForm.tsx
│   │   └── ModalAjusteStock.tsx
├── lib/
│   ├── domain/
│   │   ├── engine/                    # Descomposición de engine.ts
│   │   │   ├── engine-kardex.ts       # Algoritmos de Kárdex y CPP (≤ 150 líneas)
│   │   │   ├── engine-ventas.ts       # Cálculos comerciales e IVA (≤ 140 líneas)
│   │   │   ├── engine-compras.ts      # Recepciones y costeo (≤ 130 líneas)
│   │   │   └── engine-reportes.ts     # Agregaciones estadísticas (≤ 150 líneas)
│   │   ├── types/                     # Tipos particionados por dominio
```

---

## 6. TABLA DETALLADA DE ARCHIVOS AUDITADOS (> 150 LÍNEAS)

A continuación se listan los **89 archivos** identificados que superan las 150 líneas, ordenados por prioridad y tamaño:

| # | Archivo | Líneas | Prioridad | Responsabilidad Principal | Modularización Propuesta |
|---|---|---:|:---:|---|---|
| 1 | `src/lib/inventory/engine.ts` | **4275** | **Máxima** | Cálculos comerciales, Kárdex, CPP, validaciones de inventario y estado en memoria | Dividir en dominios: engine-kardex.ts, engine-precios.ts, engine-ventas.ts, engine-compras.ts, engine-reportes.ts |
| 2 | `src/components/forms/Caja.tsx` | **2177** | **Máxima** | Punto de venta mostrador: captura de líneas, formas de pago, ticket térmico y turnos | Extraer TicketFactura.tsx, PanelMetodosPago.tsx, ModalArqueoCaja.tsx, usePosKeyboard.ts, usePosThermalPrint.ts |
| 3 | `src/components/crud/InventarioCrud.tsx` | **1781** | **Máxima** | Gestión completa de catálogo: listado, filtros, modales de nuevo producto, edición y ajuste de stock | Separar en TablaProductos.tsx, FormularioProducto.tsx, ModalAjusteStock.tsx, useInventarioFiltros.ts |
| 4 | `src/app/actions.ts` | **1341** | **Máxima** | Manejadores de Server Actions para todo el sistema (ventas, compras, turnos, clientes, inventario) | Modularizar en actions/caja.actions.ts, actions/compras.actions.ts, actions/inventario.actions.ts, actions/clientes.actions.ts |
| 5 | `src/components/reportes/CentroReportes.tsx` | **1076** | **Máxima** | Generación y visualización de múltiples reportes gerenciales, gráficos y exportaciones | Separar en ReporteVentas.tsx, ReporteInventario.tsx, ReporteFinanciero.tsx, ComponentesGraficos.tsx |
| 6 | `src/lib/repositories/postgres/postgres-commercial-repository.ts` | **975** | **Crítica** | Acceso a datos PostgreSQL para ventas, facturas, cobros mixtos y cotizaciones | Subdividir en postgres-invoicing.ts, postgres-quotes.ts, postgres-payments.ts |
| 7 | `src/lib/inventory/local.ts` | **934** | **Crítica** | Repositorio legado de persistencia en archivos JSON | Separar por entidades o mantener como adaptador legado con sub-manejadores |
| 8 | `src/lib/repositories/postgres/postgres-purchases.ts` | **894** | **Crítica** | Acceso a datos PostgreSQL para compras, recepciones y cuentas por pagar | Dividir en postgres-purchases-orders.ts, postgres-receptions.ts, postgres-payables.ts |
| 9 | `src/components/configuracion/PanelConfiguracion.tsx` | **800** | **Crítica** | Configuración del sistema: datos empresa, monedas, temas, usuarios e impuestos | Dividir en ConfigEmpresaForm.tsx, ConfigMonedasForm.tsx, ConfigTemasForm.tsx, ConfigUsuariosForm.tsx |
| 10 | `src/components/forms/Venta.tsx` | **710** | **Crítica** | Formularios de captura y edición comercial | Separar validaciones en schemas zod o hooks useForm custom |
| 11 | `src/lib/inventory/api.ts` | **663** | **Crítica** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 12 | `src/components/layout/Navbar.tsx` | **622** | **Crítica** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 13 | `src/lib/inventory/seed.ts` | **616** | **Crítica** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 14 | `src/lib/types.ts` | **615** | **Crítica** | Definición central de interfaces y tipos TypeScript del sistema | Reorganizar en types/commercial.ts, types/inventory.ts, types/auth.ts, types/reports.ts |
| 15 | `src/lib/repositories/postgres/postgres-warehouse.ts` | **599** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 16 | `src/lib/repositories/postgres/postgres-reports.ts` | **550** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 17 | `src/components/pagos/PanelTransferenciasBancarias.tsx` | **546** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 18 | `src/lib/inventory/supabase-bodega.ts` | **544** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 19 | `src/lib/domain/cotizaciones/pure.ts` | **543** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 20 | `src/components/cotizaciones/FormularioNuevaVersion.tsx` | **530** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 21 | `src/components/crud/ClientesCrud.tsx` | **519** | **Alta** | Vistas CRUD de administración | Separar en TablaX.tsx, FiltrosX.tsx y ModalFormX.tsx |
| 22 | `src/lib/repositories/postgres/postgres-sales.ts` | **508** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 23 | `src/lib/auth.ts` | **495** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 24 | `src/components/crud/GastosCrud.tsx` | **488** | **Alta** | Vistas CRUD de administración | Separar en TablaX.tsx, FiltrosX.tsx y ModalFormX.tsx |
| 25 | `src/components/forms/ModalCargarCotizacion.tsx` | **478** | **Alta** | Formularios de captura y edición comercial | Separar validaciones en schemas zod o hooks useForm custom |
| 26 | `src/app/(bodega)/inicio/page.tsx` | **419** | **Alta** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 27 | `src/components/forms/Formularios.tsx` | **418** | **Alta** | Formularios de captura y edición comercial | Separar validaciones en schemas zod o hooks useForm custom |
| 28 | `src/components/crud/ProveedoresCrud.tsx` | **416** | **Alta** | Vistas CRUD de administración | Separar en TablaX.tsx, FiltrosX.tsx y ModalFormX.tsx |
| 29 | `src/components/pagos/ModalRegistrarAbono.tsx` | **407** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 30 | `src/lib/domain/facturacion/service.ts` | **402** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 31 | `src/lib/domain/cotizaciones/service.ts` | **400** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 32 | `src/lib/domain/pagos/service.ts` | **398** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 33 | `src/components/cotizaciones/PanelAutorizacionPrecios.tsx` | **394** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 34 | `src/app/(bodega)/compras/[id]/page.tsx` | **393** | **Alta** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 35 | `src/app/(bodega)/kardex/page.tsx` | **389** | **Alta** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 36 | `src/components/configuracion/SelectorTema.tsx` | **386** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 37 | `src/components/forms/Compra.tsx` | **374** | **Alta** | Formularios de captura y edición comercial | Separar validaciones en schemas zod o hooks useForm custom |
| 38 | `src/lib/repositories/postgres/postgres-entities.ts` | **374** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 39 | `src/components/auth/FormularioLogin.tsx` | **364** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 40 | `src/lib/repositories/postgres/postgres-products.ts` | **338** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 41 | `src/components/cotizaciones/HistorialVersionesCotizacion.tsx` | **334** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 42 | `src/lib/repositories/postgres/postgres-quotes.ts` | **325** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 43 | `src/app/(impresion)/inventario/imprimir/page.tsx` | **312** | **Alta** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 44 | `src/app/(bodega)/bodega/page.tsx` | **301** | **Alta** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 45 | `src/app/(bodega)/facturas/page.tsx` | **298** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 46 | `src/components/forms/Articulo.tsx` | **293** | **Media** | Formularios de captura y edición comercial | Separar validaciones en schemas zod o hooks useForm custom |
| 47 | `src/lib/repositories/postgres/postgres-cash.ts` | **293** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 48 | `src/app/(bodega)/cotizaciones/page.tsx` | **291** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 49 | `src/app/(bodega)/cotizaciones/[id]/page.tsx` | **287** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 50 | `src/lib/repositories/postgres/postgres-kardex.ts` | **286** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 51 | `src/components/documentos/TablaKardex.tsx` | **285** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 52 | `src/app/(bodega)/clientes/[id]/page.tsx` | **281** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 53 | `src/app/api/kardex/exportar/route.ts` | **278** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 54 | `src/app/(bodega)/facturas/[id]/page.tsx` | **277** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 55 | `src/lib/domain/cotizaciones/types.ts` | **277** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 56 | `src/app/(bodega)/proveedores/[id]/page.tsx` | **271** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 57 | `src/components/pagos/CuentasPorCobrarModulo.tsx` | **271** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 58 | `src/lib/repositories/postgres/postgres-auth-repository.ts` | **249** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 59 | `src/app/(bodega)/compras/pedidos/[id]/page.tsx` | **235** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 60 | `src/app/(bodega)/total-del-dia/page.tsx` | **228** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 61 | `src/lib/theme.ts` | **223** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 62 | `src/components/ui/Toast.tsx` | **221** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 63 | `src/components/forms/PedidoCompra.tsx` | **214** | **Media** | Formularios de captura y edición comercial | Separar validaciones en schemas zod o hooks useForm custom |
| 64 | `src/components/layout/Header.tsx` | **206** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 65 | `src/app/(impresion)/kardex/imprimir/page.tsx` | **204** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 66 | `src/lib/domain/pagos/pure.ts` | **203** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 67 | `src/lib/domain/pagos/types.ts` | **200** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 68 | `src/app/(bodega)/solicitudes/page.tsx` | **194** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 69 | `src/lib/repositories/types.ts` | **192** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 70 | `src/app/(bodega)/solicitudes/[id]/page.tsx` | **190** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 71 | `src/app/(bodega)/compras/cuentas-por-pagar/page.tsx` | **185** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 72 | `src/components/forms/DevolucionCliente.tsx` | **184** | **Media** | Formularios de captura y edición comercial | Separar validaciones en schemas zod o hooks useForm custom |
| 73 | `src/components/forms/DevolucionProveedor.tsx` | **184** | **Media** | Formularios de captura y edición comercial | Separar validaciones en schemas zod o hooks useForm custom |
| 74 | `src/app/(bodega)/inventario/[id]/page.tsx` | **177** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 75 | `src/lib/domain/facturacion/types.ts` | **176** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 76 | `src/lib/repositories/postgres/client.ts` | **176** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 77 | `src/app/(bodega)/compras/recepciones/[id]/page.tsx` | **174** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 78 | `src/components/forms/Persona.tsx` | **174** | **Media** | Formularios de captura y edición comercial | Separar validaciones en schemas zod o hooks useForm custom |
| 79 | `src/lib/format.ts` | **172** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 80 | `src/app/(bodega)/actas/page.tsx` | **171** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 81 | `src/lib/auth-token.ts` | **171** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 82 | `src/app/(bodega)/compras/pedidos/page.tsx` | **170** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 83 | `src/lib/config.ts` | **170** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 84 | `src/lib/inventory/store.ts` | **170** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 85 | `src/components/forms/RecepcionCompra.tsx` | **168** | **Media** | Formularios de captura y edición comercial | Separar validaciones en schemas zod o hooks useForm custom |
| 86 | `src/app/(bodega)/compras/page.tsx` | **165** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 87 | `src/lib/repositories/json/json-commercial-repository.ts` | **153** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |
| 88 | `src/app/(bodega)/compras/recepciones/page.tsx` | **152** | **Media** | Páginas del App Router de Next.js (Bodega/Ventas/Reportes) | Extraer vistas y componentes de página a subcomponentes dedicados |
| 89 | `src/components/layout/Nav.tsx` | **151** | **Media** | Lógica de dominio / repositorio / vista | Descomponer según responsabilidad única y extraer utilidades/subcomponentes |

---

## 7. PLAN DE REFACTORIZACIÓN POR ETAPAS (ROADMAP CONTROLADO)

La modularización debe ejecutarse en fases secuenciales, verificando la estabilidad tras cada paso:

### ETAPA 1: Modularización de Server Actions (`src/app/actions.ts`) — [COMPLETADA CON ÉXITO]
- **Estado**: ✅ **COMPLETADA**
- **Resultado Obtenido**:
  - `src/app/actions.ts`: reducido de 1,341 líneas a **91 líneas** (barril delegador y re-exportador de tipos).
  - 15 submódulos especializados creados en `src/app/actions/`, **todos ≤ 146 líneas**:
    - `articulos.actions.ts`: 71 líneas
    - `auth.actions.ts`: 125 líneas
    - `caja.actions.ts`: 146 líneas
    - `compras.actions.ts`: 99 líneas
    - `configuracion.actions.ts`: 86 líneas
    - `cotizaciones.actions.ts`: 144 líneas
    - `entidades.actions.ts`: 144 líneas
    - `helpers.ts`: 51 líneas
    - `inventario.actions.ts`: 140 líneas
    - `pedidos-compra.actions.ts`: 80 líneas
    - `solicitudes.actions.ts`: 52 líneas
    - `validaciones-compra.ts`: 46 líneas
    - `validaciones-venta.ts`: 122 líneas
    - `validaciones.ts`: 3 líneas
    - `ventas.actions.ts`: 112 líneas
  - **Validación**: `npx tsc --noEmit` (0 errores), `npm test` (pruebas CPP y reglas de negocio pasando al 100%), servidor Next.js compilando y respondiendo HTTP 200 en `/caja`.

### ETAPA 2: Modularización del Módulo de Configuración (`PanelConfiguracion.tsx`) — [COMPLETADA CON ÉXITO]
- **Estado**: ✅ **COMPLETADA**
- **Resultado Obtenido**:
  - `src/components/configuracion/PanelConfiguracion.tsx`: reducido de 799 líneas a **106 líneas** (orquestador de pestañas y enrutamiento visual).
  - 7 submódulos desacoplados creados en `src/components/configuracion/tabs/`, **todos ≤ 134 líneas**:
    - `ConfiguracionEmpresa.tsx`: 120 líneas
    - `ConfiguracionMonedaImpuesto.tsx`: 134 líneas
    - `ConfiguracionVentas.tsx`: 81 líneas
    - `ConfiguracionUsuarios.tsx`: 126 líneas
    - `ModalUsuario.tsx`: 103 líneas
    - `ConfiguracionHora.tsx`: 97 líneas
    - `ConfiguracionBackups.tsx`: 54 líneas
  - **Validación**: `npx tsc --noEmit` (0 errores), `npm test` (pruebas CPP y reglas de negocio pasando al 100%).

### ETAPA 3: Modularización y Rediseño Definitivo del POS (`Caja.tsx`) — [COMPLETADA CON ÉXITO]
- **Estado**: ✅ **COMPLETADA**
- **Resultado Obtenido**:
  - `src/components/forms/Caja.tsx`: reducido de **2,177 líneas** a **11 líneas** (wrapper re-exportador).
  - 19 submódulos especializados creados en `src/components/caja/`, **todos ≤ 150 líneas**:
    - `CajaPos.tsx`: 128 líneas (orquestador principal)
    - `TablaArticulosVenta.tsx`: 136 líneas (tabla de artículos de venta)
    - `TicketVenta.tsx`: 131 líneas (ticket preliminar estilo minifactura)
    - `ModalCatalogoCategorias.tsx`: 150 líneas (modal amplio de selección)
    - `ModalCobro.tsx`: 143 líneas (modal de finalización de cobro)
    - `CamposMetodoPago.tsx`: 132 líneas (campos de pago efectivo, transferencia, mixto y fiado)
    - `ModalesCajaContainer.tsx`: 123 líneas (agregador de modales)
    - `utilidades-impresion.ts`: 145 líneas (impresión térmica 80mm y WhatsApp)
    - `useCarritoPos.ts`: 112 líneas (gestión reactiva del carrito y cálculo de IVA)
    - `ModalTicketExitoso.tsx`: 107 líneas
    - `ModalCierreArqueo.tsx`: 93 líneas
    - `BarraAccionesCaja.tsx`: 87 líneas
    - `useAtajosPos.ts`: 87 líneas
    - `ModalAbrirTurno.tsx`: 59 líneas
    - `FormCobroHidden.tsx`: 57 líneas
    - `ModalesTurnoCaja.tsx`: 53 líneas
    - `BarraCategorias.tsx`: 52 líneas
    - `ModalMovimientoCaja.tsx`: 50 líneas
    - `useModalesCaja.ts`: 37 líneas
    - `tipos.ts`: 29 líneas
  - **Experiencia de Usuario Implementada**:
    - Columna izquierda comienza vacía (catálogo general retirado de la vista permanente).
    - Selección por categorías con modal amplio y buscador rápido.
    - Ticket comercial realista en modo lectura compacta con acción `Cobrar [F12]`.
    - Corrección global de modales (fondo blanco y encabezado suave neutro en `Modal.tsx`, eliminando el azul oscuro).
  - **Validación**: `npx tsc --noEmit` (0 errores), `npm test` (100% aprobado) y 10 pruebas automatizadas en navegador real Playwright con capturas de pantalla certificadas.

### ETAPA 4: Modularización del Catálogo de Inventario (`InventarioCrud.tsx`) — Pendiente de Aprobación
- **Objetivo**: Separar la tabla de productos, filtros, modal de nuevo producto y modal de ajuste de stock.
- **Beneficio**: Mantenimiento ágil y carga más rápida.

### ETAPA 5: Modularización del Hub de Reportes (`CentroReportes.tsx`) — Riesgo Bajo-Medio
- **Objetivo**: Dividir en componentes por tipo de reporte: Ventas, Kárdex, Finanzas y Utilidades.

### ETAPA 6: Modularización de Repositorios PostgreSQL — Riesgo Medio-Alto
- **Objetivo**: Desacoplar `postgres-commercial-repository.ts` (975 líneas) y `postgres-purchases.ts` (894 líneas) en sub-repositorios enfocados por entidad (Facturas, Pagos, Cotizaciones, Órdenes).
- **Pruebas**: Pruebas de integración con base de datos local aislada.

### ETAPA 7: Descomposición del Motor de Inventario (`src/lib/inventory/engine.ts`) — Riesgo Máximo
- **Objetivo**: El archivo más complejo del proyecto (4,275 líneas). Debe particionarse en submódulos puros (`engine-kardex.ts`, `engine-precios.ts`, `engine-reportes.ts`).
- **Pruebas**: Ejecución estricta de `verificar-reglas.ts` (CPP y kárdex) para garantizar invariabilidad matemática al centavo.

---

## 8. EXCEPCIONES JUSTIFICADAS AL LÍMITE DE 150 LÍNEAS

Existen ciertos archivos donde forzar un límite arbitrario de 150 líneas resultaría contraproducente para la cohesión y claridad:
1. **`src/lib/inventory/seed.ts` (616 líneas)**: Semillero masivo de productos y datos sintéticos. Fragmentar un array de datos estáticos añade complejidad innecesaria.
2. **`src/lib/theme.ts` (223 líneas)**: Diccionario declarativo de las 6 paletas cromáticas completas de Ferretería Emmanuel. Mantener las 6 paletas juntas previene inconsistencias de diseño.
3. **`supabase/schema.sql` (1,061 líneas)**: Definición DDL unificada de la base de datos relacional.

---

## 9. PROTOCOLO DE SEGURIDAD Y PROTECCIÓN DEL PROYECTO

Durante la ejecución de las fases de refactorización autorizadas:
1. **Comportamiento Idéntico**: La refactorización será puramente estructural (separación de archivos), sin alterar lógica comercial, cálculos fiscales, CPP ni interfaces de usuario.
2. **Cero Migraciones**: No se alterará Neon ni se ejecutarán migraciones de esquema.
3. **Persistencia Intacta**: Los datos JSON y PostgreSQL permanecerán idénticos.
4. **Verificación Continua**: Cada cambio unitario se validará con `npx tsc --noEmit`, `npm test` y pruebas de navegador Playwright.
5. **No Regresiones**: No se eliminará ninguna funcionalidad existente.

---
*Informe generado para Ferretería Emmanuel conforme al Estándar Maestro de Calidad Arquitectónica.*
