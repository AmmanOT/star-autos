import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';

const ADD_VALUE = '__add_new__';

type CreatableSelectProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  onCreate: (name: string) => Promise<string | void>;
  placeholder?: string;
  className?: string;
};

/** Dropdown: pick existing or “+ Add new…” then create via API */
export function CreatableSelect({
  label,
  value,
  options,
  onChange,
  onCreate,
  placeholder = 'Select…',
  className = '',
}: CreatableSelectProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSelect = (v: string) => {
    if (v === ADD_VALUE) {
      setAdding(true);
      setNewName('');
      return;
    }
    onChange(v);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const created = await onCreate(name);
      onChange(typeof created === 'string' && created ? created : name);
      setAdding(false);
      setNewName('');
    } finally {
      setSaving(false);
    }
  };

  if (adding) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <label className="text-sm font-medium text-[var(--color-text-muted)]">{label}</label>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={`New ${label.toLowerCase()}`}
            className="flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleCreate();
              }
            }}
          />
          <Button type="button" size="sm" onClick={() => void handleCreate()} disabled={saving || !newName.trim()}>
            <Plus size={14} />
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-sm font-medium text-[var(--color-text-muted)]">{label}</label>
      <select
        className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
        value={value}
        onChange={(e) => handleSelect(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        <option value={ADD_VALUE}>+ Add new {label.toLowerCase()}…</option>
      </select>
    </div>
  );
}

type VehicleMultiSelectProps = {
  label: string;
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
  onCreate: (name: string) => Promise<string | void>;
};

/** Multi-check vehicles + add new */
export function VehicleMultiSelect({
  label,
  value,
  options,
  onChange,
  onCreate,
}: VehicleMultiSelectProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (name: string) => {
    if (value.includes(name)) onChange(value.filter((v) => v !== name));
    else onChange([...value, name]);
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setSaving(true);
    try {
      const created = await onCreate(name);
      const finalName = typeof created === 'string' && created ? created : name;
      if (!value.includes(finalName)) onChange([...value, finalName]);
      setAdding(false);
      setNewName('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 md:col-span-2">
      <label className="text-sm font-medium text-[var(--color-text-muted)]">{label}</label>
      <div className="max-h-40 overflow-y-auto rounded-lg border border-[var(--color-border)] p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((name) => (
          <label key={name} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={value.includes(name)}
              onChange={() => toggle(name)}
              className="rounded border-[var(--color-border)]"
            />
            <span>{name}</span>
          </label>
        ))}
        {options.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)] col-span-full">No vehicles yet</p>
        )}
      </div>
      {adding ? (
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Mehran"
            className="flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleCreate();
              }
            }}
          />
          <Button type="button" size="sm" onClick={() => void handleCreate()} disabled={saving || !newName.trim()}>
            Add
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button type="button" size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => setAdding(true)}>
          Add vehicle
        </Button>
      )}
    </div>
  );
}
