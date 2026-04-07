import { LogoIcon } from '@/components/icons/logo-icon';

export function Header() {
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
          <div className="h-8 w-[1px] bg-border" />
          <p className="text-xs text-muted-foreground font-medium italic">
            "Eficiencia y orden en su facturación"
          </p>
        </div>
      </div>
    </header>
  );
}
