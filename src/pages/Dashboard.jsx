import React, { useEffect, useState } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, 
  Receipt, 
  TrendingUp, 
  AlertTriangle, 
  Store,
  Banknote,
  Smartphone,
  CreditCard,
  Clock,
  PackageCheck,
  Calendar
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vuta data za Dashboard na Miamala yote kwa pamoja
    const getDashboardData = apiClient.get('reports/dashboard/');
    const getTodayTransactions = apiClient.get('sales/transactions/');

    Promise.all([getDashboardData, getTodayTransactions])
      .then(([dashRes, transRes]) => {
        setData(dashRes.data);
        const transData = transRes.data.results || transRes.data || [];
        setAllTransactions(transData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      });
  }, []);

  const businessName = user?.business?.name || user?.business_name || data?.business_name || "DUKA LAKO";

  // Tarehe ya Leo (Mfano: Ijumaa, 21 Agosti 2026)
  const today = new Date();
  const formattedDate = today.toLocaleDateString('sw-TZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return <div className="text-slate-400 font-medium p-6">Inapakia muhtasari wa leo...</div>;
  }

  // 1. Chuja Miamala ya Leo PEKEE
  const todayTransactions = allTransactions.filter(tx => {
    if (!tx.created_at) return false;
    const txDate = new Date(tx.created_at);
    return txDate.toDateString() === today.toDateString();
  });

  // 2. Calculate Totals kwa Miamala ya Leo Pekee
  const cashTotal = todayTransactions
    .filter(t => (t.payment_method || '').toLowerCase() === 'cash')
    .reduce((sum, t) => sum + Number(t.total_amount || t.amount_paid || 0), 0);

  const lipaTotal = todayTransactions
    .filter(t => ['mobile_money', 'lipa', 'mpesa'].includes((t.payment_method || '').toLowerCase()))
    .reduce((sum, t) => sum + Number(t.total_amount || t.amount_paid || 0), 0);

  const cardTotal = todayTransactions
    .filter(t => ['bank_card', 'card'].includes((t.payment_method || '').toLowerCase()))
    .reduce((sum, t) => sum + Number(t.total_amount || t.amount_paid || 0), 0);

  const todayTotalSales = cashTotal + lipaTotal + cardTotal;

  const statCards = [
    {
      title: 'Mauzo ya Leo',
      value: `${todayTotalSales.toLocaleString()} TZS`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Risiti Zilizotoka',
      value: todayTransactions.length,
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

  const paymentCards = [
    {
      title: 'Mauzo ya Cash',
      value: `${cashTotal.toLocaleString()} TZS`,
      icon: Banknote,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Mauzo ya Lipa (Simu)',
      value: `${lipaTotal.toLocaleString()} TZS`,
      icon: Smartphone,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Mauzo ya Card',
      value: `${cardTotal.toLocaleString()} TZS`,
      icon: CreditCard,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  const renderPaymentBadge = (method) => {
    const m = (method || '').toLowerCase();
    if (m === 'cash') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Banknote className="w-3.5 h-3.5" /> Cash
        </span>
      );
    } else if (m === 'mobile_money' || m === 'lipa' || m === 'mpesa') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Smartphone className="w-3.5 h-3.5" /> Lipa Namba
        </span>
      );
    } else if (m === 'bank_card' || m === 'card') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <CreditCard className="w-3.5 h-3.5" /> Card
        </span>
      );
    }
    return <span className="text-xs text-slate-400 uppercase font-semibold">{method}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner with Date */}
      <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/20 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Karibu Kwenye Selguudi Dashboard</span>
            <span className="text-xl">👋</span>
          </h1>
          
          {/* Dynamic Date Display */}
          <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="capitalize font-medium text-slate-300">{formattedDate}</span>
          </div>
        </div>

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

      {/* Main Analytics Cards */}
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

      {/* Mchanganuo wa Njia za Malipo */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
          Mchanganuo wa Mauzo kwa Njia ya Malipo (Leo)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {paymentCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{card.title}</p>
                  <h3 className="text-xl font-extrabold text-white font-mono">{card.value}</h3>
                </div>
                <div className={`p-3 rounded-xl border ${card.bg} ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ORODHA YA MAUZO YA LEO PEKEE */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Orodha ya Mauzo na Bidhaa Zilizouzwa Leo</h2>
          </div>
          <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
            Jumla: {todayTransactions.length} Miamala
          </span>
        </div>

        {todayTransactions.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            Bado hakuna mauzo yaliyofanyika siku ya leo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Saa / Muda</th>
                  <th className="py-3 px-4">Bidhaa Zilizouzwa</th>
                  <th className="py-3 px-4">Njia ya Malipo</th>
                  <th className="py-3 px-4 text-right">Kiasi Kilicholipwa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {todayTransactions.map((tx) => {
                  const txTime = tx.created_at 
                    ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--';

                  const itemsList = tx.items && tx.items.length > 0 
                    ? tx.items.map(item => `${item.product_name || item.product?.name || 'Bidhaa'} (${item.quantity}x)`).join(', ')
                    : 'Muamala wa Mauzo';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {txTime}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                        {itemsList}
                      </td>

                      <td className="py-3.5 px-4">
                        {renderPaymentBadge(tx.payment_method)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-400 font-mono">
                        {Number(tx.total_amount || tx.amount_paid || 0).toLocaleString()} TZS
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}