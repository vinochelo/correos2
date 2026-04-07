"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Settings2, Info, ChevronRight, CheckCircle2, Users, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { ColumnMapping, ExcelPreview } from "@/lib/types";

interface MappingStepProps {
  recipientPreview: ExcelPreview;
  invoicePreview: ExcelPreview;
  onMap: (recipientMap: ColumnMapping, invoiceMap: ColumnMapping) => void;
  onBack: () => void;
}

const RECIPIENT_FIELDS = [
  { key: "RUC", label: "RUC (Identificador)", required: true },
  { key: "NOMBRE", label: "Nombre / Razón Social", required: true },
  { key: "CORREO", label: "Correo Electrónico", required: true },
  { key: "CODIGO", label: "Código (Opcional)", required: false },
];

const INVOICE_FIELDS = [
  { key: "RUC_EMISOR", label: "RUC Emisor", required: true },
  { key: "RAZON_SOCIAL_EMISOR", label: "Razón Social Emisor", required: true },
  { key: "TIPO_COMPROBANTE", label: "Tipo de Comprobante", required: true },
  { key: "SERIE_COMPROBANTE", label: "Serie / Número", required: true },
  { key: "OBSERVACIONES", label: "Observaciones", required: true },
];

function findDefaultMapping(fieldKey: string, headers: string[]): string {
  const keyLower = fieldKey.toLowerCase();
  // 1. Exact match (ignore case)
  let found = headers.find(h => h.toLowerCase() === keyLower);
  if (found) return found;

  // 2. Partial match (key contains header or vice versa)
  found = headers.find(h => h.toLowerCase().includes(keyLower) || keyLower.includes(h.toLowerCase()));
  if (found) return found;

  // 3. Common synonyms
  if (keyLower === 'correo' || keyLower === 'email') {
    const foundSynonym = headers.find(h => ['mail', 'e-mail', 'direccion', 'envio'].some(s => h.toLowerCase().includes(s)));
    if (foundSynonym) return foundSynonym;
  }

  return "";
}

import { motion } from "framer-motion";

