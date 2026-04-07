# Plan de Implementación: Mapeo Dinámico y Seguridad

Este plan detalla los pasos para mejorar la seguridad del proyecto y añadir la funcionalidad de mapeo dinámico de columnas de Excel solicitada.

## 1. Seguridad de Dependencias (`package.json`)
Se ha revisado el archivo `package.json` para asegurar el uso de versiones seguras y estables.

### Acciones:
1.  **Actualizar `xlsx`**: Cambiar la dependencia de `xlsx` por `@sheetjs/xlsx` o asegurar que la versión `0.18.5` esté instalada correctamente (es la última estable del paquete "xlsx" en npm, pero SheetJS recomienda migrar).
2.  **Actualizar `next`**: Se recomienda subir a la última versión estable de Next.js 14 o 15 para parches de seguridad recientes.
3.  **Auditoría**: Ejecutar `npm audit fix` para resolver vulnerabilidades menores en dependencias indirectas.

---

## 2. Implementación de Mapeo Dinámico
El objetivo es permitir que el usuario elija qué columnas del Excel corresponden a los datos necesarios (RUC, Correo, etc.), con valores predeterminados y previsualización.

### Cambios en el Flujo de la Aplicación:
Se añadirá un nuevo paso intermedio: **"Configurar Columnas"**.

1.  **Paso 1: Subir Datos** (Igual que ahora).
2.  **Paso 2: Mapear Columnas** (NUEVO).
3.  **Paso 3: Previsualizar Agrupación** (Anterior Paso 2).
4.  **Paso 4: Generar Correos** (Anterior Paso 3).

### Componentes y Lógica:

#### A. Estado de Mapeo (`src/lib/types.ts` y `src/app/page.tsx`):
Se definirá un objeto de configuración para cada archivo:
-   **Destinatarios**: `RUC`, `NOMBRE`, `CORREO`, `CODIGO`.
-   **Comprobantes**: `RUC_EMISOR`, `TIPO_COMPROBANTE`, `SERIE_COMPROBANTE`, `RAZON_SOCIAL_EMISOR`, `OBSERVACIONES`.

#### B. Componente `MappingStep`:
-   **Selector Dinámico**: Para cada campo requerido, un dropdown mostrará todos los encabezados detectados en el Excel.
-   **Valores por Defecto**: El selector buscará automáticamente nombres de columnas que coincidan (ej. si encuentra "Email", lo asignará a "CORREO").
-   **Previsualización**: Al lado de cada selector, se mostrará el valor de la **primera fila de datos** del Excel para esa columna. Esto permite al usuario confirmar visualmente que ha elegido la columna correcta.

#### C. Lógica de Procesamiento (`src/app/page.tsx`):
-   `parseFile` se dividirá en dos fases: 
    1.  Extracción de encabezados y muestra (ejemplo).
    2.  Procesamiento completo una vez que el usuario confirme el mapeo.

---

## 3. Cronograma de Cambios
1.  **Hito 1**: Actualizar `package.json` y dependencias.
2.  **Hito 2**: Crear el componente `MappingStep`.
3.  **Hito 3**: Integrar el nuevo paso en el componente principal `Home` (`page.tsx`).
4.  **Hito 4**: Actualizar la lógica de agrupación para usar el mapeo dinámico.
5.  **Hito 5**: Pruebas con archivos Excel de ejemplo.

---

## Notas de Seguridad Adicionales:
- Se mantendrá el procesamiento **100% en el cliente** para garantizar la privacidad de los 50 correos mensuales indicados por el usuario.
- No se requiere base de datos ni autenticación al ser un volumen tan bajo y una herramienta de uso interno directo.
