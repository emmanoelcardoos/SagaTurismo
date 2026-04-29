// components/Navbar.tsx
'use client';
import Link from 'next/link';
import { Bird, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="bg-forest text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-wide">
          <Bird className="w-6 h-6 text-leaf" />
          <span style={{ fontFamily: 'Playfair Display, serif' }}>SagaTurismo</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-6 text-sm font-semibold">
          <Link href="/" className="hover:text-leaf transition-colors">Início</Link>
          <Link href="/cadastro" className="bg-leaf text-forest px-4 py-2 rounded-full hover:bg-green-400 transition-colors">
            Solicitar Cartão
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(o => !o)} aria-label="Menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-forest-mid px-4 py-4 flex flex-col gap-3 text-sm font-semibold">
          <Link href="/" onClick={() => setOpen(false)} className="hover:text-leaf">Início</Link>
          <Link href="/cadastro" onClick={() => setOpen(false)} className="bg-leaf text-forest px-4 py-2 rounded-full text-center">
            Solicitar Cartão
          </Link>
        </div>
      )}
    </nav>
  );
}