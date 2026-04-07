const STORAGE_KEY = 'hola-mails-recipients';
const TEMPLATE_KEY = 'hola-mails-template';

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

export function clearRecipientDataFromStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear data from localStorage:', error);
  }
}
