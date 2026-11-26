# Ferretería Emmanuel — Sistema Integral de Gestión y Punto de Venta (POS)

Sistema web empresarial desarrollado para la administración comercial, facturación, control de inventarios bajo Costo Promedio Ponderado (CPP), cuentas por cobrar y ventas de mostrador de Ferretería Emmanuel.

## Arquitectura y Tecnologías

* **Frontend & Backend:** Next.js 15 (App Router, Server Actions, React 19)
* **Tipado Estricto:** TypeScript 5.8
* **Estilos:** Tailwind CSS 3.4 (Diseño Moderno Empresarial, tokens semánticos)
* **Base de Datos en Producción:** Neon PostgreSQL Serverless (Pool transaccional ACID)
* **Compatibilidad Móvil y PWA:** Progressive Web App instalable para Tablet (iPad / Android) y Celular
* **Impresión:** Soporte nativo para impresoras térmicas de 58 mm y 80 mm

## Módulos del Sistema

1. **Punto de Venta (POS):** Facturación rápida con lector de código de barras, soporte de cotizaciones y emisión de tickets térmicos.
2. **Control de Caja y Turnos:** Apertura de turno, fondo inicial, control de egresos/ingresos y arqueo ciego con corte de caja.
3. **Inventario y Kárdex:** Valoración permanente por Costo Promedio Ponderado (CPP), control de stock mínimo y pedido sugerido automático.
4. **Compras y Recepciones:** Registro de compras a proveedores, control de recepción en bodega y notas oficiales de devolución.
5. **Cotizaciones y Cartera:** Cotizaciones formales y gestión de cobranza con emisión de Recibo Oficial de Caja.
6. **Reportes y Auditoría:** Libros de inventario, exportación institucional a Excel y reimpresión de comprobantes.

## Puesta en Marcha en Producción

### 1. Variables de Entorno (.env.production)

Configurar las siguientes variables en el proveedor de alojamiento (Vercel):

```ini
STORAGE_PROVIDER=postgres
DATABASE_URL=postgres://usuario:password@ep-ejemplo.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_POOLED=postgres://usuario:password@ep-ejemplo-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
AUTH_SECRET=clave_criptografica_segura_de_al_menos_32_caracteres
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### 2. Secuencia de Inicialización SQL en Neon

Ejecutar en orden los scripts ubicados en el directorio `/sql`:

1. `sql/schema.sql`: Estructura base relacional e índices.
2. `sql/migracion_fase3_seguridad_cuentas.sql`: Protección contra fuerza bruta y bloqueo.
3. `sql/migracion_fase3_maestro.sql`: Reglas de gobernanza comercial e inmutabilidad.
4. `sql/indices_rendimiento_fase3.sql`: Índices de rendimiento para consultas masivas.
5. `sql/02_inicializacion_produccion_virgen.sql`: Configuración inicial (IVA 0%, folios en 0 y único usuario admin).

### 3. Scripts de Verificación

```bash
npm run verificar   # Valida reglas de bodega y matemática contable CPP
npx tsc --noEmit    # Comprobación de tipos TypeScript
npm run build       # Compilación de producción Next.js
```

---
© 2026 Ferretería Emmanuel. Todos los derechos reservados.
