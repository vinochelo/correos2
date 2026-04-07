import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  steps: string[];
}

export function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="relative flex items-center justify-between">
        {/* Background Line */}
        <div className="absolute top-5 left-0 w-full h-[2px] bg-slate-200 dark:bg-slate-800 -z-10" />

        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isCurrent = currentStep === stepNumber;

          return (
            <div key={label} className="flex flex-col items-center gap-3 relative">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-500 border-2 shadow-sm',
                  isCompleted
                    ? 'bg-primary border-primary text-primary-foreground scale-110'
                    : isCurrent
                    ? 'bg-background border-primary text-primary ring-4 ring-primary/10 scale-110'
                    : 'bg-background border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600'
                )}
              >
                {isCompleted ? <Check className="h-5 w-5" /> : stepNumber}
              </div>
              <span
                className={cn(
                  'text-[11px] uppercase tracking-widest font-bold whitespace-nowrap transition-all duration-500',
                  isCurrent || isCompleted ? 'text-foreground opacity-100' : 'text-muted-foreground opacity-60'
                )}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
