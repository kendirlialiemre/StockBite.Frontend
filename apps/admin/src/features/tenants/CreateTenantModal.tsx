import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminService } from '@stockbite/api-client';
import type { CreateTenantRequest } from '@stockbite/api-client';
import { Modal, Button, Input } from '@stockbite/ui';

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const emptyForm = (): CreateTenantRequest => ({
  name: '',
  slug: '',
  ownerEmail: '',
  ownerFirstName: '',
  ownerLastName: '',
  ownerPassword: '',
});

export function CreateTenantModal({ isOpen, onClose }: CreateTenantModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateTenantRequest>(emptyForm());
  const [slugEdited, setSlugEdited] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CreateTenantRequest, string>>>({});

  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm());
      setSlugEdited(false);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!slugEdited && form.name) {
      setForm((prev) => ({ ...prev, slug: slugify(form.name) }));
    }
  }, [form.name, slugEdited]);

  const mutation = useMutation({
    mutationFn: (req: CreateTenantRequest) => adminService.createTenant(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'tenants'] });
      toast.success('Tenant created successfully!');
      onClose();
    },
    onError: () => {
      toast.error('Failed to create tenant. Please try again.');
    },
  });

  function validate() {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Tenant name is required';
    if (!form.slug.trim()) errs.slug = 'Slug is required';
    if (!form.ownerEmail.trim()) errs.ownerEmail = 'Owner email is required';
    else if (!/\S+@\S+\.\S+/.test(form.ownerEmail))
      errs.ownerEmail = 'Enter a valid email';
    if (!form.ownerFirstName.trim())
      errs.ownerFirstName = 'First name is required';
    if (!form.ownerLastName.trim())
      errs.ownerLastName = 'Last name is required';
    if (!form.ownerPassword.trim())
      errs.ownerPassword = 'Password is required';
    else if (form.ownerPassword.length < 8)
      errs.ownerPassword = 'Password must be at least 8 characters';
    return errs;
  }

  function handleChange(field: keyof CreateTenantRequest, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    mutation.mutate(form);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Tenant" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tenant Name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Acme Restaurant"
            error={errors.name}
            required
          />
          <Input
            label="Slug"
            value={form.slug}
            onChange={(e) => {
              setSlugEdited(true);
              handleChange('slug', e.target.value);
            }}
            placeholder="acme-restaurant"
            error={errors.slug}
            helperText="URL-friendly identifier"
            required
          />
        </div>

        <div className="pt-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
            Owner Account
          </p>
          <div className="space-y-4">
            <Input
              label="Owner Email"
              type="email"
              value={form.ownerEmail}
              onChange={(e) => handleChange('ownerEmail', e.target.value)}
              placeholder="owner@restaurant.com"
              error={errors.ownerEmail}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                value={form.ownerFirstName}
                onChange={(e) =>
                  handleChange('ownerFirstName', e.target.value)
                }
                placeholder="John"
                error={errors.ownerFirstName}
                required
              />
              <Input
                label="Last Name"
                value={form.ownerLastName}
                onChange={(e) =>
                  handleChange('ownerLastName', e.target.value)
                }
                placeholder="Doe"
                error={errors.ownerLastName}
                required
              />
            </div>
            <Input
              label="Password"
              type="password"
              value={form.ownerPassword}
              onChange={(e) => handleChange('ownerPassword', e.target.value)}
              placeholder="Min. 8 characters"
              error={errors.ownerPassword}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={mutation.isPending}
          >
            Create Tenant
          </Button>
        </div>
      </form>
    </Modal>
  );
}
