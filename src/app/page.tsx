"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { Header } from "@/components/header";
import { Stepper } from "@/components/stepper";
import { UploadStep } from "@/components/upload-step";
import { MappingStep } from "@/components/mapping-step";
import { PreviewStep } from "@/components/preview-step";
import { GenerateStep } from "@/components/generate-step";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { Recipient, Invoice, GroupedData, ColumnMapping, ExcelPreview } from "@/lib/types";
import type { StoredRecipientData } from "@/lib/storage-utils";
import { 
  saveRecipientDataToStorage, 
  getRecipientDataFromStorage, 
  saveTemplateToStorage, 
  getTemplateFromStorage,
  saveSubjectToStorage,
  getSubjectFromStorage
} from "@/lib/storage-utils";
import { useToast } from "@/hooks/use-toast";
import { Analytics } from "@vercel/analytics/react";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_EMAIL_TEMPLATE = `Estimados señores de {{razon_social_emisor}},

Por medio de la presente, nos dirigimos a ustedes con el fin de solicitar la anulación de los siguientes comprobantes registrados en el SRI.

El motivo de la anulación junto con el detalle de los comprobantes, se encuentra a continuación:

{{razon_social_emisor}} {{ruc_emisor}}

{{invoices_table}}
`;

const DEFAULT_SUBJECT = "Anulación de comprobantes";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function groupInvoicesByRecipient(recipients: Recipient[], invoices: Invoice[]): Map<string, GroupedData> {
  const cleanString = (val: any): string => String(val || '').trim();
  const grouped = new Map<string, GroupedData>();
  const recipientsByRuc = new Map(recipients.map(r => [cleanString(r.RUC), r]));

  // 1. Iterate over invoices as the source of truth.
  for (const invoice of invoices) {
    const rucEmisor = cleanString(invoice.RUC_EMISOR);
    if (!rucEmisor) continue;

    // If the group doesn't exist, create it.
    if (!grouped.has(rucEmisor)) {
      const recipient = recipientsByRuc.get(rucEmisor);
      const initialRecipientData: Recipient = recipient || {
        RUC: rucEmisor,
        NOMBRE: cleanString(invoice.RAZON_SOCIAL_EMISOR),
        CORREO: '', // Mark as no email found
        CODIGO: ''
      };

      grouped.set(rucEmisor, {
        recipient: initialRecipientData,
        invoices: [],
      });
    }

    // 2. Push the invoice to the corresponding group.
    grouped.get(rucEmisor)!.invoices.push(invoice);
  }

  return grouped;
}


