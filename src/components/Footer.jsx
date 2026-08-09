import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full py-4 px-6 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 mt-auto">
      <div className="flex items-center gap-1">
        <span>&copy; {currentYear}</span>
        <span className="font-semibold text-slate-400">Selguudi POS</span>. 
        <span>Haki zote zimehifadhiwa.</span>
      </div>

      <div className="flex items-center gap-1.5 text-slate-400">
        <span>Engineered with</span>
        <Heart className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
        <span>for Supermarkets & Retail Stores</span>
      </div>
    </footer>
  );
}