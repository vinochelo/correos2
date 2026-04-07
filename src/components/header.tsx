import { LogoIcon } from '@/components/icons/logo-icon';

interface HeaderProps {
  step?: number;
  emailsSent?: number;
  totalEmails?: number;
}

export function Header({ step, emailsSent, totalEmails }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container flex h-20 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <LogoIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight font-headline text-foreground">
              Hola Mails <span className="text-primary text-xs font-medium bg-primary/10 px-2 py-0.5 rounded-full ml-1 font-sans">PRO</span>
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider leading-none mt-1">
              Automatización de Comprobantes
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-4">
          {step === 4 && totalEmails !== undefined && emailsSent !== undefined ? (
            <>
              <div className="h-8 w-[1px] bg-border" />
              <div className="flex flex-col items-end">
                <p className="text-xs text-foreground font-bold tracking-tight">
                  <span className="text-primary">{emailsSent}</span> de {totalEmails} Enviados
                </p>
                <div className="w-24 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${totalEmails > 0 ? (emailsSent / totalEmails) * 100 : 0}%` }} />
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
