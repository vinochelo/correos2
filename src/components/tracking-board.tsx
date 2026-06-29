"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  Settings, 
  Plus, 
  Search, 
  FileSpreadsheet, 
  Trash2, 
  Play, 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Edit3, 
  Check, 
  Loader2, 
  HelpCircle,
  RefreshCw,
  SlidersHorizontal
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { TrackedDocument, TrackingStatus, Invoice } from "@/lib/types";
import { 
  getTrackedDocuments, 
  saveTrackedDocuments, 
  getRobotApiUrl, 
  saveRobotApiUrl 
} from "@/lib/storage-utils";
import { motion, AnimatePresence } from "framer-motion";

export function TrackingBoard() {
  const [documents, setDocuments] = useState<TrackedDocument[]>([]);
  const [robotUrl, setRobotUrl] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modals state
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [selectedDocForNotes, setSelectedDocForNotes] = useState<TrackedDocument | null>(null);
  
  // Loading states
  const [queryingIds, setQueryingIds] = useState<Set<string>>(new Set());
  const [isBatchQuerying, setIsBatchQuerying] = useState(false);

  // Form states
  const [newUrl, setNewUrl] = useState("");
  const [manualDoc, setManualDoc] = useState({
    rucEmisor: "",
    razonSocialEmisor: "",
    tipoComprobante: "Factura",
    serieComprobante: "",
    observaciones: "",
    correoEmisor: "",
    status: "Pendiente" as TrackingStatus,
    notas: ""
  });
  const [editingNotes, setEditingNotes] = useState("");

  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    setDocuments(getTrackedDocuments());
    const savedUrl = getRobotApiUrl();
    setRobotUrl(savedUrl);
    setNewUrl(savedUrl);
  }, []);

  const handleSaveDocs = (updatedDocs: TrackedDocument[]) => {
    setDocuments(updatedDocs);
    saveTrackedDocuments(updatedDocs);
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      const allFilteredIds = filteredDocs.map(d => d.id);
      setSelectedIds(new Set(allFilteredIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  // KPI Calculations
  const totalCount = documents.length;
  const countByStatus = (status: TrackingStatus) => documents.filter(d => d.status === status).length;
  const statusStats = {
    Pendiente: countByStatus("Pendiente"),
    Solicitado: countByStatus("Solicitado"),
    SRI: countByStatus("Anulado SRI"),
    NotaCredito: countByStatus("Nota Credito"),
    Rechazado: countByStatus("Rechazado"),
  };

  // Filtering Logic
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.razonSocialEmisor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.rucEmisor.includes(searchQuery) ||
      doc.serieComprobante.includes(searchQuery) ||
      doc.observaciones.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesType = typeFilter === "all" || doc.tipoComprobante === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Export to Excel
  const handleExportToExcel = () => {
    if (filteredDocs.length === 0) {
      toast({
        variant: "destructive",
        title: "Sin datos para exportar",
        description: "No hay documentos en la lista actual que coincidan con los filtros."
      });
      return;
    }

    const exportData = filteredDocs.map(doc => ({
      "RUC Emisor": doc.rucEmisor,
      "Razón Social": doc.razonSocialEmisor,
      "Tipo Comprobante": doc.tipoComprobante,
      "Serie": doc.serieComprobante,
      "Observaciones": doc.observaciones,
      "Correo Emisor": doc.correoEmisor,
      "Estado": doc.status,
      "Factura Valor": doc.valorFactura || 0,
      "Nota Crédito Valor": doc.valorNotaCredito || 0,
      "Saldo Neto": doc.saldoNeto ?? "",
      "N.C. Asociada": doc.notaCreditoAsociada || "",
      "Fecha Creación": new Date(doc.fechaCreacion).toLocaleString(),
      "Fecha Actualización": new Date(doc.fechaActualizacion).toLocaleString(),
      "Comentarios": doc.notas || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Seguimiento");

    // Auto-fit columns
    const maxLens = Object.keys(exportData[0]).map(key => {
      let max = key.length;
      exportData.forEach(row => {
        const val = String((row as any)[key] || '');
        if (val.length > max) max = val.length;
      });
      return { wch: max + 2 };
    });
    worksheet["!cols"] = maxLens;

    XLSX.writeFile(workbook, `Reporte_Seguimiento_Anulaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast({
      title: "Excel Exportado",
      description: `Se han exportado ${filteredDocs.length} registros exitosamente.`
    });
  };

  // Save Ngrok Configuration
  const handleSaveConfig = () => {
    if (!newUrl.startsWith("http://") && !newUrl.startsWith("https://")) {
      toast({
        variant: "destructive",
        title: "URL Inválida",
        description: "La URL de la API del robot debe comenzar con http:// o https://"
      });
      return;
    }
    const cleanUrl = newUrl.replace(/\/$/, ""); // remove trailing slash
    saveRobotApiUrl(cleanUrl);
    setRobotUrl(cleanUrl);
    setIsConfigOpen(false);
    toast({
      title: "Configuración Guardada",
      description: `URL del Robot establecida en: ${cleanUrl}`
    });
  };

  // Add Document Manually
  const handleAddManual = () => {
    if (!manualDoc.rucEmisor || !manualDoc.razonSocialEmisor || !manualDoc.serieComprobante) {
      toast({
        variant: "destructive",
        title: "Campos Faltantes",
        description: "Por favor complete RUC, Razón Social y Serie del comprobante."
      });
      return;
    }

    const id = `${manualDoc.rucEmisor}-${manualDoc.tipoComprobante}-${manualDoc.serieComprobante}`;
    const exists = documents.some(d => d.id === id);
    if (exists) {
      toast({
        variant: "destructive",
        title: "Documento Duplicado",
        description: "Este comprobante ya se encuentra en el tablero de seguimiento."
      });
      return;
    }

    const now = new Date().toISOString();
    const newDoc: TrackedDocument = {
      id,
      rucEmisor: manualDoc.rucEmisor,
      razonSocialEmisor: manualDoc.razonSocialEmisor,
      tipoComprobante: manualDoc.tipoComprobante,
      serieComprobante: manualDoc.serieComprobante,
      observaciones: manualDoc.observaciones,
      correoEmisor: manualDoc.correoEmisor,
      status: manualDoc.status,
      fechaCreacion: now,
      fechaActualizacion: now,
      notas: manualDoc.notas || ""
    };

    handleSaveDocs([newDoc, ...documents]);
    setIsManualAddOpen(false);
    setManualDoc({
      rucEmisor: "",
      razonSocialEmisor: "",
      tipoComprobante: "Factura",
      serieComprobante: "",
      observaciones: "",
      correoEmisor: "",
      status: "Pendiente",
      notas: ""
    });
    toast({
      title: "Documento Registrado",
      description: "El comprobante se ha agregado manualmente al tablero."
    });
  };

  // Delete Document
  const handleDeleteDoc = (id: string) => {
    const updated = documents.filter(d => d.id !== id);
    handleSaveDocs(updated);
    
    const newSelected = new Set(selectedIds);
    newSelected.delete(id);
    setSelectedIds(newSelected);

    toast({
      title: "Documento Eliminado",
      description: "Se ha removido el comprobante de la lista de seguimiento."
    });
  };

  // Change individual status
  const handleStatusChange = (id: string, newStatus: TrackingStatus) => {
    const updated = documents.map(d => {
      if (d.id === id) {
        return {
          ...d,
          status: newStatus,
          fechaActualizacion: new Date().toISOString()
        };
      }
      return d;
    });
    handleSaveDocs(updated);
  };

  // Open Notes Modal
  const handleOpenNotes = (doc: TrackedDocument) => {
    setSelectedDocForNotes(doc);
    setEditingNotes(doc.notas || "");
    setIsNotesOpen(true);
  };

  // Save Notes
  const handleSaveNotes = () => {
    if (!selectedDocForNotes) return;
    const updated = documents.map(d => {
      if (d.id === selectedDocForNotes.id) {
        return {
          ...d,
          notas: editingNotes,
          fechaActualizacion: new Date().toISOString()
        };
      }
      return d;
    });
    handleSaveDocs(updated);
    setIsNotesOpen(false);
    setSelectedDocForNotes(null);
    toast({
      title: "Notas Actualizadas",
      description: "Se guardaron los comentarios del documento."
    });
  };

  // Call Robot API
  const queryRobotForDoc = async (doc: TrackedDocument): Promise<TrackedDocument | null> => {
    try {
      const response = await fetch(`${robotUrl}/api/consultar-documento`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ruc_proveedor: doc.rucEmisor,
          nombre_proveedor: doc.razonSocialEmisor,
          factura_numero: doc.serieComprobante
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Error en la respuesta del robot.");
      }

      const result = await response.json();
      
      let mappedStatus: TrackingStatus = doc.status;
      if (result.estado_encontrado === "Nota Credito") {
        mappedStatus = "Nota Credito";
      } else if (result.estado_encontrado === "Anulado SRI") {
        mappedStatus = "Anulado SRI";
      } else if (result.estado_encontrado === "Rechazado") {
        mappedStatus = "Rechazado";
      } else if (result.estado_encontrado === "Pendiente") {
        mappedStatus = "Pendiente";
      }

      return {
        ...doc,
        status: mappedStatus,
        valorFactura: result.valor_factura,
        valorNotaCredito: result.valor_nota_credito,
        saldoNeto: result.saldo_neto,
        notaCreditoAsociada: result.nota_credito_asociada,
        notas: result.notas ? `${result.notas}\n[Sincronizado: ${new Date().toLocaleString()}]` : doc.notas,
        fechaActualizacion: new Date().toISOString()
      };
    } catch (e: any) {
      console.error(e);
      // Append error message to document notes
      return {
        ...doc,
        fechaActualizacion: new Date().toISOString(),
        notas: `${doc.notas || ""}\n[Fallo Robot: ${e.message || "Error de red"} - ${new Date().toLocaleString()}]`
      };
    }
  };

  // Sync document with robot
  const handleSyncWithRobot = async (doc: TrackedDocument) => {
    if (queryingIds.has(doc.id)) return;
    
    setQueryingIds(prev => new Set(prev).add(doc.id));
    
    toast({
      title: "Consultando Robot...",
      description: `Extrayendo datos para ${doc.razonSocialEmisor}.`
    });

    const updatedDoc = await queryRobotForDoc(doc);
    
    if (updatedDoc) {
      const updatedList = documents.map(d => d.id === doc.id ? updatedDoc : d);
      handleSaveDocs(updatedList);
      toast({
        title: updatedDoc.status === "Nota Credito" || updatedDoc.status === "Anulado SRI" ? "¡Anulación Confirmada!" : "Robot Sincronizado",
        description: `Se actualizó el estado de la factura ${doc.serieComprobante} a: ${updatedDoc.status}.`
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error al Sincronizar",
        description: `No se pudo conectar con el robot para ${doc.razonSocialEmisor}. Verifique la conexión ngrok.`
      });
    }

    setQueryingIds(prev => {
      const next = new Set(prev);
      next.delete(doc.id);
      return next;
    });
  };

  // Bulk Actions
  const handleBulkStatusChange = (newStatus: TrackingStatus) => {
    if (selectedIds.size === 0) return;
    const updated = documents.map(d => {
      if (selectedIds.has(d.id)) {
        return {
          ...d,
          status: newStatus,
          fechaActualizacion: new Date().toISOString()
        };
      }
      return d;
    });
    handleSaveDocs(updated);
    toast({
      title: "Estados Actualizados",
      description: `Se cambió el estado de ${selectedIds.size} documentos a: ${newStatus}.`
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const updated = documents.filter(d => !selectedIds.has(d.id));
    handleSaveDocs(updated);
    setSelectedIds(new Set());
    toast({
      title: "Documentos Eliminados",
      description: `Se removieron ${selectedIds.size} registros de la lista.`
    });
  };

  const handleBulkSync = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBatchQuerying(true);
    toast({
      title: "Procesamiento Masivo Iniciado",
      description: `Consultando el robot para ${selectedIds.size} documentos. Esto puede tomar unos minutos.`
    });

    const docIdsArray = Array.from(selectedIds);
    let successCount = 0;
    const currentList = [...documents];

    for (let i = 0; i < docIdsArray.length; i++) {
      const id = docIdsArray[i];
      const doc = currentList.find(d => d.id === id);
      if (!doc) continue;

      setQueryingIds(prev => new Set(prev).add(id));
      
      const updatedDoc = await queryRobotForDoc(doc);
      if (updatedDoc) {
        successCount++;
        const idx = currentList.findIndex(d => d.id === id);
        if (idx !== -1) currentList[idx] = updatedDoc;
        setDocuments([...currentList]); // dynamic UI update
      }

      setQueryingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }

    saveTrackedDocuments(currentList);
    setIsBatchQuerying(false);
    toast({
      title: "Proceso Masivo Concluido",
      description: `Se sincronizaron exitosamente ${successCount} de ${selectedIds.size} documentos.`
    });
  };

  // Helper render icons for KPI
  const getStatusIcon = (status: TrackingStatus) => {
    switch (status) {
      case "Pendiente": return <Clock className="h-5 w-5 text-gray-500" />;
      case "Solicitado": return <Clock className="h-5 w-5 text-amber-500 animate-pulse" />;
      case "Anulado SRI": return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "Nota Credito": return <CheckCircle className="h-5 w-5 text-teal-500" />;
      case "Rechazado": return <XCircle className="h-5 w-5 text-rose-500" />;
    }
  };

  const getStatusBadge = (status: TrackingStatus) => {
    switch (status) {
      case "Pendiente":
        return <Badge variant="outline" className="border-gray-500/20 text-gray-500 bg-gray-50 dark:bg-gray-900/20 font-bold">Pendiente</Badge>;
      case "Solicitado":
        return <Badge variant="outline" className="border-amber-500/20 text-amber-500 bg-amber-50 dark:bg-amber-900/20 font-bold">Solicitado</Badge>;
      case "Anulado SRI":
        return <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 font-bold">Anulado SRI</Badge>;
      case "Nota Credito":
        return <Badge variant="outline" className="border-teal-500/20 text-teal-500 bg-teal-50 dark:bg-teal-900/20 font-bold">Nota de Crédito</Badge>;
      case "Rechazado":
        return <Badge variant="outline" className="border-rose-500/20 text-rose-500 bg-rose-50 dark:bg-rose-900/20 font-bold">Rechazado</Badge>;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-6 space-y-8 px-4 sm:px-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold font-headline tracking-tight">
            Panel de Control y Seguimiento
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Monitorea el estado de anulación física en SRI y compensación contable en SAP/Workflow.
          </p>
        </div>
        
        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsConfigOpen(true)}
            className="border-2 rounded-xl font-bold gap-1.5 shadow-sm transition-all"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            Configurar Robot
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportToExcel}
            className="border-2 rounded-xl font-bold text-teal-600 dark:text-teal-400 gap-1.5 shadow-sm transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Exportar Excel
          </Button>
          <Button 
            size="sm"
            onClick={() => setIsManualAddOpen(true)}
            className="rounded-xl font-bold gap-1.5 shadow-xl transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Añadir Documento
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-2 shadow-sm relative overflow-hidden bg-background/50 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Controlado</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black font-headline text-foreground">{totalCount}</span>
              <Badge variant="outline" className="border-muted bg-muted/30">Docs</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-2 shadow-sm relative overflow-hidden bg-background/50 backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Solicitado</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black font-headline text-amber-500">{statusStats.Solicitado}</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm relative overflow-hidden bg-background/50 backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500"></div>
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-black uppercase tracking-widest text-teal-500">N.C. Contabilizado</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black font-headline text-teal-500">{statusStats.NotaCredito}</span>
              <CheckCircle className="h-4 w-4 text-teal-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm relative overflow-hidden bg-background/50 backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Anulado SRI</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black font-headline text-emerald-500">{statusStats.SRI}</span>
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 shadow-sm relative overflow-hidden bg-background/50 backdrop-blur-sm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
          <CardContent className="p-4 flex flex-col justify-between h-24">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Rechazado / Pend.</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-black font-headline text-rose-500">{statusStats.Rechazado + statusStats.Pendiente}</span>
              <XCircle className="h-4 w-4 text-rose-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar Card */}
      <Card className="border-2 shadow-sm bg-background/50 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por Proveedor, RUC, Serie o detalle..."
              className="pl-10 h-11 border-2 focus-visible:border-primary rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 w-full sm:w-[160px] border-2 rounded-xl font-medium">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Solicitado">Solicitado</SelectItem>
                  <SelectItem value="Nota Credito">Nota de Crédito</SelectItem>
                  <SelectItem value="Anulado SRI">Anulado SRI</SelectItem>
                  <SelectItem value="Rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-11 w-full sm:w-[150px] border-2 rounded-xl font-medium">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="Factura">Facturas</SelectItem>
                <SelectItem value="Nota de Crédito">Notas de Crédito</SelectItem>
                <SelectItem value="Retención">Retenciones</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Panel (Sticky-ish if items selected) */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="p-4 bg-primary/5 border-2 border-primary/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Badge className="bg-primary hover:bg-primary/95 text-white font-bold h-6 px-2.5 rounded-md">
                {selectedIds.size}
              </Badge>
              <span className="text-xs font-bold text-foreground">comprobantes seleccionados</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkSync}
                disabled={isBatchQuerying}
                className="border-2 rounded-xl font-bold bg-background shadow-sm hover:text-primary gap-1.5"
              >
                {isBatchQuerying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    Procesando ({queryingIds.size} pendientes)...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 text-primary" />
                    Consultar Robot en Bloque
                  </>
                )}
              </Button>

              <Select onValueChange={(val) => handleBulkStatusChange(val as TrackingStatus)}>
                <SelectTrigger className="h-9 w-[150px] border-2 rounded-xl font-bold bg-background text-xs">
                  <SelectValue placeholder="Cambiar Estado" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Pendiente">Pendiente</SelectItem>
                  <SelectItem value="Solicitado">Solicitado</SelectItem>
                  <SelectItem value="Nota Credito">Nota de Crédito</SelectItem>
                  <SelectItem value="Anulado SRI">Anulado SRI</SelectItem>
                  <SelectItem value="Rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDelete}
                className="border-2 rounded-xl font-bold bg-background text-rose-500 border-rose-500/10 hover:bg-rose-50 hover:text-rose-600 gap-1.5 ml-auto sm:ml-0"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Table Card */}
      <Card className="border-2 shadow-sm overflow-hidden bg-background/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-b-2">
                <TableHead className="w-12 text-center">
                  <Checkbox 
                    checked={filteredDocs.length > 0 && selectedIds.size === filteredDocs.length}
                    onCheckedChange={(checked) => handleToggleSelectAll(!!checked)}
                  />
                </TableHead>
                <TableHead className="font-bold text-foreground text-xs uppercase tracking-wider py-4">Proveedor / RUC</TableHead>
                <TableHead className="font-bold text-foreground text-xs uppercase tracking-wider">Documento</TableHead>
                <TableHead className="font-bold text-foreground text-xs uppercase tracking-wider">Estado</TableHead>
                <TableHead className="font-bold text-foreground text-xs uppercase tracking-wider">Saldo SRI / SAP</TableHead>
                <TableHead className="font-bold text-foreground text-xs uppercase tracking-wider">Actualizado</TableHead>
                <TableHead className="font-bold text-foreground text-xs uppercase tracking-wider text-right pr-6">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <HelpCircle className="h-10 w-10 text-muted-foreground/30" />
                      <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">No se encontraron comprobantes</p>
                      <p className="text-xs text-muted-foreground max-w-xs">Intenta modificando los filtros de búsqueda o carga nuevos archivos en la pestaña de envío.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocs.map((doc) => {
                  const isSelected = selectedIds.has(doc.id);
                  const isQuerying = queryingIds.has(doc.id);
                  
                  return (
                    <TableRow 
                      key={doc.id}
                      className={cn(
                        "hover:bg-muted/10 transition-colors border-b-2",
                        isSelected && "bg-primary/5 hover:bg-primary/5"
                      )}
                    >
                      {/* Checkbox */}
                      <TableCell className="text-center">
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => handleToggleSelect(doc.id)}
                        />
                      </TableCell>

                      {/* Proveedor / RUC */}
                      <TableCell className="py-4">
                        <div className="flex flex-col max-w-[260px]">
                          <span className="font-bold text-sm truncate text-foreground leading-tight" title={doc.razonSocialEmisor}>
                            {doc.razonSocialEmisor}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground tracking-wider mt-0.5">
                            RUC: {doc.rucEmisor}
                          </span>
                        </div>
                      </TableCell>

                      {/* Documento */}
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-black text-foreground">
                            {doc.serieComprobante}
                          </span>
                          <span className="text-[9px] font-bold uppercase text-muted-foreground/80 tracking-widest mt-0.5">
                            {doc.tipoComprobante || "Factura"}
                          </span>
                        </div>
                      </TableCell>

                      {/* Estado */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select 
                            value={doc.status} 
                            onValueChange={(val) => handleStatusChange(doc.id, val as TrackingStatus)}
                          >
                            <SelectTrigger className="h-8 border-0 bg-transparent p-0 w-auto hover:bg-muted/20 px-2 rounded-lg font-bold gap-1 shadow-none focus:ring-0">
                              {getStatusBadge(doc.status)}
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="Pendiente">Pendiente</SelectItem>
                              <SelectItem value="Solicitado">Solicitado</SelectItem>
                              <SelectItem value="Nota Credito">Nota de Crédito</SelectItem>
                              <SelectItem value="Anulado SRI">Anulado SRI</SelectItem>
                              <SelectItem value="Rechazado">Rechazado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>

                      {/* Saldo / NC Asociada */}
                      <TableCell>
                        {doc.saldoNeto !== undefined ? (
                          <div className="flex flex-col">
                            <span className={cn(
                              "text-xs font-black",
                              doc.saldoNeto === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600"
                            )}>
                              Saldo: ${doc.saldoNeto.toFixed(2)}
                            </span>
                            {doc.notaCreditoAsociada && (
                              <span className="text-[9px] font-black text-muted-foreground truncate max-w-[120px] tracking-wider mt-0.5" title={`NC: ${doc.notaCreditoAsociada}`}>
                                NC: {doc.notaCreditoAsociada}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Sin Consultar</span>
                        )}
                      </TableCell>

                      {/* Actualizado */}
                      <TableCell>
                        <span className="text-[10px] font-bold text-muted-foreground tracking-tight">
                          {new Date(doc.fechaActualizacion).toLocaleDateString()} {new Date(doc.fechaActualizacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Robot Check */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSyncWithRobot(doc)}
                            disabled={isQuerying}
                            className="h-8 w-8 hover:text-primary rounded-lg"
                            title="Consultar Robot (Etafashion)"
                          >
                            {isQuerying ? (
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                              <RefreshCw className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>

                          {/* Notes */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenNotes(doc)}
                            className="h-8 w-8 hover:text-primary rounded-lg"
                            title="Notas / Comentarios"
                          >
                            <Edit3 className="h-4 w-4 text-muted-foreground" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="h-8 w-8 text-rose-500/70 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* --- MODALES --- */}

      {/* Modal 1: Configurar Robot */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-headline">Configuración de Conexión del Robot</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Establece el endpoint del servidor FastAPI expuesto a través de ngrok. Permite la consulta automática de comprobantes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="robot-url" className="text-xs font-bold uppercase tracking-wider">URL del Robot API (ngrok)</Label>
              <Input
                id="robot-url"
                placeholder="https://xxxx-xx-xx.ngrok-free.dev"
                className="h-11 border-2 rounded-xl"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
              />
            </div>
            <div className="bg-muted/40 p-4 rounded-2xl border border-muted flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                Asegúrese de que el robot local FastAPI esté iniciado (`uvicorn main:app --port 8000`) y que el túnel de ngrok esté activo.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsConfigOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
            <Button onClick={handleSaveConfig} className="rounded-xl font-bold shadow-xl">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Crear Documento Manualmente */}
      <Dialog open={isManualAddOpen} onOpenChange={setIsManualAddOpen}>
        <DialogContent className="sm:max-w-[550px] rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-headline">Registrar Comprobante Manualmente</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Introduce los detalles de un comprobante que requiera seguimiento sin necesidad de procesar archivos Excel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            
            <div className="space-y-2">
              <Label htmlFor="manual-ruc" className="text-xs font-bold uppercase tracking-wider">RUC del Proveedor *</Label>
              <Input
                id="manual-ruc"
                placeholder="179XXXXXXXX001"
                className="h-10 border-2 rounded-xl"
                value={manualDoc.rucEmisor}
                onChange={(e) => setManualDoc({...manualDoc, rucEmisor: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="manual-razon" className="text-xs font-bold uppercase tracking-wider">Razón Social Proveedor *</Label>
              <Input
                id="manual-razon"
                placeholder="PROVEEDOR S.A."
                className="h-10 border-2 rounded-xl"
                value={manualDoc.razonSocialEmisor}
                onChange={(e) => setManualDoc({...manualDoc, razonSocialEmisor: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider">Tipo Comprobante *</Label>
              <Select 
                value={manualDoc.tipoComprobante} 
                onValueChange={(val) => setManualDoc({...manualDoc, tipoComprobante: val})}
              >
                <SelectTrigger className="h-10 border-2 rounded-xl font-medium">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Factura">Factura</SelectItem>
                  <SelectItem value="Nota de Crédito">Nota de Crédito</SelectItem>
                  <SelectItem value="Retención">Retención</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="manual-serie" className="text-xs font-bold uppercase tracking-wider">Serie Comprobante *</Label>
              <Input
                id="manual-serie"
                placeholder="001-011-000320438"
                className="h-10 border-2 rounded-xl"
                value={manualDoc.serieComprobante}
                onChange={(e) => setManualDoc({...manualDoc, serieComprobante: e.target.value})}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="manual-email" className="text-xs font-bold uppercase tracking-wider">Correo Electrónico Emisor</Label>
              <Input
                id="manual-email"
                placeholder="contacto@proveedor.com"
                className="h-10 border-2 rounded-xl"
                value={manualDoc.correoEmisor}
                onChange={(e) => setManualDoc({...manualDoc, correoEmisor: e.target.value})}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="manual-obs" className="text-xs font-bold uppercase tracking-wider">Observaciones (Motivo)</Label>
              <Input
                id="manual-obs"
                placeholder="Firma duplicada / Valor erróneo..."
                className="h-10 border-2 rounded-xl"
                value={manualDoc.observaciones}
                onChange={(e) => setManualDoc({...manualDoc, observaciones: e.target.value})}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="manual-notas" className="text-xs font-bold uppercase tracking-wider">Notas Iniciales</Label>
              <Textarea
                id="manual-notas"
                placeholder="Notas de seguimiento..."
                className="border-2 rounded-xl resize-none min-h-[60px]"
                value={manualDoc.notas}
                onChange={(e) => setManualDoc({...manualDoc, notas: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsManualAddOpen(false)} className="rounded-xl font-bold">Cancelar</Button>
            <Button onClick={handleAddManual} className="rounded-xl font-bold shadow-xl">Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 3: Ver/Editar Notas de Documento */}
      <Dialog open={isNotesOpen} onOpenChange={setIsNotesOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold font-headline">Comentarios de Seguimiento</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              {selectedDocForNotes ? `${selectedDocForNotes.razonSocialEmisor} - ${selectedDocForNotes.serieComprobante}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              className="min-h-[180px] border-2 focus-visible:border-primary rounded-2xl p-4 text-sm leading-relaxed"
              placeholder="Historial de llamadas, respuestas de proveedor, incidencias..."
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsNotesOpen(false)} className="rounded-xl font-bold">Cerrar</Button>
            <Button onClick={handleSaveNotes} className="rounded-xl font-bold shadow-xl">
              <Check className="h-4 w-4 mr-1.5" />
              Guardar Notas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
