import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Small uppercase label shown above the title (e.g. a section name). */
  eyebrow?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, eyebrow, className, children }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">{eyebrow}</p>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm text-pretty">{description}</p>
        ) : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}
