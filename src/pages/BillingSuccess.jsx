import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export default function BillingSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xl">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-white">Malipo Yamefanikiwa! 🎉</h2>
          <p className="text-slate-400 text-sm mt-2">
            Asante kwa kulipia subscription ya Selguudi POS. Akunti yako imeongezwa siku 30 za matumizi.
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
        >
          <span>Rudi Kwenye Dashboard</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}