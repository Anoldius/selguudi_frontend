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
  ArrowUpRight,
  TrendingDown
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  
  // 1. CHUKUA DATA KUTOKA LOCALSTORAGE KWA HARAKA SANA (INSTANT CACHE LOAD)
  const [data, setData] = useState(() => {
    const cached = localStorage.getItem('selguudi_dashboard_data');
    return cached ? JSON.parse(cached) : null;
  });

  const [allTransactions, setAllTransactions] = useState(() => {
    const cached = localStorage.getItem('selguudi_dashboard_txs');
    return cached ? JSON.parse(cached) : [];
  });

  // Kama tunazo data kwenye cache, weka loading kuwa false hapo hapo!
  const [loading, setLoading] = useState(() => {
    const cachedData = localStorage.getItem('selguudi_dashboard_data');
    return !cachedData;
  });

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

  // 2. BACKGROUND SYNC: LETA DATA MPYA KUTOKA SERVER KIMYA KIMYA BILA KUMZUIA MTUMIAJI
  const fetchDashboardData = () => {
    const getDashboardData = apiClient.get('reports/dashboard/');
    const getTodayTransactions = apiClient.get('sales/transactions/');

    Promise.all([getDashboardData, getTodayTransactions])
      .then(([dashRes, transRes]) => {
        const dashData = dashRes.data;
        const transData = transRes.data.results || transRes.data || [];

        setData(dashData);
        setAllTransactions(transData);

        // HIFADHI KWENYE LOCALSTORAGE KWA AJILI YA MATUMIZI YAYO YAJAYO
        localStorage.setItem('selguudi_dashboard_data', JSON.stringify(dashData));
        localStorage.setItem('selguudi_dashboard_txs', JSON.stringify(transData));

        setLoading(false);
      })
      .catch(err => {
        console.error("Error background fetching dashboard data:", err);
        setLoading(false);
      });
  };

  const isOwner = user?.role === 'owner';
  const businessName = user?.business?.name || user?.business_name || data?.business_name || "DUKA LAKO";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 font-medium gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-sm font-semibold">Inapakia muhtasari wa duka...</span>
      </div>
    );
  }

  // --- LOGIC YA CHUJO LA TAREHE ---
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

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

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

  const getFilterLabel = () => {
    if (dateFilter === 'today') {
      return today.toLocaleDateString('sw-TZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } else if (dateFilter === 'yesterday') {
      return `Jana (${yesterday.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'long', year: 'numeric' })})`;
    } else if (dateFilter === 'week') {
      const startLbl = sevenDaysAgo.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' });
      const endLbl = today.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' });
      return `Siku 7 Zilizopita (${startLbl} - ${endLbl})`;
    }
  };

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

  // KADI ZA STATS (FAIDA INAONYESHWA KWA OWNER PEKEE)
  const statCards = [
    {
      title: dateFilter === 'today' ? 'Mauzo ya Leo' : dateFilter === 'yesterday' ? 'Mauzo ya Jana' : 'Mauzo ya Wiki Hii',
      value: `${totalSales.toLocaleString()} TZS`,
      icon: DollarSign,
      iconBg: 'bg-blue-50 text-blue-900 border-blue-100',
      valueColor: 'text-blue-950',
      show: true
    },
    {
      title: 'Risiti Zilizotoka',
      value: validTransactions.length,
      icon: Receipt,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      valueColor: 'text-emerald-900',
      show: true
    },
    {
      title: 'Kadirio la Faida',
      value: `${dynamicEstimatedProfit.toLocaleString()} TZS`,
      icon: TrendingUp,
      iconBg: 'bg-blue-50 text-blue-700 border-blue-100',
      valueColor: 'text-blue-900',
      show: isOwner
    },
    {
      title: 'Stoko Ndogo Alert',
      value: `${data?.low_stock_items_count || 0} Bidhaa`,
      icon: AlertTriangle,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      valueColor: 'text-amber-600',
      show: true
    },
  ].filter(card => card.show);

  const paymentCards = [
    {
      title: 'Mauzo ya Cash',
      value: `${cashTotal.toLocaleString()} TZS`,
      icon: Banknote,
      iconBg: 'bg-emerald-50 text-emerald-600',
      textColor: 'text-emerald-700'
    },
    {
      title: 'Mauzo ya Lipa (Simu)',
      value: `${lipaTotal.toLocaleString()} TZS`,
      icon: Smartphone,
      iconBg: 'bg-blue-50 text-blue-900',
      textColor: 'text-blue-900'
    },
    {
      title: 'Mauzo ya Card',
      value: `${cardTotal.toLocaleString()} TZS`,
      icon: CreditCard,
      iconBg: 'bg-blue-50 text-blue-700',
      textColor: 'text-blue-700'
    },
    {
      title: 'Mauzo ya Kukopa (Deni)',
      value: `${creditTotal.toLocaleString()} TZS`,
      icon: BookOpen,
      iconBg: 'bg-amber-50 text-amber-600',
      textColor: 'text-amber-600'
    },
  ];

  const renderPaymentBadge = (method) => {
    const m = (method || '').toLowerCase();
    if (m === 'cash') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
          <Banknote className="w-3.5 h-3.5" /> Cash
        </span>
      );
    } else if (m === 'mobile_money' || m === 'lipa' || m === 'mpesa') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-900">
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> Lipa Namba
        </span>
      );
    } else if (m === 'bank_card' || m === 'card') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-800">
          <CreditCard className="w-3.5 h-3.5" /> Card
        </span>
      );
    } else if (m === 'credit' || m === 'deni' || m === 'kukopa') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
          <BookOpen className="w-3.5 h-3.5" /> Kukopa / Deni
        </span>
      );
    }
    return <span className="text-xs text-slate-500 uppercase font-semibold">{method}</span>;
  };

  return (
    <div className="space-y-6 relative font-sans text-slate-800 pb-12">
      
      {/* CUSTOM TOAST NOTIFICATION BANNER */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[60] px-5 py-4 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-md transition-all animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-900 text-white border-emerald-700' 
            : 'bg-red-900 text-white border-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <AlertCircle className="w-5 h-5 text-red-300" />}
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* TOP WELCOME BANNER (DEEP BLUE & VIBRANT GREEN LOGO ACCENTS) */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-blue-900">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Uza Kisasa
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <span>Karibu Kwenye Selguudi Dashboard</span>
            <span className="text-2xl">👋</span>
          </h1>
          
          <div className="flex items-center gap-2 text-blue-200 text-sm mt-2 font-medium">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="capitalize">{getFilterLabel()}</span>
          </div>
        </div>

        {/* SHOP BADGE */}
        <div className="z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl self-start md:self-auto shadow-lg">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-white p-1.5 shadow-md">
            <img 
              src="/selguudiLogo.png" 
              alt="Selguudi Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-extrabold text-blue-200">Biashara / Duka</p>
            <p className="text-lg font-black text-emerald-300 font-mono tracking-wide uppercase">
              {businessName}
            </p>
          </div>
        </div>
      </div>

      {/* DATE FILTER BUTTONS SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-blue-950 uppercase tracking-wider px-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Chagua Kipindi:</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateFilter('today')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
              dateFilter === 'today'
                ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-blue-950'
            }`}
          >
            Leo
          </button>

          <button
            onClick={() => setDateFilter('yesterday')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
              dateFilter === 'yesterday'
                ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-blue-950'
            }`}
          >
            Jana
          </button>

          <button
            onClick={() => setDateFilter('week')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 ${
              dateFilter === 'week'
                ? 'bg-blue-900 text-white shadow-md shadow-blue-900/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-blue-950'
            }`}
          >
            Wiki Hii (Siku 7)
          </button>
        </div>
      </div>

      {/* MAIN ANALYTICS CARDS (LARGE CARDS & BOLD NUMBERS) */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${statCards.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">{card.title}</span>
                <div className={`p-3 rounded-2xl border ${card.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>

              <div>
                <h3 className={`text-3xl md:text-3xl font-black font-mono tracking-tight ${card.valueColor}`}>
                  {card.value}
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-2 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" /> Ilioboreshwa kwa kipindi hiki
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* MCHANANGUO WA NJIA 4 ZA MALIPO */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-extrabold text-blue-950 uppercase tracking-wider">
          Mchanganuo wa Mauzo kwa Njia ya Malipo ({dateFilter === 'today' ? 'Leo' : dateFilter === 'yesterday' ? 'Jana' : 'Wiki Hii'})
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {paymentCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div 
                key={idx} 
                className="bg-slate-50 border border-slate-200/60 rounded-2xl p-5 flex items-center justify-between hover:bg-white hover:shadow-sm transition-all duration-200"
              >
                <div>
                  <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">{card.title}</p>
                  <h3 className={`text-xl font-black font-mono tracking-tight ${card.textColor}`}>{card.value}</h3>
                </div>
                <div className={`p-3 rounded-2xl ${card.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ORODHA YA MAUZO KULINGANA NA FILTER */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <PackageCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-extrabold text-blue-950">
              Orodha ya Mauzo ({dateFilter === 'today' ? 'Leo' : dateFilter === 'yesterday' ? 'Jana' : 'Wiki Hii'})
            </h2>
          </div>
          
          <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3.5 py-1.5 rounded-xl border border-blue-100 font-mono self-start sm:self-auto">
            Jumla: {filteredTransactions.length} Miamala
          </span>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm font-medium">
            Hakuna mauzo yaliyopatikana kwa kipindi hiki.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="text-xs text-slate-400 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Saa / Tarehe</th>
                  <th className="py-3.5 px-4 font-bold">Bidhaa Zilizouzwa / Mteja</th>
                  <th className="py-3.5 px-4 font-bold">Njia ya Malipo</th>
                  <th className="py-3.5 px-4 font-bold text-right">Kiasi Kilicholipwa</th>
                  <th className="py-3.5 px-4 font-bold text-center">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => {
                  const isRefunded = tx.status === 'REFUNDED';
                  const txDateObj = new Date(tx.created_at);
                  const txDisplayTime = dateFilter === 'today' 
                    ? txDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : `${txDateObj.toLocaleDateString('sw-TZ', { day: 'numeric', month: 'short' })} ${txDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

                  const customerInfo = tx.customer_name ? ` - Mteja: ${tx.customer_name}` : '';

                  return (
                    <tr key={tx.id} className={`hover:bg-slate-50/80 transition-colors ${isRefunded ? 'opacity-40 bg-red-50/30' : ''}`}>
                      <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{txDisplayTime}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-800 max-w-md">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {tx.items && tx.items.length > 0 ? (
                            tx.items.map((item, i) => {
                              const cat = item.category_name || item.product?.category_name || item.product?.category?.name || 'Bila Kundi';
                              return (
                                <span key={i} className="inline-flex items-center gap-1 bg-white border border-slate-200 shadow-2xs px-2.5 py-1 rounded-xl text-xs">
                                  <span className="font-semibold text-slate-800">{item.product_name || item.product?.name || 'Bidhaa'}</span>
                                  <span className="text-[10px] bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded-lg border border-blue-200 font-extrabold uppercase tracking-wider">
                                    {cat}
                                  </span>
                                  <span className="text-emerald-600 font-extrabold font-mono">({item.quantity}x)</span>
                                </span>
                              );
                            })
                          ) : (
                            <span className="font-semibold text-slate-700">Muamala wa Mauzo</span>
                          )}
                          {customerInfo && <span className="text-xs text-amber-600 font-bold">{customerInfo}</span>}
                        </div>
                        {isRefunded && <span className="block text-[10px] text-red-600 font-bold uppercase mt-1">(Muamala Umerejeshwa/Refunded)</span>}
                      </td>

                      <td className="py-4 px-4">
                        {renderPaymentBadge(tx.payment_method)}
                      </td>

                      <td className={`py-4 px-4 text-right font-black font-mono text-base ${isRefunded ? 'line-through text-slate-400' : 'text-blue-950'}`}>
                        {Number(tx.total_amount || tx.amount_paid || 0).toLocaleString()} <span className="text-xs font-bold text-slate-400">TZS</span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        {!isRefunded ? (
                          <button
                            onClick={() => { setSelectedTx(tx); setShowRefundModal(true); }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition shadow-2xs"
                            title="Rejesha Muamala Huu"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Refund</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-red-500">Refunded</span>
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-extrabold text-base">
                <RotateCcw className="w-5 h-5" />
                <span>Thibitisha Kurejesha Muamala</span>
              </div>
              <button 
                onClick={() => setShowRefundModal(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Kiasi cha Kurejesha:</span>
                <span className="text-blue-950 font-black font-mono text-sm">
                  {Number(selectedTx.total_amount || selectedTx.amount_paid || 0).toLocaleString()} TZS
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Njia ya Malipo:</span>
                <span className="text-slate-800 font-bold uppercase">{selectedTx.payment_method}</span>
              </div>
            </div>

            <form onSubmit={handleExecuteRefund} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Sababu ya Kurejesha (Refund Reason) *
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Mfano: Mteja kaleta bidhaa yenye kasoro / Cashier amekosea kiasi..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-800 text-sm focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  disabled={isRefunding}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl transition shadow-md shadow-red-600/20 flex items-center justify-center gap-2"
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