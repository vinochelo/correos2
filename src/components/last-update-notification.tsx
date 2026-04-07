"use client";

import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LastUpdateNotificationProps {
  lastUpdate: string | null;
  recipientCount?: number;
  className?: string;
}

export function LastUpdateNotification({ lastUpdate, recipientCount = 0, className }: LastUpdateNotificationProps) {
  if (!lastUpdate) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Justo ahora";
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 rounded-lg border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800 shadow-sm animate-slide-up",
      className
    )}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-green-900 dark:text-green-100">
          Datos cargados exitosamente
        </p>
        <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
          <Clock className="h-3 w-3" />
          <span>Última actualización: {formatDate(lastUpdate)}</span>
          {recipientCount > 0 && (
            <>
              <span className="mx-1">•</span>
              <span>{recipientCount} destinatario{recipientCount > 1 ? 's' : ''}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
