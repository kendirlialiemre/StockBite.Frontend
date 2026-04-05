

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon,
  className = '',
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-slate-200 p-6 ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
          {change !== undefined && (
            <p
              className={`mt-1 text-xs font-medium flex items-center gap-1 ${
                isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              <span>{isPositive ? '▲' : '▼'}</span>
              <span>
                {isPositive ? '+' : ''}
                {change}%
              </span>
              <span className="text-slate-400 font-normal">vs last period</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4 p-3 bg-indigo-50 rounded-lg text-indigo-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
