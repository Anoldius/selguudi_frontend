import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState([]);
  const [products, setProducts] = useState([]);

  // State ya Permissions
  const [permissions, setPermissions] = useState({
    show_profit_to_cashier: false,
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

      case 'month_4':
        start.setMonth(today.getMonth() - 3);
        break;

      case 'month_5':
        start.setMonth(today.getMonth() - 4);
        break;

      case 'month_6':
        start.setMonth(today.getMonth() - 5);
        break;

      case 'year_1': // Mwaka Huu
        start = new Date(today.getFullYear(), 0, 1);
        break;

      case 'year_2':
        start.setFullYear(today.getFullYear() - 1);
        break;

      case 'year_3':
        start.setFullYear(today.getFullYear() - 2);
        break;

      case 'year_4':
        start.setFullYear(today.getFullYear() - 3);
        break;

      case 'year_5':
        start.setFullYear(today.getFullYear() - 4);
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

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [transRes, prodRes, permRes] = await Promise.all([
        apiClient.get('sales/transactions/'),
        apiClient.get('inventory/products/'),
        apiClient.get('auth/business-permissions/').catch(() => ({ data: null }))
      ]);

      const transData = transRes.data?.results || transRes.data || [];
      const prodData = prodRes.data?.results || prodRes.data || [];

      setAllTransactions(Array.isArray(transData) ? transData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
      if (permRes?.data) setPermissions(permRes.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const canSeeProfit = isOwner || Boolean(permissions?.show_profit_to_cashier);

  if (!loading && !canSeeProfit) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Huwezi Kuona Ukurasa Huu</h3>
          <p className="text-sm text-slate-400">
            Ruhusa ya kuona Ripoti & Takwimu imezimwa kwenye Mipangilio ya Duka na Mmiliki (Boss).
          </p>
        </div>
      </div>
    );
  }

  // CHUJA MIAMALA KULINGANA NA TAREHE ZILIZOCHAGULIWA
  const filteredTransactions = allTransactions.filter(tx => {
    if (!tx.created_at || tx.status === 'REFUNDED' || tx.status === 'CANCELLED') return false;
    
    const txDateStr = new Date(tx.created_at).toISOString().split('T')[0];
    
    if (startDate && endDate) {
      return txDateStr >= startDate && txDateStr <= endDate;
    }
    return true;
  });

  // 1. KOKOTOA JUMLA YA MAUZO YA KIPINDI HICHO
  const totalSalesAmount = filteredTransactions.reduce((sum, tx) => {
    return sum + Number(tx.total_amount ?? tx.amount_paid ?? 0);
  }, 0);

  // 2. KOKOTOA FAIDA NA TOP SELLING PRODUCTS
  let calculatedProfit = 0;
  const productSalesMap = {};

  filteredTransactions.forEach(tx => {
    if (tx.items && Array.isArray(tx.items)) {
      tx.items.forEach(item => {
        const pName = item.product_name || item.product?.name || item.product__name || 'Bidhaa';
        const qty = Number(item.quantity || item.total_quantity_sold || 0);
        const sellingPrice = Number(item.unit_price || item.product?.selling_price || 0);
        const buyingPrice = Number(item.buying_price || item.product?.buying_price || 0);

        const itemProfit = (sellingPrice - buyingPrice) * qty;
        calculatedProfit += itemProfit > 0 ? itemProfit : 0;

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

  // 3. LOW STOCK COUNT
  const lowStockCount = products.filter(p => {
    const stock = Number(p.quantity ?? p.stock_quantity ?? 0);
    const minAlert = Number(p.min_stock_alert || 5);
    return stock <= minAlert;
  }).length;

  // HELPER FUNCTION YA KUBADILISHA LOGO KUTOKA PUBLIC FOLDER KUWA BASE64
  const getBase64ImageFromUrl = async (imageUrl) => {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

 // EXPORT PDF YENYE LOGO YENYE UWIANO SAHIHI (ASPECT RATIO)
  const exportPDF = async () => {
    const doc = new jsPDF();
    const businessName = user?.business_name || 'Selguudi POS';

    // Header Background Accent (Dark Slate)
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 52, 'F');

    let currentY = 12;

    // Pakia na weka Logo ya Selguudiadobe bila kubana aspect ratio
    try {
      const logoBase64 = await getBase64ImageFromUrl('/Selguudiadobe.png');
      
      // Vipimo vilivyorekebishwa: Width 45mm, Height 10mm ili isijibane
      doc.addImage(logoBase64, 'PNG', 14, 7, 45, 10); 
      currentY = 25; // Sukuma maandishi chini ya logo
    } catch (err) {
      console.error("Logo haijapatikana:", err);
      currentY = 16;
    }

    // Title & Business Header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(businessName.toUpperCase(), 14, currentY);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(52, 211, 153); // Emerald Green
    doc.text("RIPOTI RASMI YA MAUZO NA BIDHAA", 14, currentY + 6);

    doc.setTextColor(203, 213, 225);
    doc.text(`Kipindi: ${startDate} hadi ${endDate}`, 14, currentY + 12);

    // Summary Box in PDF
    const summaryDataPDF = [
      [
        `Jumla ya Mauzo: ${Number(totalSalesAmount).toLocaleString()} TZS`,
        `Kadirio la Faida: ${Number(calculatedProfit).toLocaleString()} TZS`
      ],
      [
        `Jumla ya Miamala: ${filteredTransactions.length} Risiti`,
        `Bidhaa zenye Alert ya Stoko: ${lowStockCount}`
      ]
    ];

    autoTable(doc, {
      startY: 56,
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

    doc.save(`Ripoti_${businessName}_${startDate}_hadi_${endDate}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            <span>Ripoti & Takwimu za Mauzo</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Kagua mchanganuo wa mauzo, faida, na bidhaa zinazotoka zaidi kulingana na kipindi ulichochagua.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportPDF}
            disabled={loading || topProducts.length === 0}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Pakua PDF</span>
          </button>

          <button
            onClick={fetchReportData}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 transition"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* FILTER CARD */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Chagua Kipindi cha Takwimu:</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Chaguo la Haraka</label>
            <select
              value={periodOption}
              onChange={(e) => setPeriodOption(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value="today">Leo</option>
              <option value="yesterday">Jana</option>
              <option value="juzi">Juzi</option>
              <option value="month_1">Mwezi Huu</option>
              <option value="month_2">Miezi 2 Zilizopita</option>
              <option value="month_3">Miezi 3 Zilizopita</option>
              <option value="month_4">Miezi 4 Zilizopita</option>
              <option value="month_5">Miezi 5 Zilizopita</option>
              <option value="month_6">Miezi 6 Zilizopita</option>
              <option value="year_1">Mwaka Huu</option>
              <option value="year_2">Miaka 2 Zilizopita</option>
              <option value="year_3">Miaka 3 Zilizopita</option>
              <option value="year_4">Miaka 4 Zilizopita</option>
              <option value="year_5">Miaka 5 Zilizopita</option>
              <option value="custom">Chagua Tarehe Maalum (Custom)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Kuanzia Tarehe</label>
            <input
              type="date"
              value={startDate}
              disabled={periodOption !== 'custom'}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Hadi Tarehe</label>
            <input
              type="date"
              value={endDate}
              disabled={periodOption !== 'custom'}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Inapakia takwimu na ripoti...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Mauzo Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Jumla ya Mauzo</span>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-white font-mono">
                  {Number(totalSalesAmount).toLocaleString()} <span className="text-xs font-normal text-slate-400">TZS</span>
                </h3>
              </div>
              <p className="mt-2 text-xs text-slate-400">Jumla ya fedha zilizoingia</p>
            </div>

            {/* Estimated Profit Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faida (Est.)</span>
                <div className="p-3 rounded-2xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold font-mono text-emerald-400">
                  {Number(calculatedProfit).toLocaleString()} TZS
                </h3>
              </div>
              <p className="mt-2 text-xs text-slate-400">Mauzo minus Bei za kununulia</p>
            </div>

            {/* Total Receipts Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Miamala / Risiti</span>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-white font-mono">
                  {filteredTransactions.length} <span className="text-xs font-normal text-slate-400">Risiti</span>
                </h3>
              </div>
              <p className="mt-2 text-xs text-slate-400">Idadi ya mauzo yaliyofanyika</p>
            </div>

            {/* Low Stock Items Count */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Alert ya Stoko</span>
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-amber-400 font-mono">
                  {lowStockCount} <span className="text-xs font-normal text-slate-400">Bidhaa</span>
                </h3>
              </div>
              <p className="mt-2 text-xs text-slate-400">Bidhaa zinazokaribia kuisha</p>
            </div>

          </div>

          {/* TOP SELLING PRODUCTS TABLE */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
              <span>Bidhaa Zinazotoka Sana ({startDate} hadi {endDate})</span>
            </h2>

            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">Hakuna data za bidhaa zilizouzwa kwa kipindi hiki.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">Jina la Bidhaa</th>
                      <th className="py-3.5 px-4 text-center">Idadi Iliyouzwa</th>
                      <th className="py-3.5 px-4 text-right">Jumla ya Mapato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                    {topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-semibold text-white">{p.product__name}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-200">{p.total_quantity_sold} pcs</td>
                        <td className="py-3.5 px-4 text-right text-emerald-400 font-mono font-bold">
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