export function MappingStep({ recipientPreview, invoicePreview, onMap, onBack }: MappingStepProps) {
  const [recipientMap, setRecipientMap] = useState<ColumnMapping>({});
  const [invoiceMap, setInvoiceMap] = useState<ColumnMapping>({});

  // Initialize mappings
  useEffect(() => {
    const rMap: ColumnMapping = {};
    RECIPIENT_FIELDS.forEach(f => {
      rMap[f.key] = findDefaultMapping(f.key, recipientPreview.headers);
    });
    setRecipientMap(rMap);

    const iMap: ColumnMapping = {};
    INVOICE_FIELDS.forEach(f => {
      iMap[f.key] = findDefaultMapping(f.key, invoicePreview.headers);
    });
    setInvoiceMap(iMap);
  }, [recipientPreview, invoicePreview]);

  const handleRecipientChange = (field: string, value: string) => {
    setRecipientMap((prev: ColumnMapping) => ({ ...prev, [field]: value }));
  };

  const handleInvoiceChange = (field: string, value: string) => {
    setInvoiceMap((prev: ColumnMapping) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    const requiredRecipientsOk = RECIPIENT_FIELDS.filter(f => f.required).every(f => !!recipientMap[f.key]);
    const requiredInvoicesOk = INVOICE_FIELDS.filter(f => f.required).every(f => !!invoiceMap[f.key]);
    return requiredRecipientsOk && requiredInvoicesOk;
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      <div className="text-center mb-12">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-primary/10 mb-6"
        >
          <Settings2 className="h-10 w-10 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold font-headline tracking-tight sm:text-4xl">
          Configuración Semántica
        </h2>
        <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
          Vincule las columnas de sus documentos con los campos del sistema para garantizar una correcta segmentación de datos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Recipient Mapping */}
        <Card className="border-2 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Base de Destinatarios</CardTitle>
                <CardDescription className="text-xs font-semibold">Configuración de contacto principal</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            {RECIPIENT_FIELDS.map((f, index) => (
              <div key={f.key} className="group flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor={`rec-${f.key}`} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
                    {f.label} {f.required && <span className="text-destructive font-black ml-0.5">*</span>}
                  </Label>
                  {recipientMap[f.key] && (
                    <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> LISTO
                    </span>
                  )}
                </div>
                <Select value={recipientMap[f.key]} onValueChange={(val: string) => handleRecipientChange(f.key, val)}>
                  <SelectTrigger 
                    id={`rec-${f.key}`} 
                    className={cn(
                      "h-12 border-2 rounded-2xl transition-all",
                      !recipientMap[f.key] ? "border-amber-500/50 bg-amber-50/10" : "border-muted group-hover:border-primary/20 focus:border-primary"
                    )}
                  >
                    <SelectValue placeholder="— Seleccione Columna —" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2">
                    {recipientPreview.headers.map(h => (
                      <SelectItem key={h} value={h} className="rounded-lg">{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {recipientMap[f.key] && (
                  <div className="mx-2 p-3 bg-muted/30 rounded-xl border border-muted/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                    <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                    <p className="text-[11px] font-medium text-muted-foreground leading-none truncate">
                      Dato: <span className="font-bold text-foreground">{recipientPreview.firstRow[recipientMap[f.key]] || "n/a"}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Invoice Mapping */}
        <Card className="border-2 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold">Registro de Comprobantes</CardTitle>
                <CardDescription className="text-xs font-semibold">Entidades y montos de gestión</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            {INVOICE_FIELDS.map((f, index) => (
              <div key={f.key} className="group flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <Label htmlFor={`inv-${f.key}`} className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-focus-within:text-primary transition-colors">
                    {f.label} {f.required && <span className="text-destructive font-black ml-0.5">*</span>}
                  </Label>
                  {invoiceMap[f.key] && (
                    <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> LISTO
                    </span>
                  )}
                </div>
                <Select value={invoiceMap[f.key]} onValueChange={(val: string) => handleInvoiceChange(f.key, val)}>
                  <SelectTrigger 
                    id={`inv-${f.key}`} 
                    className={cn(
                      "h-12 border-2 rounded-2xl transition-all",
                      !invoiceMap[f.key] ? "border-amber-500/50 bg-amber-50/10" : "border-muted group-hover:border-primary/20 focus:border-primary"
                    )}
                  >
                    <SelectValue placeholder="— Seleccione Columna —" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2">
                    {invoicePreview.headers.map(h => (
                      <SelectItem key={h} value={h} className="rounded-lg">{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {invoiceMap[f.key] && (
                  <div className="mx-2 p-3 bg-muted/30 rounded-xl border border-muted/50 flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-300">
                    <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                    <p className="text-[11px] font-medium text-muted-foreground leading-none truncate">
                      Dato: <span className="font-bold text-foreground">{invoicePreview.firstRow[invoiceMap[f.key]] || "n/a"}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center gap-8">
        <Alert className="max-w-xl bg-primary/5 dark:bg-primary/10 border-primary/20 rounded-2xl border flex items-center gap-4 py-4 px-6">
          <Info className="h-5 w-5 text-primary shrink-0" />
          <AlertDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
            El sistema ha pre-configurado la mayoría de campos basándose en coincidencia semántica.
          </AlertDescription>
        </Alert>

        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="lg" 
            className="h-14 px-10 font-bold text-muted-foreground hover:text-foreground transition-all" 
            onClick={onBack}
          >
            Atrás
          </Button>
          <Button
            size="lg"
            className="h-14 px-12 font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:grayscale"
            disabled={!isFormValid()}
            onClick={() => onMap(recipientMap, invoiceMap)}
          >
            Confirmar Estructura
            <ChevronRight className="ml-2 h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}
