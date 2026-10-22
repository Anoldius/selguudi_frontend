import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle,
  Loader2,
  PackageCheck,
  Filter,
  RefreshCw,
  ShieldAlert,
  Download
} from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  // 1. INSTANT CACHE LOAD KUTOKA LOCALSTORAGE
  const [allTransactions, setAllTransactions] = useState(() => {
    const cached = localStorage.getItem('selguudi_rep_transactions');
    return cached ? JSON.parse(cached) : [];
  });

  const [products, setProducts] = useState(() => {
    const cached = localStorage.getItem('selguudi_rep_products');
    return cached ? JSON.parse(cached) : [];
  });

  const [permissions, setPermissions] = useState(() => {
    const cached = localStorage.getItem('selguudi_rep_permissions');
    return cached ? JSON.parse(cached) : { show_profit_to_cashier: false };
  });

  const [loading, setLoading] = useState(() => {
    const cachedTx = localStorage.getItem('selguudi_rep_transactions');
    return !cachedTx;
  });

  // Dynamic Period Choice
  const [periodOption, setPeriodOption] = useState('month_1');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Kokotoa Tarehe kulingana na Chaguo
  useEffect(() => {
    calculateDatesFromOption(periodOption);
  }, [periodOption]);

  // Pakua data zote mwanzoni
  useEffect(() => {
    fetchReportData();
  }, []);

  const calculateDatesFromOption = (option) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();

    const formatDate = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    switch (option) {
      case 'today':
        start = new Date();
        break;
      case 'yesterday':
        start.setDate(today.getDate() - 1);
        end.setDate(today.getDate() - 1);
        break;
      case 'juzi':
        start.setDate(today.getDate() - 2);
        end.setDate(today.getDate() - 2);
        break;
      case 'month_1': // Mwezi Huu
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'month_2':
        start.setMonth(today.getMonth() - 1);
        break;
      case 'month_3':
        start.setMonth(today.getMonth() - 2);
        break;
      case 'year_1': // Mwaka Huu
        start = new Date(today.getFullYear(), 0, 1);
        break;
      case 'custom':
        return;
      default:
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
    }

    setStartDate(formatDate(start));
    setEndDate(formatDate(end));
  };

  // 2. BACKGROUND SYNC: VUTA DATA MPYA KIMYA KIMYA
  const fetchReportData = async () => {
    try {
      const [transRes, prodRes, permRes] = await Promise.all([
        apiClient.get('sales/transactions/'),
        apiClient.get('inventory/products/'),
        apiClient.get('auth/business-permissions/').catch(() => ({ data: null }))
      ]);

      const transData = transRes.data?.results || transRes.data || [];
      const prodData = prodRes.data?.results || prodRes.data || [];
      const permData = permRes?.data || permissions;

      const txList = Array.isArray(transData) ? transData : [];
      const pList = Array.isArray(prodData) ? prodData : [];

      setAllTransactions(txList);
      setProducts(pList);
      if (permRes?.data) setPermissions(permData);

      localStorage.setItem('selguudi_rep_transactions', JSON.stringify(txList));
      localStorage.setItem('selguudi_rep_products', JSON.stringify(pList));
      localStorage.setItem('selguudi_rep_permissions', JSON.stringify(permData));

    } catch (err) {
      console.error("Error background fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const canSeeProfit = isOwner || Boolean(permissions?.show_profit_to_cashier);

  if (!loading && !canSeeProfit) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white border-2 border-red-500/40 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-blue-950">Huwezi Kuona Ukurasa Huu</h3>
          <p className="text-sm font-semibold text-slate-500">
            Ruhusa ya kuona Ripoti & Takwimu imezimwa kwenye Mipangilio ya Duka na Mmiliki (Boss).
          </p>
        </div>
      </div>
    );
  }

  // CHUJA MIAMALA: ONDOA REFUNDED NA UCHUJE KULINGANA NA TAREHE. 
  // ONDOA PIA MALIPO YA "credit" (DENI) ILI KUPATA MAUZO HALISI.
  const filteredTransactions = allTransactions.filter(tx => {
    if (!tx.created_at || tx.status === 'REFUNDED' || tx.status === 'CANCELLED') return false;
    
    // KAMA UNATAKA KUCHUJA MAUZO HALISI BILA KUJUMUISHA DENI (CREDIT), ONDOA PAYMENT METHOD YA CREDIT HAPA:
    const paymentMethod = tx.payment_method?.toLowerCase() || '';
    if (paymentMethod === 'credit' || paymentMethod === 'deni') return false;

    const txDateStr = new Date(tx.created_at).toISOString().split('T')[0];
    
    if (startDate && endDate) {
      return txDateStr >= startDate && txDateStr <= endDate;
    }
    return true;
  });

  // 1. KOKOTOA JUMLA YA MAUZO HALISI YA KIPINDI HICHO
  const totalSalesAmount = filteredTransactions.reduce((sum, tx) => {
    return sum + Number(tx.total_amount ?? tx.amount_paid ?? 0);
  }, 0);

  // 2. KOKOTOA FAIDA NA TOP SELLING PRODUCTS
  let calculatedProfit = 0;
  const productSalesMap = {};
  const dailyChartMap = {};

  filteredTransactions.forEach(tx => {
    const txDateStr = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const txSales = Number(tx.total_amount ?? tx.amount_paid ?? 0);
    
    if (!dailyChartMap[txDateStr]) {
      dailyChartMap[txDateStr] = { date: txDateStr, mauzo: 0, faida: 0 };
    }
    dailyChartMap[txDateStr].mauzo += txSales;

    if (tx.items && Array.isArray(tx.items)) {
      tx.items.forEach(item => {
        const pName = item.product_name || item.product?.name || item.product__name || 'Bidhaa';
        const qty = Number(item.quantity || item.total_quantity_sold || 0);
        const sellingPrice = Number(item.unit_price || item.product?.selling_price || 0);
        const buyingPrice = Number(item.buying_price || item.product?.buying_price || 0);

        const itemProfit = (sellingPrice - buyingPrice) * qty;
        const finalItemProfit = itemProfit > 0 ? itemProfit : 0;
        
        calculatedProfit += finalItemProfit;
        dailyChartMap[txDateStr].faida += finalItemProfit;

        if (!productSalesMap[pName]) {
          productSalesMap[pName] = {
            product__name: pName,
            total_quantity_sold: 0,
            total_revenue: 0
          };
        }

        productSalesMap[pName].total_quantity_sold += qty;
        productSalesMap[pName].total_revenue += (sellingPrice * qty);
      });
    }
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.total_quantity_sold - a.total_quantity_sold);
  const chartData = Object.values(dailyChartMap);

  // 3. LOW STOCK COUNT
  const lowStockCount = products.filter(p => {
    const stock = Number(p.quantity ?? p.stock_quantity ?? 0);
    const minAlert = Number(p.min_stock_alert || 5);
    return stock <= minAlert;
  }).length;

  const getProportionalImage = (imageUrl, maxWidth) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = imageUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const base64 = canvas.toDataURL('image/png');
        const aspectRatio = img.naturalHeight / img.naturalWidth;
        const calculatedHeight = maxWidth * aspectRatio;

        resolve({
          base64,
          width: maxWidth,
          height: calculatedHeight
        });
      };
      img.onerror = reject;
    });
  };

  // EXPORT PDF YENYE LOGO KWENYE KONTENA JEPESI (WHITE BOX)
  const exportPDF = async () => {
    const doc = new jsPDF();
    const businessName = user?.business_name || 'Selguudi POS';

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 55, 'F');

    let currentY = 12;

    try {
      // Weka Logo ndani ya sanduku jeupe kwenye PDF kwanza (White background box simulation)
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 5, 46, 22, 2, 2, 'F');

      const logoData = await getProportionalImage('/uzakisasa.png', 40);
      doc.addImage(logoData.base64, 'PNG', 15, 7, logoData.width, logoData.height); 
      currentY = 32;
    } catch (err) {
      console.error("Logo haijapatikana:", err);
      currentY = 16;
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text(businessName.toUpperCase(), 14, currentY + 4);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(52, 211, 153);
    doc.text("RIPOTI RASMI YA MAUZO HALISI (BILA DENI)", 14, currentY + 10);

    doc.setTextColor(203, 213, 225);
    doc.text(`Kipindi: ${startDate} hadi ${endDate}`, 14, currentY + 16);

    const summaryDataPDF = [
      [
        `Jumla ya Mauzo Halisi: ${Number(totalSalesAmount).toLocaleString()} TZS`,
        `Kadirio la Faida: ${Number(calculatedProfit).toLocaleString()} TZS`
      ],
      [
        `Jumla ya Miamala: ${filteredTransactions.length} Risiti`,
        `Bidhaa zenye Alert ya Stoko: ${lowStockCount}`
      ]
    ];

    autoTable(doc, {
      startY: Math.max(60, currentY + 22),
      body: summaryDataPDF,
      theme: 'plain',
      styles: {
        fontSize: 10,
        fontStyle: 'bold',
        cellPadding: 4,
        textColor: [15, 23, 42],
        fillColor: [241, 245, 249]
      }
    });

    const tableRows = topProducts.map((p, index) => [
      index + 1,
      p.product__name,
      `${p.total_quantity_sold} pcs`,
      `${Number(p.total_revenue || 0).toLocaleString()} TZS`
    ]);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['#', 'Jina la Bidhaa', 'Idadi Iliyouzwa', 'Jumla ya Mapato']],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3
      }
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`Imetolewa na Selguudi POS | Ukurasa ${i} wa ${pageCount}`, 14, 285);
    }

    doc.save(`Ripoti_Halisi_${businessName}_${startDate}_hadi_${endDate}.pdf`);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-emerald-500/50 p-3 rounded-2xl shadow-xl font-sans text-xs space-y-1.5">
          <p className="font-black text-blue-950 border-b border-slate-100 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4">
              <span className="font-extrabold flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-black font-mono text-blue-950">
                {Number(entry.value).toLocaleString()} TZS
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 pb-12">
      
      {/* Top Header Banner na Logo Kwenye Kontena Jeupec (White Box) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 p-6 sm:p-8 rounded-3xl text-white shadow-xl border-2 border-emerald-500/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-5 z-10">
          {/* LOGO KILA KWENYE BOKSI JEPESI (CLEAN WHITE CONTAINER) */}
          <div className="bg-white p-3 rounded-2xl border-2 border-emerald-500/40 shadow-lg flex items-center justify-center shrink-0">
            <img 
              src="/uzakisasa.png" 
              alt="Logo" 
              className="h-10 sm:h-12 w-auto max-w-[140px] object-contain"
            />
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              <span>Ripoti & Takwimu za Mauzo Halisi</span>
            </h1>
            <p className="text-blue-200 text-xs sm:text-sm mt-0.5">
              Mchanganuo safi wa mauzo ya pesa taslimu/lipanamba bila kujumuisha madeni.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={exportPDF}
            disabled={loading || topProducts.length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Pakua PDF Rasmi</span>
          </button>

          <button
            onClick={fetchReportData}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-emerald-300 text-xs font-extrabold rounded-2xl border border-white/20 transition shadow-md"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* FILTER CARD */}
      <div className="bg-white border-2 border-emerald-500/40 p-5 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-black text-blue-950 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-emerald-600" />
          <span>Chagua Kipindi cha Takwimu:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Chaguo la Haraka</label>
            <select
              value={periodOption}
              onChange={(e) => setPeriodOption(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl text-blue-950 font-bold text-sm focus:outline-none focus:border-emerald-600"
            >
              <option value="today">Leo</option>
              <option value="yesterday">Jana</option>
              <option value="juzi">Juzi</option>
              <option value="month_1">Mwezi Huu</option>
              <option value="month_2">Miezi 2 Zilizopita</option>
              <option value="month_3">Miezi 3 Zilizopita</option>
              <option value="year_1">Mwaka Huu</option>
              <option value="custom">Chagua Tarehe Maalum (Custom)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Kuanzia Tarehe</label>
            <input
              type="date"
              value={startDate}
              disabled={periodOption !== 'custom'}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl text-blue-950 text-sm focus:outline-none focus:border-emerald-600 disabled:opacity-50 font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Hadi Tarehe</label>
            <input
              type="date"
              value={endDate}
              disabled={periodOption !== 'custom'}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl text-blue-950 text-sm focus:outline-none focus:border-emerald-600 disabled:opacity-50 font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500 gap-2 font-medium">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          <span>Inapakia takwimu na ripoti...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Jumla ya Mauzo Halisi</span>
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-blue-950 font-mono">
                  {Number(totalSalesAmount).toLocaleString()} <span className="text-xs font-bold text-slate-500">TZS</span>
                </h3>
              </div>
              <p className="mt-2 text-xs text-slate-500 font-semibold">Bila kujumuisha madeni</p>
            </div>

            <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Faida (Est.)</span>
                <div className="p-3 rounded-2xl border bg-emerald-50 border-emerald-200 text-emerald-700">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black font-mono text-emerald-700">
                  {Number(calculatedProfit).toLocaleString()} TZS
                </h3>
              </div>
              <p className="mt-2 text-xs text-slate-500 font-semibold">Mauzo Halisi minus Bei za kununulia</p>
            </div>

            <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Miamala / Risiti</span>
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-blue-950 font-mono">
                  {filteredTransactions.length} <span className="text-xs font-bold text-slate-500">Risiti</span>
                </h3>
              </div>
              <p className="mt-2 text-xs text-slate-500 font-semibold">Idadi ya mauzo halisi</p>
            </div>

            <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 relative overflow-hidden shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Alert ya Stoko</span>
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-black text-amber-600 font-mono">
                  {lowStockCount} <span className="text-xs font-bold text-slate-500">Bidhaa</span>
                </h3>
              </div>
              <p className="mt-2 text-xs text-slate-500 font-semibold">Bidhaa zinazokaribia kuisha</p>
            </div>

          </div>

          {/* BAR CHART SECTION */}
          <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-black text-blue-950 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>Mwenendo wa Mauzo Halisi na Faida (Graph)</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Mchanganuo wa mauzo na faida halisi kwa kila siku</p>
              </div>

              <div className="flex items-center gap-4 text-xs font-extrabold">
                <div className="flex items-center gap-1.5 text-blue-950">
                  <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 inline-block shadow-2xs" />
                  <span>Mauzo</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-950">
                  <span className="w-3.5 h-3.5 rounded-md bg-blue-900 inline-block shadow-2xs" />
                  <span>Faida</span>
                </div>
              </div>
            </div>

            {chartData.length === 0 ? (
              <p className="text-sm text-slate-400 font-semibold py-12 text-center">Hakuna data za mauzo za kuonyesha kwenye graph kwa kipindi hiki.</p>
            ) : (
              <div className="h-80 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mauzoGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                        <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                      </linearGradient>
                      <linearGradient id="faidaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1e3a8a" stopOpacity={1} />
                        <stop offset="100%" stopColor="#1e1b4b" stopOpacity={0.85} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#64748b" 
                      fontSize={11} 
                      fontWeight={700}
                      tickLine={false} 
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={11} 
                      fontWeight={700}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} 
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    <Bar 
                      dataKey="mauzo" 
                      name="Mauzo" 
                      fill="url(#mauzoGradient)" 
                      radius={[8, 8, 0, 0]} 
                      maxBarSize={40}
                    />
                    <Bar 
                      dataKey="faida" 
                      name="Faida" 
                      fill="url(#faidaGradient)" 
                      radius={[8, 8, 0, 0]} 
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* TOP SELLING PRODUCTS TABLE */}
          <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-black text-blue-950 mb-4 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-600" />
              <span>Bidhaa Zinazotoka Sana ({startDate} hadi {endDate})</span>
            </h2>

            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 font-semibold py-6 text-center">Hakuna data za bidhaa zilizouzwa kwa kipindi hiki.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-black">
                      <th className="py-3.5 px-4">Jina la Bidhaa</th>
                      <th className="py-3.5 px-4 text-center">Idadi Iliyouzwa</th>
                      <th className="py-3.5 px-4 text-right">Jumla ya Mapato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700 font-semibold">
                    {topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-extrabold text-blue-950">{p.product__name}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-600">{p.total_quantity_sold} pcs</td>
                        <td className="py-3.5 px-4 text-right text-blue-950 font-mono font-black">
                          {Number(p.total_revenue || 0).toLocaleString()} TZS
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </>
      )}

    </div>
  );
}