export default function Home() {
  const [step, setStep] = useState(1);
  const [sentEmails, setSentEmails] = useState<Set<string>>(new Set());
  const [recipientFile, setRecipientFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);

  // Data for mapping
  const [recipientPreview, setRecipientPreview] = useState<ExcelPreview | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<ExcelPreview | null>(null);
  const [recipientRawData, setRecipientRawData] = useState<any[]>([]);
  const [invoiceRawData, setInvoiceRawData] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // Final processed data
  const [processedData, setProcessedData] = useState<Map<string, GroupedData> | null>(null);
  const [emailTemplate, setEmailTemplate] = useState<string>(DEFAULT_EMAIL_TEMPLATE);
  const [emailSubject, setEmailSubject] = useState<string>(DEFAULT_SUBJECT);

  const { toast } = useToast();

  // Load mount state
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Load stored data on mount
  useEffect(() => {
    if (!isMounted) return;
    
    // Load Recipients
    const storedRecipients = getRecipientDataFromStorage();
    if (storedRecipients) {
      setRecipientRawData(storedRecipients.recipientData);
      if (storedRecipients.recipientData.length > 0) {
        const headers = Object.keys(storedRecipients.recipientData[0]);
        setRecipientPreview({
          headers,
          firstRow: storedRecipients.recipientData[0]
        });
      }
      toast({
        title: "Sincronización Activa",
        description: `${storedRecipients.recipientCount} destinatarios rescatados de la sesión anterior.`,
      });
    }

    // Load Template
    const storedTemplate = getTemplateFromStorage();
    if (storedTemplate) {
      setEmailTemplate(storedTemplate);
    }

    // Load Subject
    const storedSubject = getSubjectFromStorage();
    if (storedSubject) {
      setEmailSubject(storedSubject);
    }
  }, [isMounted, toast]);

  // Save template on change
  useEffect(() => {
    if (emailTemplate !== DEFAULT_EMAIL_TEMPLATE) {
      saveTemplateToStorage(emailTemplate);
    }
  }, [emailTemplate]);

  // Save subject on change
  useEffect(() => {
    if (emailSubject !== DEFAULT_SUBJECT) {
      saveSubjectToStorage(emailSubject);
    }
  }, [emailSubject]);

  const handleResetTemplate = () => {
    setEmailTemplate(DEFAULT_EMAIL_TEMPLATE);
    setEmailSubject(DEFAULT_SUBJECT);
    localStorage.removeItem('hola-mails-template');
    localStorage.removeItem('hola-mails-subject');
    toast({
      title: "Mensaje Reiniciado",
      description: "Se ha restaurado el formato predeterminado.",
    });
  };

  const STEPS = ["Subir Datos", "Mapear", "Previsualizar", "Generar"];

  const parseFilePreview = (file: File, startRow: number): Promise<{ headers: string[], firstRow: any, allRows: any[] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: "",
            raw: false,
          });

          const headerRowIndex = startRow > 1 ? startRow - 2 : 0;
          if (rows.length <= headerRowIndex) {
            reject(new Error(`La fila de encabezado no existe.`));
            return;
          }

          const headers = rows[headerRowIndex].map(h => String(h || '').trim()).filter(h => h !== "");
          const dataRows = rows.slice(startRow - 1);

          const allRowsFormatted = dataRows.map(row => {
            const rowData: any = {};
            let hasData = false;
            headers.forEach((header, index) => {
              const val = String(row[index] ?? '').trim();
              rowData[header] = val;
              if (val !== '') hasData = true;
            });
            return hasData ? rowData : null;
          }).filter(row => row !== null);

          resolve({
            headers,
            firstRow: allRowsFormatted[0] || {},
            allRows: allRowsFormatted
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const handleRecipientsUpload = async (file: File, startRow: number) => {
    setRecipientFile(file);
    try {
      const { headers, firstRow, allRows } = await parseFilePreview(file, startRow);
      setRecipientPreview({ headers, firstRow });
      setRecipientRawData(allRows);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error en destinatarios",
        description: "No se pudo leer el archivo de destinatarios.",
      });
      setRecipientFile(null);
    }
  };

  const handleInvoicesUpload = async (file: File, startRow: number) => {
    setInvoiceFile(file);
    try {
      const { headers, firstRow, allRows } = await parseFilePreview(file, startRow);
      setInvoicePreview({ headers, firstRow });
      setInvoiceRawData(allRows);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error en comprobantes",
        description: "No se pudo leer el archivo de comprobantes.",
      });
      setInvoiceFile(null);
    }
  };

  const handleLoadRecipients = (data: StoredRecipientData) => {
    setRecipientRawData(data.recipientData);

    if (data.recipientData.length > 0) {
      const headers = Object.keys(data.recipientData[0]);
      setRecipientPreview({
        headers,
        firstRow: data.recipientData[0]
      });
    }

    toast({
      title: "Destinatarios cargados",
      description: `${data.recipientCount} destinatarios listos para usar.`,
    });
  };


  const handleStartMapping = () => {
    if (!invoicePreview) {
      toast({
        variant: "destructive",
        title: "Falta archivo de comprobantes",
        description: "Sube el archivo de comprobantes para continuar.",
      });
      return;
    }

    // Auto-process and skip to preview (step 3) by default
    handleProcessAndContinue();
  };

  const handleProcessAndContinue = (recipientMap?: ColumnMapping, invoiceMap?: ColumnMapping) => {
    if (!recipientPreview || !invoicePreview) {
      toast({
        variant: "destructive",
        title: "Faltan archivos",
        description: "Sube ambos archivos para continuar.",
      });
      return;
    }

    toast({
      title: "Procesando...",
      description: "Transformando datos de Excel.",
    });

    // Use provided mapping or auto-detect
    let autoRecipientMap: ColumnMapping;
    let autoInvoiceMap: ColumnMapping;
    let autoDetectedSuccessfully = true;

    if (recipientMap && invoiceMap) {
      // User provided mapping from step 2
      autoRecipientMap = recipientMap;
      autoInvoiceMap = invoiceMap;
    } else {
      // Auto-detect mapping using intelligent matching
      autoRecipientMap = {};
      autoInvoiceMap = {};

      const recipientFields = ["RUC", "NOMBRE", "CORREO", "CODIGO"];
      const invoiceFields = ["RUC_EMISOR", "RAZON_SOCIAL_EMISOR", "TIPO_COMPROBANTE", "SERIE_COMPROBANTE", "OBSERVACIONES"];

      recipientFields.forEach(field => {
        const header = findBestMatch(field, recipientPreview.headers);
        if (header) {
          autoRecipientMap[field] = header;
        } else {
          // CODIGO is often optional, but for a robust mapping, let's just trigger mapping if major ones fall
          if (field !== "CODIGO") autoDetectedSuccessfully = false;
        }
      });

      invoiceFields.forEach(field => {
        const header = findBestMatch(field, invoicePreview.headers);
        if (header) {
          autoInvoiceMap[field] = header;
        } else {
          autoDetectedSuccessfully = false;
        }
      });
    }

    if (!recipientMap && !invoiceMap && !autoDetectedSuccessfully) {
      toast({
        variant: "destructive",
        title: "No se pudieron detectar las columnas",
        description: "Por favor, mapea las columnas manualmente.",
      });
      setStep(2);
      return;
    }

    // Map fields
    const mappedRecipients: Recipient[] = recipientRawData.map(row => ({
      RUC: row[autoRecipientMap["RUC"] || ""] || "",
      NOMBRE: row[autoRecipientMap["NOMBRE"] || ""] || "",
      CORREO: row[autoRecipientMap["CORREO"] || ""] || "",
      CODIGO: row[autoRecipientMap["CODIGO"] || ""] || "",
    })).filter(r => !!r.RUC && r.RUC.trim() !== "");

    const mappedInvoices: Invoice[] = invoiceRawData.map(row => ({
      RUC_EMISOR: row[autoInvoiceMap["RUC_EMISOR"] || ""] || "",
      RAZON_SOCIAL_EMISOR: row[autoInvoiceMap["RAZON_SOCIAL_EMISOR"] || ""] || "",
      TIPO_COMPROBANTE: row[autoInvoiceMap["TIPO_COMPROBANTE"] || ""] || "",
      SERIE_COMPROBANTE: row[autoInvoiceMap["SERIE_COMPROBANTE"] || ""] || "",
      OBSERVACIONES: row[autoInvoiceMap["OBSERVACIONES"] || ""] || "",
    })).filter(i => !!i.RUC_EMISOR && i.RUC_EMISOR.trim() !== "");

    const data = groupInvoicesByRecipient(mappedRecipients, mappedInvoices);

    if (data.size === 0) {
      toast({
        variant: "destructive",
        title: "No se encontraron coincidencias (RUC)",
        description: "Asegúrese de cargar ambos archivos y que los RUC/identificadores coincidan. Use el paso de 'Mapear' si los nombres de las columnas son muy diferentes.",
      });
      setStep(2);
      return;
    }

    // Save only recipients to localStorage
    const storageData: StoredRecipientData = {
      recipientData: recipientRawData,
      timestamp: new Date().toISOString(),
      recipientCount: mappedRecipients.length,
    };
    saveRecipientDataToStorage(storageData);

    setProcessedData(data);
    setStep(3);

    toast({
      title: "¡Éxito!",
      description: `Se agruparon datos para ${data.size} emisores.`,
    });
  };

  // Intelligent matching function
  const findBestMatch = (field: string, headers: string[]): string | undefined => {
    const fieldLower = field.toLowerCase();

    // 1. Exact match
    const exact = headers.find(h => h.toLowerCase() === fieldLower);
    if (exact) return exact;

    // 2. Contains match
    const contains = headers.find(h => h.toLowerCase().includes(fieldLower) || fieldLower.includes(h.toLowerCase()));
    if (contains) return contains;

    // 3. Synonyms
    const synonyms: Record<string, string[]> = {
      'correo': ['email', 'mail', 'e-mail', 'direccion', 'envio'],
      'nombre': ['razon_social', 'razon', 'social', 'contacto', 'nombres', 'cliente', 'proveedor'],
      'ruc': ['identificador', 'id', 'nit', 'cedula', 'ruc_emisor', 'identificacion'],
      'observaciones': ['status', 'estado', 'observacion', 'nota', 'comentario', 'detalle', 'descripcion'],
      'tipo_comprobante': ['tipo', 'documento', 'comprobante', 'doc'],
      'serie_comprobante': ['serie', 'nro', 'numero', 'secuencial', 'num'],
      'razon_social_emisor': ['razon_social', 'nombre', 'emisor', 'cliente'],
      'ruc_emisor': ['ruc', 'id', 'identificacion', 'nit']
    };

    if (synonyms[fieldLower]) {
      const synonymMatch = headers.find(h =>
        synonyms[fieldLower].some(s => h.toLowerCase().includes(s))
      );
      if (synonymMatch) return synonymMatch;
    }

    return undefined;
  };

  const handleGenerate = () => {
    setStep(4);
  };

  const handleBack = () => {
    if (step === 3) {
      // Skip step 2 when going back from step 3
      setStep(1);
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleStartOver = () => {
    setProcessedData(null);
    setSentEmails(new Set());
    setRecipientFile(null);
    setInvoiceFile(null);
    setRecipientPreview(null);
    setInvoicePreview(null);
    setInvoiceRawData([]);
    
    // Clear and reload from storage if exists
    setRecipientRawData([]);
    const storedRecipients = getRecipientDataFromStorage();
    if (storedRecipients) {
      setRecipientRawData(storedRecipients.recipientData);
      if (storedRecipients.recipientData.length > 0) {
        const headers = Object.keys(storedRecipients.recipientData[0]);
        setRecipientPreview({
          headers,
          firstRow: storedRecipients.recipientData[0]
        });
      }
    }
    
    setStep(1);

    toast({
      title: "Sesión Reiniciada",
      description: "Se han limpiado los comprobantes. La base de destinatarios sigue activa si estaba sincronizada.",
    });
  }

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]">
        <div className="absolute inset-x-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/10 opacity-20 blur-[100px]"></div>
      </div>
      
      <Header step={step} emailsSent={sentEmails.size} totalEmails={processedData ? processedData.size : 0} />
      
      <main className="relative pt-12 pb-24">
        <div className="max-w-4xl mx-auto px-4 mb-20">
          <Stepper currentStep={step} steps={STEPS} />
        </div>

        <div className="container mx-auto px-4 px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.22, 1, 0.36, 1] 
              }}
            >
              {step === 1 && (
                <UploadStep
                  onProcess={handleStartMapping}
                  onRecipientsUpload={handleRecipientsUpload}
                  onInvoicesUpload={handleInvoicesUpload}
                  onLoadRecipients={handleLoadRecipients}
                  recipientFile={recipientFile}
                  invoiceFile={invoiceFile}
                />
              )}

              {step === 2 && recipientPreview && invoicePreview && (
                <MappingStep
                  recipientPreview={recipientPreview}
                  invoicePreview={invoicePreview}
                  onMap={handleProcessAndContinue}
                  onBack={handleBack}
                />
              )}

              {step === 3 && processedData && (
                <PreviewStep
                  data={processedData}
                  emailTemplate={emailTemplate}
                  onTemplateChange={setEmailTemplate}
                  emailSubject={emailSubject}
                  onSubjectChange={setEmailSubject}
                  onNext={handleGenerate}
                  onBack={handleBack}
                  onEditMapping={() => setStep(2)}
                  onResetTemplate={handleResetTemplate}
                />
              )}

              {step === 4 && processedData && (
                <div className="space-y-8">
                  {processedData.size > 100 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="max-w-xl mx-auto p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 shadow-sm"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                        <Settings2 className="h-5 w-5" />
                      </div>
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-tight leading-relaxed">
                        Límite de Procesamiento de Lote detectado. Se recomienda el envío en bloques para evitar saturación del cliente Outlook/Mail local.
                      </p>
                    </motion.div>
                  )}
                  <GenerateStep
                    data={processedData}
                    emailTemplate={emailTemplate}
                    emailSubject={emailSubject}
                    onBack={handleBack}
                    onStartOver={handleStartOver}
                    sentEmails={sentEmails}
                    setSentEmails={setSentEmails}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <footer className="border-t bg-muted/20 py-12">
        <div className="container mx-auto px-4 flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-4 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
             <div className="h-8 w-8 rounded bg-foreground flex items-center justify-center text-background font-black text-xs">V2</div>
             <div className="h-px w-8 bg-muted-foreground/30"></div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Correos Pro Enterprise</p>
          </div>
          <div className="max-w-md">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-relaxed">
              Herramienta de nivel industrial desarrollada bajo protocolos de seguridad locales. 
              Ningún dato abandona su navegador. Basado en arquitectura Client-Side-Only.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">Privacy Secured</span>
             <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">TLS 1.3 Readiness</span>
             <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">MIT License</span>
          </div>
        </div>
      </footer>
      <Analytics />
    </div>
  );
}
