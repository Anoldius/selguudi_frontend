import React, { useEffect, useState } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Receipt, TrendingUp, AlertTriangle, Store } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('reports/dashboard/')
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching dashboard:", err);
        setLoading(false);
      });
  }, []);

  // Pata jina la duka kwa mpangilio sahihi wa vyanzo vya data
  const businessName = user?.business?.name || user?.business_name || data?.business_name || "DUKA LAKO";

  if (loading) {
    return <div className="text-slate-400 font-medium p-6">Inapakia muhtasari wa leo...</div>;
  }

  const statCards = [
    {
      title: 'Mauzo ya Leo',
      value: `${data?.today_total_sales?.toLocaleString() || 0} TZS`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Risiti Zilizotoka',
      value: data?.today_receipts || 0,
      icon: Receipt,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Kadirio la Faida',
      value: `${data?.today_estimated_profit?.toLocaleString() || 0} TZS`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
    {
      title: 'Stoko Ndogo Alert',
      value: `${data?.low_stock_items_count || 0} Bidhaa`,
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner with Dynamic Business Name */}
      <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/20 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Karibu Kwenye Selguudi Dashboard</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Hapa ndipo muhtasari halisi wa biashara yako kwa siku ya leo.</p>
        </div>

        {/* Dynamic Business Name Badge */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-emerald-500/30 px-5 py-3 rounded-2xl self-start md:self-auto shadow-lg shadow-emerald-950/50">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Biashara / Duka</p>
            <p className="text-lg font-extrabold text-emerald-400 font-mono tracking-wide uppercase">
              {businessName}
            </p>
          </div>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`p-2.5 rounded-xl border ${card.bg} ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl font-extrabold text-white font-mono">{card.value}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
}