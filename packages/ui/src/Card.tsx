

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-slate-200 ${className}`}
    >
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-slate-100">
          {title && (
            <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
