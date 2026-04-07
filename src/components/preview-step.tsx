"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { GroupedData } from "@/lib/types";
import { Mail, User, ChevronRight, Info, AlertTriangle, FileText, Eye, Settings2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PreviewStepProps {
    data: Map<string, GroupedData>;
    emailTemplate: string;
    onTemplateChange: (template: string) => void;
    onNext: () => void;
    onBack: () => void;
    onEditMapping?: () => void;
    onResetTemplate?: () => void;
}

export function PreviewStep({ data, emailTemplate, onTemplateChange, onNext, onBack, onEditMapping, onResetTemplate }: PreviewStepProps) {
    const dataArray = Array.from(data.values());

    const availableTags = [
        { tag: "{{razon_social_emisor}}", description: "Razón social del emisor." },
        { tag: "{{ruc_emisor}}", description: "RUC del emisor." },
        { tag: "{{nombre_destinatario}}", description: "Nombre del contacto." },
        { tag: "{{correo_destinatario}}", description: "Email del destinatario." },
        { tag: "{{invoices_table}}", description: "Tabla con detalle de facturas." },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto py-6">
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-primary/10 mb-6">
                    <Eye className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold font-headline tracking-tight sm:text-4xl">
                    Revisión de Proveedores
                </h2>
                <p className="text-muted-foreground mt-4 text-lg">
                    Se han identificado <span className="text-foreground font-bold">{data.size} proveedores</span> con movimientos. 
                    Verifique la integridad de los datos antes de proceder.
                </p>
            </div>

            {/* Prominent Mapping Adjustment Button */}
            <div className="flex justify-center mb-10">
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onEditMapping}
                    className="h-10 rounded-full border-2 border-primary/20 bg-primary/5 text-primary font-bold hover:bg-primary hover:text-white transition-all shadow-lg"
                >
                    <Settings2 className="mr-2 h-4 w-4" />
                    ¿Los datos no coinciden? Ajustar Mapeo de Columnas
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* List of Recipients */}
                <div className="lg:col-span-7 xl:col-span-8">
                    <Card className="border-2 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
                        <CardHeader className="border-b bg-muted/30 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Listado consolidado</CardTitle>
                                        <CardDescription className="text-xs font-semibold">Total: {dataArray.length} destinatarios</CardDescription>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-primary/10 rounded-full">
                                    <span className="text-[10px] font-black tracking-widest text-primary uppercase">Validación OK</span>
                                </div>
                            </div>
                        </CardHeader>
                        <Accordion type="single" collapsible className="w-full" defaultValue={dataArray[0]?.recipient.RUC}>
                            {dataArray.map(({ recipient, invoices }, index) => (
                                <AccordionItem key={`${recipient.RUC}-${index}`} value={recipient.RUC} className="border-b last:border-0">
                                    <AccordionTrigger className="px-6 py-5 hover:bg-muted/50 transition-all hover:no-underline text-left group">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-foreground text-base truncate">{recipient.NOMBRE || invoices[0]?.RAZON_SOCIAL_EMISOR}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {recipient.CORREO ? (
                                                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all">
                                                            <Mail className="h-3 w-3 text-primary" />
                                                            {recipient.CORREO}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs font-bold text-destructive flex items-center gap-1.5">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            Sin correo electrónico
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-3 py-1.5 bg-muted rounded-xl text-[10px] font-black text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                {invoices.length} DOCS
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 pt-2">
                                        <div className="rounded-2xl border-2 border-muted overflow-hidden">
                                            <Table>
                                                <TableHeader className="bg-muted/50">
                                                    <TableRow className="hover:bg-transparent border-0 font-bold uppercase tracking-widest text-[9px]">
                                                        <TableHead className="h-10">Documento</TableHead>
                                                        <TableHead className="h-10">Serie</TableHead>
                                                        <TableHead className="h-10">Nota</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {invoices.map((invoice, invIndex) => (
                                                        <TableRow key={`${invoice.SERIE_COMPROBANTE}-${invIndex}`} className="border-muted/50 last:border-0">
                                                            <TableCell className="py-3 font-bold text-xs">
                                                                 <div className="flex items-center gap-2">
                                                                     <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                                                     {invoice.TIPO_COMPROBANTE}
                                                                 </div>
                                                            </TableCell>
                                                            <TableCell className="py-3"><code className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-md text-muted-foreground">{invoice.SERIE_COMPROBANTE}</code></TableCell>
                                                            <TableCell className="py-3 text-xs text-muted-foreground font-medium">{invoice.OBSERVACIONES || "—"}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </Card>
                </div>

                {/* Sidebar Configuration */}
                <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                    <Card className="border-2 shadow-xl bg-background/50 backdrop-blur-sm sticky top-24">
                        <CardHeader className="border-b bg-primary/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-bold">Editor de Mensaje</CardTitle>
                                        <CardDescription className="text-xs font-semibold">Configure el cuerpo del mensaje</CardDescription>
                                    </div>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={onResetTemplate}
                                    className="h-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                >
                                    <RotateCcw className="mr-1 h-3 w-3" />
                                    Reiniciar
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="email-template" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                                    Cuerpo del Mensaje
                                </Label>
                                <Textarea
                                    id="email-template"
                                    placeholder="Redacte su mensaje aquí..."
                                    className="min-h-[300px] font-sans text-sm border-2 focus:border-primary resize-none rounded-2xl shadow-inner bg-muted/20"
                                    value={emailTemplate}
                                    onChange={(e) => onTemplateChange(e.target.value)}
                                />
                            </div>
                            
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Atributos Dinámicos</p>
                                <div className="grid grid-cols-1 gap-2">
                                    {availableTags.map(t => (
                                        <div key={t.tag} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border-2 border-transparent hover:border-primary/20 transition-all group">
                                            <code className="text-[11px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-lg">{t.tag}</code>
                                            <span className="text-[10px] font-bold text-muted-foreground text-right">{t.description}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="mt-16 flex justify-center items-center gap-6">
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
                    className="h-14 px-12 font-bold shadow-2xl shadow-primary/20 transition-all hover:scale-105 active:scale-95" 
                    onClick={onNext}
                >
                    Confirmar y Generar Correos
                    <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
            </div>
        </div>
    );
}
