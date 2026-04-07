"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, Users, FileText, ArrowRight, FileCheck, Trash2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { saveRecipientDataToStorage, getRecipientDataFromStorage, clearRecipientDataFromStorage, type StoredRecipientData } from "@/lib/storage-utils";

interface UploadStepProps {
  onProcess: () => void;
  onRecipientsUpload: (file: File, startRow: number) => void;
  onInvoicesUpload: (file: File, startRow: number) => void;
  onLoadRecipients?: (data: StoredRecipientData) => void;
  recipientFile: File | null;
  invoiceFile: File | null;
}

const FileUploader = ({
  title,
  description,
  icon: Icon,
  onFileUpload,
  uploadedFile,
  stepNumber,
  isActive
}: {
  title: string,
  description: string,
  icon: React.ElementType,
  onFileUpload: (file: File, startRow: number) => void,
  uploadedFile: File | null,
  stepNumber: number,
  isActive?: boolean
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [startRow, setStartRow] = useState(2);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("El archivo supera el límite de 20MB.");
        return;
      }
      onFileUpload(file, startRow);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        alert("El archivo supera el límite de 20MB.");
        return;
      }
      onFileUpload(file, startRow);
    }
  };

  const isComplete = uploadedFile || isActive;

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-2xl border-2 bg-background/50 backdrop-blur-sm",
      isComplete 
        ? "border-green-500/30 hover:border-green-500/50 hover:shadow-green-500/5" 
        : "hover:border-primary/20 hover:shadow-primary/5"
    )}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-500",
            isComplete
              ? "bg-green-500 text-white shadow-lg shadow-green-500/20"
              : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
          )}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-tighter transition-colors",
                isComplete ? "text-green-600/60" : "text-primary/40 group-hover:text-primary/60"
              )}>
                Paso 0{stepNumber}
              </span>
              <CardTitle className="text-xl font-headline font-bold">{title}</CardTitle>
            </div>
            <CardDescription className="text-xs font-medium leading-relaxed mt-0.5">
              {isActive && !uploadedFile ? "Usando base de datos persistente" : description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className={cn(
            "relative flex flex-col items-center justify-center gap-6 rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-500 cursor-pointer",
            isDragOver 
              ? "border-primary bg-primary/5 scale-[0.98]" 
              : isComplete
                ? "border-green-500/40 bg-green-500/[0.02] hover:border-green-500/60"
                : "border-muted hover:border-primary/40 hover:bg-muted/30",
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {isComplete ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-4"
            >
              <div className="flex justify-center">
                <div className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-3xl text-white shadow-xl",
                  isActive && !uploadedFile ? "bg-emerald-600 shadow-emerald-500/20" : "bg-green-500 shadow-green-500/20"
                )}>
                  <FileCheck className="h-8 w-8" />
                </div>
              </div>
              <div>
                <p className="font-bold text-lg text-foreground line-clamp-1">
                  {uploadedFile ? uploadedFile.name : "Base de Datos Activa"}
                </p>
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em] mt-1",
                  isActive && !uploadedFile ? "text-emerald-600" : "text-green-600"
                )}>
                  {isActive && !uploadedFile ? "Sincronización Habilitada" : "Archivo Verificado"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Actualizar Archivo
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-muted text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-all duration-500">
                  <UploadCloud className="h-8 w-8" />
                </div>
              </div>
              <div>
                <p className="font-bold text-foreground">Arrastre su documento</p>
                <p className="text-xs font-medium text-muted-foreground mt-1">Excel o CSV soportados</p>
              </div>
              <Button
                variant="outline"
                className="rounded-full font-bold px-6 border-2 hover:bg-primary hover:text-primary-foreground transition-all"
              >
                Explorar archivos
              </Button>
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-muted/50">
          <Label htmlFor={`start-row-${stepNumber}`} className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Fila de inicio de datos
          </Label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-primary/40">FILA</span>
            <Input
              type="number"
              id={`start-row-${stepNumber}`}
              value={startRow}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => {
                const row = parseInt(e.target.value, 10);
                setStartRow(row > 0 ? row : 1);
                if (uploadedFile) {
                  onFileUpload(uploadedFile, row > 0 ? row : 1);
                }
              }}
              min="1"
              className="h-9 w-20 text-center font-bold bg-background border-2 rounded-lg focus-visible:ring-primary shadow-sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function UploadStep({
  onProcess,
  onRecipientsUpload,
  onInvoicesUpload,
  onLoadRecipients,
  recipientFile,
  invoiceFile
}: UploadStepProps) {
  const [storedRecipients, setStoredRecipients] = useState<StoredRecipientData | null>(null);

  useEffect(() => {
    const data = getRecipientDataFromStorage();
    setStoredRecipients(data);
  }, []);

  const handleClearRecipients = () => {
    if (window.confirm("¿Estás seguro de que deseas eliminar el archivo de destinatarios guardado?")) {
      clearRecipientDataFromStorage();
      setStoredRecipients(null);
    }
  };

  const formatLastUpdate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold font-headline text-foreground tracking-tight sm:text-4xl">
          Centro de Carga de Datos
        </h2>
        <p className="text-muted-foreground mt-4 text-lg max-w-2xl mx-auto">
          Prepare su campaña de comunicación importando sus archivos de gestión. 
          Sus datos se procesan <span className="text-primary font-semibold">100% localmente</span> para garantizar su privacidad.
        </p>
      </div>

      {storedRecipients && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-black text-foreground text-lg uppercase tracking-tight">
                Base de Destinatarios Activa
              </p>
              <p className="text-sm font-bold text-muted-foreground mt-2 flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Sincronizado: <span className="text-emerald-600 dark:text-emerald-400 font-black">{formatLastUpdate(storedRecipients.timestamp)}</span>
                <span className="mx-2 text-muted-foreground/30">•</span>
                Registros: <span className="text-primary font-black">{storedRecipients.recipientCount}</span>
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearRecipients}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FileUploader
          title="Base de Destinatarios"
          description="Excel con columnas RUC, CODIGO, NOMBRE, CORREO."
          icon={Users}
          onFileUpload={onRecipientsUpload}
          uploadedFile={recipientFile}
          stepNumber={1}
          isActive={!!storedRecipients}
        />
        <FileUploader
          title="Relación de Comprobantes"
          description="Excel con detalles de facturas a anular."
          icon={FileText}
          onFileUpload={onInvoicesUpload}
          uploadedFile={invoiceFile}
          stepNumber={2}
        />
      </div>

      <div className="mt-16 flex flex-col items-center gap-6">
        <Button
          size="lg"
          onClick={onProcess}
          disabled={!invoiceFile}
          className="h-16 px-10 text-lg font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:grayscale"
        >
          Iniciar Procesamiento de Datos
          <ArrowRight className="ml-2 h-6 w-6" />
        </Button>
        
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <FileCheck className="h-4 w-4 text-primary" />
          <span>Cumple con normativas de privacidad de datos locales.</span>
        </div>
      </div>
    </div>
  );
}
