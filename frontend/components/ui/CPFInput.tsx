// components/ui/CPFInput.tsx
'use client';
import { ChangeEvent } from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

function maskCPF(raw: string) {
  return raw
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
}

export default function CPFInput({ value, onChange, error }: Props) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(maskCPF(e.target.value));
  };

  return (
    <div className="space-y-1">
      <label className="block text-sm font-bold text-stone-700">CPF</label>
      <input
        type="text"
        inputMode="numeric"
        placeholder="000.000.000-00"
        value={value}
        onChange={handleChange}
        className={`w-full border rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 transition-all ${
          error ? 'border-red-400 focus:ring-red-300' : 'border-stone-200 focus:ring-leaf/50'
        }`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}