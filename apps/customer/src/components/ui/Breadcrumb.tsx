import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-5">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={14} className="text-slate-300 flex-shrink-0" />}
            {item.to && !isLast ? (
              <Link
                to={item.to}
                className="text-slate-400 hover:text-violet-600 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-slate-800 font-semibold' : 'text-slate-400 font-medium'}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
