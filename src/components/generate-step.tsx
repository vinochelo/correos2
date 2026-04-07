"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import type { GroupedData, Invoice } from "@/lib/types";
import { Mail, Send, RotateCcw, CheckCircle, AlertTriangle, Pencil, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenerateStepProps {
  data: Map<string, GroupedData>;
  emailTemplate: string;
  onBack: () => void;
  onStartOver: () => void;
}

function generateInvoicesTable(invoices: Invoice[]): string {
  const header = `Tipo de Comprobante - Serie - Observaciones`;
  const rows = invoices.map(inv =>
    `${inv.TIPO_COMPROBANTE || ''} - ${inv.SERIE_COMPROBANTE || ''} - ${inv.OBSERVACIONES || ''}`
  );
  return [header, ...rows].join('\n');
}


function generateEmailBody(template: string, groupedData: GroupedData): string {
  const { recipient, invoices } = groupedData;
  const razonSocial = recipient.NOMBRE || invoices[0]?.RAZON_SOCIAL_EMISOR;
  const rucEmisor = recipient.RUC || invoices[0]?.RUC_EMISOR;
  const recipientEmails = recipient.CORREO;
  const invoicesTable = generateInvoicesTable(invoices);

  return template
    .replace(/{{razon_social_emisor}}/g, razonSocial)
    .replace(/{{ruc_emisor}}/g, rucEmisor)
    .replace(/{{nombre_destinatario}}/g, recipient.NOMBRE)
    .replace(/{{correo_destinatario}}/g, recipientEmails)
    .replace(/{{invoices_table}}/g, invoicesTable);
}


import { motion } from "framer-motion";

export function GenerateStep({ data, emailTemplate, onBack, onStartOver }: GenerateStepProps) {
  const [sentEmails, setSentEmails] = useState<Set<string>>(new Set());
  const dataArray = Array.from(data.values());
  const totalEmails = dataArray.length;
  const emailsWithContact = dataArray.filter(d => !!d.recipient.CORREO).length;
  const emailsSent = sentEmails.size;
  const emailsPending = emailsWithContact - emailsSent;
  const missingEmails = totalEmails - emailsWithContact;

  const handleOpenInOutlook = (recipientRuc: string, recipientEmail: string, subject: string, body: string) => {
    const mailtoLink = `mailto:${recipientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;

    const newSent = new Set(sentEmails);
    newSent.add(recipientRuc);
    setSentEmails(newSent);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8">
      <div className="text-center mb-12">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-primary/10 mb-6"
        >
          <Sparkles className="h-10 w-10 text-primary" />
        </motion.div>
        <h2 className="text-3xl font-bold font-headline tracking-tight sm:text-4xl">
          Protocolo de Salida Generado
        </h2>
        <p className="text-muted-foreground mt-4 text-lg">
          Se han estructurado <span className="text-foreground font-bold">{totalEmails} borradores</span> listos para su revisión y envío.
        </p>
      </div>

      {/* Progress Summary Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card className="border-2 shadow-sm bg-background/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Borradores</span>
          <span className="text-3xl font-black font-headline text-foreground">{totalEmails}</span>
        </Card>
        <Card className="border-2 shadow-sm bg-background/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Listos para Envío</span>
          <span className="text-3xl font-black font-headline text-primary">{emailsWithContact}</span>
        </Card>
        <Card className="border-2 shadow-sm bg-background/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-green-600">Procesados</span>
          <span className="text-3xl font-black font-headline text-green-600">{emailsSent}</span>
        </Card>
        <Card className="border-2 shadow-sm bg-background/50 backdrop-blur-sm p-6 flex flex-col items-center justify-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-destructive">Sin Email</span>
          <span className="text-3xl font-black font-headline text-destructive">{missingEmails}</span>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {dataArray.map((groupedData, index) => {
          const { recipient, invoices } = groupedData;
          const recipientEmails = recipient.CORREO;

          const isSent = sentEmails.has(recipient.RUC);
          const hasEmail = !!recipientEmails;
          const razonSocial = recipient.NOMBRE || invoices[0]?.RAZON_SOCIAL_EMISOR;
          const subject = `Comunicación Institucional - Detalle de Comprobantes`;
          const body = generateEmailBody(emailTemplate, groupedData);

          return (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              key={`${recipient.RUC}-${index}`}
            >
              <Card
                className={cn(
                  "group h-full flex flex-col border-2 shadow-sm transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 bg-background/50 backdrop-blur-sm",
                  isSent && "border-green-500/30 bg-green-50/5 dark:bg-green-500/5",
                  !hasEmail && "border-destructive/30 bg-destructive/5"
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-500",
                      isSent 
                        ? "bg-green-600 text-white shadow-lg shadow-green-600/20" 
                        : !hasEmail 
                          ? "bg-destructive text-white" 
                          : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                    )}>
                      {isSent ? <CheckCircle className="h-6 w-6" /> : !hasEmail ? <AlertTriangle className="h-6 w-6" /> : <Mail className="h-6 w-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold truncate group-hover:text-primary transition-colors">
                        {razonSocial}
                      </CardTitle>
                      <CardDescription className="text-xs font-semibold mt-1">
                        {hasEmail ? (
                          <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                            <Send className="h-3 w-3" /> {recipientEmails}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-destructive font-black uppercase tracking-tighter">
                            <AlertTriangle className="h-3 w-3" /> Correo no definido
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Asunto del Protocolo</span>
                    <p className="text-xs font-bold text-foreground line-clamp-1">{subject}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-2xl border-2 border-muted/50 h-40 overflow-y-auto scrollbar-hide">
                    <div className="text-[11px] font-medium text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {body}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    variant={isSent ? "outline" : "default"}
                    className={cn(
                      "w-full h-12 rounded-xl font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-95",
                      isSent && "border-green-600/20 text-green-600 hover:bg-green-600 hover:text-white"
                    )}
                    onClick={() => handleOpenInOutlook(recipient.RUC, recipientEmails, subject, body)}
                  >
                    {isSent ? (
                      <>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Re-enviar Correo
                      </>
                    ) : hasEmail ? (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Enviar Correo
                      </>
                    ) : (
                      <>
                        <Pencil className="mr-2 h-4 w-4" />
                        Completar y Enviar
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-20 flex flex-col items-center gap-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="lg" 
            className="h-14 px-8 font-bold text-muted-foreground hover:text-foreground transition-all" 
            onClick={onBack}
          >
            Atrás
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            className="h-14 px-10 font-bold border-2 shadow-xl transition-all hover:bg-muted" 
            onClick={onStartOver}
          >
            <RotateCcw className="mr-2 h-5 w-5" />
            Finalizar y Limpiar Todo
          </Button>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
          <Sparkles className="h-3 w-3" />
          <span>Generación Segura Localmente</span>
        </div>
      </div>
    </div>
  );
}
