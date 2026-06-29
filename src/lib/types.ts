export interface Recipient {
  RUC: string;
  CODIGO: string;
  NOMBRE: string;
  CORREO: string;
}

export interface Invoice {
  TIPO_COMPROBANTE: string;
  SERIE_COMPROBANTE: string;
  RUC_EMISOR: string;
  RAZON_SOCIAL_EMISOR: string;
  OBSERVACIONES: string;
}

export interface GroupedData {
  recipient: Recipient;
  invoices: Invoice[];
}

export interface ColumnMapping {
  [key: string]: string; // clave del objeto -> nombre de la columna en Excel
}

export interface ExcelPreview {
  headers: string[];
  firstRow: Record<string, string>;
}

export type TrackingStatus = 'Pendiente' | 'Solicitado' | 'Anulado SRI' | 'Nota Credito' | 'Rechazado';

export interface TrackedDocument {
  id: string; // RUC_EMISOR + TIPO_COMPROBANTE + SERIE_COMPROBANTE
  rucEmisor: string;
  razonSocialEmisor: string;
  tipoComprobante: string;
  serieComprobante: string;
  observaciones: string;
  correoEmisor: string;
  status: TrackingStatus;
  fechaCreacion: string; // ISO String
  fechaActualizacion: string; // ISO String
  notas?: string; // Comentarios adicionales
  valorFactura?: number; // Obtenido del robot
  valorNotaCredito?: number; // Obtenido del robot
  saldoNeto?: number; // Obtenido del robot
  notaCreditoAsociada?: string; // Obtenido del robot
  estadoSri?: string; // Obtenido del robot
}

