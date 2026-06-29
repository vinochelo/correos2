import { TrackedDocument, Invoice, GroupedData } from "./types";

const STORAGE_KEY = 'hola-mails-recipients';
const TEMPLATE_KEY = 'hola-mails-template';
const SUBJECT_KEY = 'hola-mails-subject';
const TRACKING_KEY = 'hola-mails-tracking';
const ROBOT_URL_KEY = 'hola-mails-robot-url';
const DEFAULT_ROBOT_URL = 'https://unexceptive-unburnable-chu.ngrok-free.dev';

export interface StoredRecipientData {
  recipientData: any[];
  timestamp: string;
  recipientCount: number;
}

export function saveRecipientDataToStorage(data: StoredRecipientData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
  }
}

export function getRecipientDataFromStorage(): StoredRecipientData | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read data from localStorage:', error);
    return null;
  }
}

export function saveTemplateToStorage(template: string): void {
  try {
    localStorage.setItem(TEMPLATE_KEY, template);
  } catch (error) {
    console.error('Failed to save template to localStorage:', error);
  }
}

export function getTemplateFromStorage(): string | null {
  try {
    return localStorage.getItem(TEMPLATE_KEY);
  } catch (error) {
    console.error('Failed to read template from localStorage:', error);
    return null;
  }
}

export function saveSubjectToStorage(subject: string): void {
  try {
    localStorage.setItem(SUBJECT_KEY, subject);
  } catch (error) {
    console.error('Failed to save subject to localStorage:', error);
  }
}

export function getSubjectFromStorage(): string | null {
  try {
    return localStorage.getItem(SUBJECT_KEY);
  } catch (error) {
    console.error('Failed to read subject from localStorage:', error);
    return null;
  }
}

export function clearRecipientDataFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear data from localStorage:', error);
  }
}

export function getTrackedDocuments(): TrackedDocument[] {
  try {
    const data = localStorage.getItem(TRACKING_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read tracking data from localStorage:', error);
    return [];
  }
}

export function saveTrackedDocuments(docs: TrackedDocument[]): void {
  try {
    localStorage.setItem(TRACKING_KEY, JSON.stringify(docs));
  } catch (error) {
    console.error('Failed to save tracking data to localStorage:', error);
  }
}

export function addDocumentsToTracking(invoices: Invoice[], recipientEmail: string): void {
  const currentDocs = getTrackedDocuments();
  const now = new Date().toISOString();
  const updatedDocs = [...currentDocs];

  invoices.forEach(inv => {
    const id = `${inv.RUC_EMISOR}-${inv.TIPO_COMPROBANTE}-${inv.SERIE_COMPROBANTE}`;
    const existsIdx = updatedDocs.findIndex(d => d.id === id);

    if (existsIdx === -1) {
      updatedDocs.push({
        id,
        rucEmisor: inv.RUC_EMISOR,
        razonSocialEmisor: inv.RAZON_SOCIAL_EMISOR,
        tipoComprobante: inv.TIPO_COMPROBANTE,
        serieComprobante: inv.SERIE_COMPROBANTE,
        observaciones: inv.OBSERVACIONES,
        correoEmisor: recipientEmail,
        status: 'Solicitado',
        fechaCreacion: now,
        fechaActualizacion: now,
      });
    } else {
      updatedDocs[existsIdx] = {
        ...updatedDocs[existsIdx],
        status: 'Solicitado',
        correoEmisor: updatedDocs[existsIdx].correoEmisor || recipientEmail,
        fechaActualizacion: now,
      };
    }
  });

  saveTrackedDocuments(updatedDocs);
}

export function addAllDocumentsToTracking(data: Map<string, GroupedData>): void {
  const currentDocs = getTrackedDocuments();
  const now = new Date().toISOString();
  const updatedDocs = [...currentDocs];

  Array.from(data.values()).forEach(group => {
    const { recipient, invoices } = group;
    const recipientEmail = recipient.CORREO || '';

    invoices.forEach(inv => {
      const id = `${inv.RUC_EMISOR}-${inv.TIPO_COMPROBANTE}-${inv.SERIE_COMPROBANTE}`;
      const existsIdx = updatedDocs.findIndex(d => d.id === id);

      if (existsIdx === -1) {
        updatedDocs.push({
          id,
          rucEmisor: inv.RUC_EMISOR,
          razonSocialEmisor: inv.RAZON_SOCIAL_EMISOR,
          tipoComprobante: inv.TIPO_COMPROBANTE,
          serieComprobante: inv.SERIE_COMPROBANTE,
          observaciones: inv.OBSERVACIONES,
          correoEmisor: recipientEmail,
          status: 'Solicitado',
          fechaCreacion: now,
          fechaActualizacion: now,
        });
      } else {
        updatedDocs[existsIdx] = {
          ...updatedDocs[existsIdx],
          status: 'Solicitado',
          correoEmisor: updatedDocs[existsIdx].correoEmisor || recipientEmail,
          fechaActualizacion: now,
        };
      }
    });
  });

  saveTrackedDocuments(updatedDocs);
}

export function getRobotApiUrl(): string {
  try {
    return localStorage.getItem(ROBOT_URL_KEY) || DEFAULT_ROBOT_URL;
  } catch (error) {
    console.error('Failed to read robot URL from localStorage:', error);
    return DEFAULT_ROBOT_URL;
  }
}

export function saveRobotApiUrl(url: string): void {
  try {
    localStorage.setItem(ROBOT_URL_KEY, url);
  } catch (error) {
    console.error('Failed to save robot URL to localStorage:', error);
  }
}
