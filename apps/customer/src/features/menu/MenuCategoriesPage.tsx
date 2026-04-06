import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { menuService } from '@stockbite/api-client';
import { Button, Badge, Spinner, Modal, Input } from '@stockbite/ui';
import { Breadcrumb } from '../../components/ui/Breadcrumb';

export function MenuCategoriesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['menu', 'categories'],
    queryFn: () => menuService.getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (n: string) => menuService.createCategory(n),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'categories'] });
      toast.success('Category created');
      closeModal();
    },
    onError: () => toast.error('Failed to create category'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, n }: { id: string; n: string }) =>
      menuService.updateCategory(id, { name: n }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'categories'] });
      toast.success('Category updated');
      closeModal();
    },
    onError: () => toast.error('Failed to update category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => menuService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'categories'] });
      toast.success('Category deleted');
    },
    onError: () => toast.error('Failed to delete category'),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      menuService.updateCategory(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', 'categories'] });
      toast.success('Category updated');
    },
    onError: () => toast.error('Failed to update category'),
  });

  function openCreate() {
    setEditId(null);
    setName('');
    setNameError('');
    setShowModal(true);
  }

  function openEdit(id: string, currentName: string) {
    setEditId(id);
    setName(currentName);
    setNameError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditId(null);
    setName('');
    setNameError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    if (editId) {
      updateMutation.mutate({ id: editId, n: name });
    } else {
      createMutation.mutate(name);
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-5">
      <Breadcrumb items={[
        { label: 'Menü Yönetimi', to: '/menu' },
        { label: 'Kategoriler' },
      ]} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kategoriler</h1>
          <p className="text-sm text-slate-500 mt-0.5">Menünüzü kategorilerle düzenleyin.</p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <Plus size={16} />
          Kategori Ekle
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        )}
        {!isLoading && (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Name
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Order
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {categories?.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-10 text-slate-400 text-sm"
                  >
                    No categories yet. Add one to get started.
                  </td>
                </tr>
              )}
              {categories?.map((cat, idx) => (
                <tr
                  key={cat.id}
                  className={`border-b border-slate-100 last:border-0 ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                  } hover:bg-emerald-50 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {cat.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {cat.displayOrder}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={cat.isActive ? 'success' : 'neutral'}>
                      {cat.isActive ? 'Visible' : 'Hidden'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(cat.id, cat.name)}
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          toggleMutation.mutate({
                            id: cat.id,
                            isActive: !cat.isActive,
                          })
                        }
                        isLoading={toggleMutation.isPending}
                      >
                        {cat.isActive ? 'Hide' : 'Show'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteMutation.mutate(cat.id)}
                        isLoading={deleteMutation.isPending}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editId ? 'Edit Category' : 'Add Category'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder="e.g. Starters, Mains, Desserts"
            error={nameError}
            required
          />
          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={isMutating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isMutating}>
              {editId ? 'Save Changes' : 'Add Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
