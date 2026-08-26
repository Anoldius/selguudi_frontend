import React, { useEffect, useState } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  DollarSign, 
  Receipt, 
  TrendingUp, 
  AlertTriangle, 
  Banknote,
  Smartphone,
  CreditCard,
  Clock,
  PackageCheck,
  Calendar,
  Filter,
  BookOpen,
  RotateCcw,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Tag
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // State ya Date Filter: 'today', 'yesterday', au 'week'
  const [dateFilter, setDateFilter] = useState('today');

  // State za Refund Modal
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  // Custom Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = () => {
    setLoading(true);
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
  };

  const businessName = user?.business?.name || user?.business_name || data?.business_name || "DUKA LAKO";

  if (loading) {
    return <div className="text-slate-400 font-medium p-6">Inapakia muhtasari...</div>;
  }

  // --- LOGIC YA CHUJO LA TAREHE (TANZANIA TIMEZONE SAFE) ---
  const getLocalDateString = (d) => {
    const dateObj = new Date(d);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = new Date();
  const todayStr = getLocalDateString(today);

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  // Siku 7 zilizopita kuanzia Saa 00:00:00
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Chuja Miamala Kulingana na Filter Iliyochaguliwa
  const filteredTransactions = allTransactions.filter(tx => {
    if (!tx.created_at) return false;
    const txDateStr = getLocalDateString(tx.created_at);
    const txDate = new Date(tx.created_at);

    if (dateFilter === 'today') {
      return txDateStr === todayStr;
    } else if (dateFilter === 'yesterday') {
      return txDateStr === yesterdayStr;
    } else if (dateFilter === 'week') {
      return txDate >= sevenDaysAgo && txDate <= today;
    }
    return true;
  });

  // 2. KOKOTOA HESABU (Ondoa miamala iliyo na status 'REFUNDED')
  const validTransactions = filteredTransactions.filter(t => t.status !== 'REFUNDED');

  const cashTotal = validTransactions
    .filter(t => (t.payment_method || '').toLowerCase() === 'cash')
    .reduce((sum, t) => sum + Number(t.total_amount || t.amount_paid || 0), 0);

  const lipaTotal = validTransactions
    .filter(t => ['mobile_money', 'lipa', 'mpesa'].includes((t.payment_method || '').toLowerCase()))
    .reduce((sum, t) => sum + Number(t.total_amount || t.amount_paid || 0), 0);

  const cardTotal = validTransactions
    .filter(t => ['bank_card', 'card'].includes((t.payment_method || '').toLowerCase()))
    .reduce((sum, t) => sum + Number(t.total_amount || t.amount_paid || 0), 0);

  const creditTotal = validTransactions
    .filter(t => ['credit', 'deni', 'kukopa'].includes((t.payment_method || '').toLowerCase()))
    .reduce((sum, t) => sum + Number(t.total_amount || t.amount_paid || 0), 0);

  const totalSales = cashTotal + lipaTotal + cardTotal + creditTotal;

  // --- KOKOTOA FAIDA HALISI KULINGANA NA FILTER ILIYOCHAGULIWA ---
  const dynamicEstimatedProfit = validTransactions.reduce((totalProfit, tx) => {
    if (!tx.items || !Array.isArray(tx.items)) return totalProfit;

    const txProfit = tx.items.reduce((itemProfit, item) => {
      const qty = Number(item.quantity || 0);
      const sellingPrice = Number(item.unit_price || item.price || 0);
      const buyingPrice = Number(item.buying_price || item.product?.buying_price || item.cost_price || 0);

      const profitPerUnit = buyingPrice > 0 ? (sellingPrice - buyingPrice) : (sellingPrice * 0.2);
      return itemProfit + (profitPerUnit * qty);
    }, 0);

    return totalProfit + txProfit;
  }, 0);

  // Header Date Label Format
  const getFilterLabel = () => {
    if (dateFilter === 'today') {
      return today.toLocaleDateString('sw-TZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else if (dateFilter === 'yesterday') {
      return `Jana (${yesterday.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'long', year: 'numeric' })})`;
    } else if (dateFilter === 'week') {
      return `Siku 7 Zilizopita (${sevenDaysAgo.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' })} - ${today.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' })})`;
    }
  };

  // LOGIC YA MCHAKATO WA REFUND
  const handleExecuteRefund = async (e) => {
    e.preventDefault();
    if (!selectedTx) return;

    setIsRefunding(true);
    try {
      if (selectedTx.items && Array.isArray(selectedTx.items) && selectedTx.items.length > 0) {
        for (const item of selectedTx.items) {
          const productId = item.product_id || item.product?.id || item.product;
          const returnQty = Number(item.quantity || 0);

          if (productId && returnQty > 0) {
            try {
              const prodRes = await apiClient.get(`inventory/products/${productId}/`);
              const currentStock = Number(prodRes.data.quantity ?? prodRes.data.stock_quantity ?? 0);
              const updatedStock = currentStock + returnQty;

              await apiClient.patch(`inventory/products/${productId}/`, {
                quantity: updatedStock,
                stock_quantity: updatedStock
              });
            } catch (pErr) {
              console.error(`Imeshindikana kurejesha stoko ya product ${productId}:`, pErr);
            }
          }
        }
      }

      try {
        await apiClient.post(`sales/transactions/${selectedTx.id}/refund/`, {
          reason: refundReason
        });
      } catch (err) {
        if (err.response?.status === 404) {
          await apiClient.delete(`sales/transactions/${selectedTx.id}/`);
        } else {
          throw err;
        }
      }

      triggerToast("Muamala umerejeshwa na stoko imeongezeka kiotomatiki! 🔄", "success");
      setShowRefundModal(false);
      setSelectedTx(null);
      setRefundReason('');
      fetchDashboardData();
    } catch (err) {
      console.error("Refund Error Response:", err.response);
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || "Imeshindikana kurejesha muamala!";
      triggerToast(errorMsg, "error");
    } finally {
      setIsRefunding(false);
    }
  };

  const statCards = [
    {
      title: dateFilter === 'today' ? 'Mauzo ya Leo' : dateFilter === 'yesterday' ? 'Mauzo ya Jana' : 'Mauzo ya Wiki Hii',
      value: `${totalSales.toLocaleString()} TZS`,
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Risiti Zilizotoka',
      value: validTransactions.length,
      icon: Receipt,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Kadirio la Faida',
      value: `${dynamicEstimatedProfit.toLocaleString()} TZS`,
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
    {
      title: 'Mauzo ya Kukopa (Deni)',
      value: `${creditTotal.toLocaleString()} TZS`,
      icon: BookOpen,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
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
    } else if (m === 'credit' || m === 'deni' || m === 'kukopa') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
          <BookOpen className="w-3.5 h-3.5" /> Kukopa / Deni
        </span>
      );
    }
    return <span className="text-xs text-slate-400 uppercase font-semibold">{method}</span>;
  };

  return (
    <div className="space-y-6 relative">
      
      {/* CUSTOM TOAST NOTIFICATION BANNER */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[60] px-5 py-4 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-md transition-all animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-300' 
            : 'bg-red-950/90 border-red-500/50 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/20 p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <span>Karibu Kwenye Selguudi Dashboard</span>
            <span className="text-xl">👋</span>
          </h1>
          
          <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="capitalize font-medium text-slate-300">{getFilterLabel()}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950/80 border border-emerald-500/30 px-5 py-3 rounded-2xl self-start md:self-auto shadow-lg shadow-emerald-950/50">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900 border border-emerald-500/20 p-1">
            <img 
              src="/selguudiLogo.png" 
              alt="Selguudi Logo" 
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Biashara / Duka</p>
            <p className="text-lg font-extrabold text-emerald-400 font-mono tracking-wide uppercase">
              {businessName}
            </p>
          </div>
        </div>
      </div>

      {/* DATE FILTER BUTTONS SECTION */}
      <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Chagua Kipindi:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateFilter('today')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              dateFilter === 'today'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Leo
          </button>

          <button
            onClick={() => setDateFilter('yesterday')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              dateFilter === 'yesterday'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Jana
          </button>

          <button
            onClick={() => setDateFilter('week')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              dateFilter === 'week'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Wiki Hii (Siku 7)
          </button>
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

      {/* Mchanganuo wa Njia 4 za Malipo */}
      <div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
          Mchanganuo wa Mauzo kwa Njia ya Malipo ({dateFilter === 'today' ? 'Leo' : dateFilter === 'yesterday' ? 'Jana' : 'Wiki Hii'})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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

      {/* ORODHA YA MAUZO KULINGANA NA FILTER */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Orodha ya Mauzo ({dateFilter === 'today' ? 'Leo' : dateFilter === 'yesterday' ? 'Jana' : 'Wiki Hii'})
            </h2>
          </div>
          <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
            Jumla: {filteredTransactions.length} Miamala
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-slate-500 text-sm">
            Hakuna mauzo yaliyopatikana kwa kipindi hiki.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs text-slate-400 uppercase bg-slate-950/60 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Saa / Tarehe</th>
                  <th className="py-3 px-4">Bidhaa Zilizouzwa [Kundi] / Mteja</th>
                  <th className="py-3 px-4">Njia ya Malipo</th>
                  <th className="py-3 px-4 text-right">Kiasi Kilicholipwa</th>
                  <th className="py-3 px-4 text-center">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTransactions.map((tx) => {
                  const isRefunded = tx.status === 'REFUNDED';
                  const txDateObj = new Date(tx.created_at);
                  const txDisplayTime = dateFilter === 'today' 
                    ? txDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : `${txDateObj.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' })} ${txDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                  // Format bidhaa ikiwa na Category Label
                  const itemsList = tx.items && tx.items.length > 0 
                    ? tx.items.map(item => {
                        const prodName = item.product_name || item.product?.name || 'Bidhaa';
                        const catName = item.category_name || item.product?.category_name || item.product?.category?.name || 'Bila Kundi';
                        return `${prodName} [${catName}] (${item.quantity}x)`;
                      }).join(', ')
                    : 'Muamala wa Mauzo';

                  const customerInfo = tx.customer_name ? ` - Mteja: ${tx.customer_name}` : '';

                  return (
                    <tr key={tx.id} className={`hover:bg-slate-800/30 transition ${isRefunded ? 'opacity-40 bg-red-950/10' : ''}`}>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {txDisplayTime}
                      </td>

                      <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                        {itemsList} <span className="text-xs text-amber-400 font-semibold">{customerInfo}</span>
                        {isRefunded && <span className="block text-[10px] text-red-400 font-bold uppercase">(Muamala Umerejeshwa/Refunded)</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        {renderPaymentBadge(tx.payment_method)}
                      </td>

                      <td className={`py-3.5 px-4 text-right font-extrabold font-mono ${isRefunded ? 'line-through text-slate-500' : 'text-emerald-400'}`}>
                        {Number(tx.total_amount || tx.amount_paid || 0).toLocaleString()} TZS
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {!isRefunded ? (
                          <button
                            onClick={() => { setSelectedTx(tx); setShowRefundModal(true); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition"
                            title="Rejesha Muamala Huu"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Refund</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-red-400/80">Refunded</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL YA REFUND */}
      {showRefundModal && selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                <RotateCcw className="w-5 h-5" />
                <span>Thibitisha Kurejesha Muamala</span>
              </div>
              <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Kiasi cha Kurejesha:</span>
                <span className="text-emerald-400 font-extrabold font-mono text-sm">
                  {Number(selectedTx.total_amount || selectedTx.amount_paid || 0).toLocaleString()} TZS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Njia ya Malipo:</span>
                <span className="text-white font-semibold uppercase">{selectedTx.payment_method}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  Sababu ya Kurejesha (Refund Reason) *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Mfano: Mteja kaleta bidhaa yenye kasoro / Cashier amekosea kiasi..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-slate-950 font-extrabold rounded-xl transition flex items-center justify-center gap-2"
                >
                  {isRefunding ? <Loader2 className="w-5 h-5 animate-spin" /> : <RotateCcw className="w-5 h-5" />}
                  <span>Thibitisha Refund</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}