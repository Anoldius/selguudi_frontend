import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
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
  Lock
} from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [products, setProducts] = useState([]);

  // State ya Permissions
  const [permissions, setPermissions] = useState({
    show_profit_to_cashier: false,
    allow_cashier_debts: true,
    allow_cashier_custom_price: true,
    show_buying_price_to_cashier: false
  });

  // Filter choice: 'today', 'yesterday', 'week', au 'month'
  const [period, setPeriod] = useState('today');

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [summaryRes, transRes, prodRes, permRes] = await Promise.all([
        apiClient.get(`reports/dashboard/?period=${period}`),
        apiClient.get('sales/transactions/'),
        apiClient.get('inventory/products/'),
        apiClient.get('auth/business-permissions/')
      ]);

      if (summaryRes.data) setDashboardSummary(summaryRes.data);
      const transData = transRes.data.results || transRes.data || [];
      const prodData = prodRes.data.results || prodRes.data || [];

      setAllTransactions(transData);
      setProducts(prodData);
      if (permRes.data) setPermissions(permRes.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setLoading(false);
    }
  };

  // SOMA TOGGLE YA BIASHARA MOJA KWA MOJA BILA KUGUSIA USER ROLE
  const canSeeProfit = Boolean(permissions?.show_profit_to_cashier);

  // TAREHE LOGIC FOR FILTERING
  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Chuja Miamala Zisizofutwa/Refunded
  const filteredTransactions = allTransactions.filter(tx => {
    if (!tx.created_at || tx.status === 'REFUNDED') return false;
    const txDate = new Date(tx.created_at);

    if (period === 'today') {
      return txDate.toDateString() === today.toDateString();
    } else if (period === 'yesterday') {
      return txDate.toDateString() === yesterday.toDateString();
    } else if (period === 'week') {
      return txDate >= sevenDaysAgo && txDate <= today;
    } else if (period === 'month') {
      return txDate >= thirtyDaysAgo && txDate <= today;
    }
    return true;
  });

  // 1. MAUZO YA KIPINDI HUSIKA
  const totalSalesAmount = dashboardSummary?.today_total_sales ?? filteredTransactions.reduce((sum, tx) => {
    return sum + Number(tx.total_amount || tx.amount_paid || 0);
  }, 0);

  // 2. KOKOTOA TOP SELLING PRODUCTS
  const productSalesMap = {};

  filteredTransactions.forEach(tx => {
    if (tx.items && Array.isArray(tx.items)) {
      tx.items.forEach(item => {
        const pName = item.product_name || item.product?.name || item.product__name || 'Bidhaa';
        const qty = Number(item.quantity || item.total_quantity_sold || 0);
        const price = Number(item.unit_price || item.product?.selling_price || 0);

        if (!productSalesMap[pName]) {
          productSalesMap[pName] = {
            product__name: pName,
            total_quantity_sold: 0,
            total_revenue: 0
          };
        }

        productSalesMap[pName].total_quantity_sold += qty;
        productSalesMap[pName].total_revenue += (price * qty);
      });
    }
  });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.total_quantity_sold - a.total_quantity_sold);

  // 3. FAIDA KWA KIPINDI HICHO (INATOKANA NA BACKEND MOJA KWA MOJA)
  const displayProfit = canSeeProfit 
    ? (dashboardSummary?.today_estimated_profit ?? 0)
    : 0;

  // 4. LOW STOCK ALERT COUNT
  const lowStockCount = dashboardSummary?.low_stock_items_count ?? products.filter(p => {
    const stock = Number(p.quantity ?? p.stock_quantity ?? 0);
    const minAlert = Number(p.min_stock_alert || 5);
    return stock <= minAlert;
  }).length;

  const getPeriodLabel = () => {
    if (period === 'today') return 'ya Leo';
    if (period === 'yesterday') return 'ya Jana';
    if (period === 'week') return 'za Wiki Hii (Siku 7)';
    if (period === 'month') return 'za Mwezi Huu (Siku 30)';
    return '';
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            <span>Ripoti & Takwimu za Mauzo {getPeriodLabel()}</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Kagua mchanganuo wa mauzo, faida, na bidhaa zinazotoka zaidi kulingana na kipindi ulichochagua.
          </p>
        </div>

        <button
          onClick={fetchReportData}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-emerald-400" />
          <span>Refresh</span>
        </button>
      </div>

      {/* FILTER BUTTONS (LEO, JANA, WIKI HII, MWEZI HUU) */}
      <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Chagua Kipindi cha Takwimu:</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: 'today', label: 'Leo' },
            { id: 'yesterday', label: 'Jana' },
            { id: 'week', label: 'Wiki Hii (Siku 7)' },
            { id: 'month', label: 'Mwezi Huu (Siku 30)' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPeriod(item.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                period === item.id
                  ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
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
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mauzo {getPeriodLabel()}</span>
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

            {/* Estimated Profit Card (HONORS PERMISSIONS TOGGLE DIRECTLY) */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faida (Est.)</span>
                <div className={`p-3 rounded-2xl border ${
                  canSeeProfit ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800/40 border-slate-800 text-slate-500'
                }`}>
                  {canSeeProfit ? <TrendingUp className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                </div>
              </div>
              <div className="mt-4">
                <h3 className={`text-2xl font-extrabold font-mono ${canSeeProfit ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {canSeeProfit ? `${Number(displayProfit).toLocaleString()} TZS` : '*** TZS'}
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
                  {dashboardSummary?.today_receipts ?? filteredTransactions.length} <span className="text-xs font-normal text-slate-400">Risiti</span>
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
              <span>Bidhaa Zinazotoka Sana ({getPeriodLabel()})</span>
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