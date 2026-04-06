
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { menuService } from '@stockbite/api-client';
import { Spinner, Badge } from '@stockbite/ui';
import { UtensilsCrossed, ChevronRight } from 'lucide-react';
import { Breadcrumb } from '../../components/ui/Breadcrumb';

export function MenuPage() {
  const { data: categories, isLoading: catLoading } = useQuery({
    queryKey: ['menu', 'categories'],
    queryFn: () => menuService.getCategories(),
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu', 'items'],
    queryFn: () => menuService.getItems(),
  });

  const isLoading = catLoading || itemsLoading;

  function getItemCount(categoryId: string) {
    return items?.filter((item) => item.categoryId === categoryId).length ?? 0;
  }

  return (
    <div className="p-3 sm:p-6 space-y-5">
      <Breadcrumb items={[{ label: 'Menü Yönetimi' }]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Menü Yönetimi</h1>
          <p className="text-sm text-slate-500 mt-0.5">Kategorileri ve ürünleri yönetin.</p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/menu/template"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Tasarım
          </Link>
          <Link
            to="/menu/categories"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Kategoriler
          </Link>
          <Link
            to="/menu/items"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-colors"
          >
            Ürünler
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories?.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-400 text-sm">
              No categories yet.{' '}
              <Link to="/menu/categories" className="text-emerald-600 underline">
                Add your first category
              </Link>
            </div>
          )}
          {categories?.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 flex items-start justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-2 bg-emerald-50 rounded-md text-emerald-600">
                    <UtensilsCrossed size={16} />
                  </div>
                  <h3 className="font-semibold text-slate-900">{cat.name}</h3>
                </div>
                <p className="text-sm text-slate-500 mt-1">
                  {getItemCount(cat.id)} item
                  {getItemCount(cat.id) !== 1 ? 's' : ''}
                </p>
                <div className="mt-2">
                  <Badge variant={cat.isActive ? 'success' : 'neutral'}>
                    {cat.isActive ? 'Active' : 'Hidden'}
                  </Badge>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 mt-1" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
