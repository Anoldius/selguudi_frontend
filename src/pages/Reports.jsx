import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  AlertTriangle,
  Loader2,
  PackageCheck
} from 'lucide-react';

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    today_total_sales: 0,
    today_estimated_profit: 0,
    today_receipts: 0,
    low_stock_items_count: 0
  });
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // 1. Vuta Muhtasari wa Leo kutoka Backend View
      const summaryRes = await apiClient.get('reports/dashboard/');
      if (summaryRes.data) {
        setSummary(summaryRes.data);
      }

      // 2. Vuta Top Selling Products
      const topRes = await apiClient.get('reports/top-selling/');
      if (topRes.data) {
        setTopProducts(topRes.data);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            <span>Ripoti & Takwimu za Mauzo ya Leo</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Kagua mchanganuo wa mauzo, faida, na bidhaa zinazotoka zaidi leo.</p>
        </div>

        <button
          onClick={fetchReportData}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-2xl border border-slate-700 transition"
        >
          Anza Pyaz / Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
          <span>Inapakia takwimu za leo...</span>
        </div>
      ) : (
        <>
          {/* Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* Today Total Sales Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Mauzo ya Leo</span>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-white">
                  {Number(summary.today_total_sales || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">TZS</span>
                </h3>
              </div>
              <p className="mt-2 text-xs text-slate-400">Jumla ya fedha zilizoingia</p>
            </div>

            {/* Estimated Profit Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Faida ya Leo (Est.)</span>
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-extrabold text-emerald-400">
                  {Number(summary.today_estimated_profit || 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">TZS</span>
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
                <h3 className="text-2xl font-extrabold text-white">
                  {summary.today_receipts || 0} <span className="text-xs font-normal text-slate-400">Risiti</span>
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
                <h3 className="text-2xl font-extrabold text-amber-400">
                  {summary.low_stock_items_count || 0} <span className="text-xs font-normal text-slate-400">Bidhaa</span>
                </h3>
              </div>
              <p className="mt-2 text-xs text-slate-400">Bidhaa zinazokaribia kuisha</p>
            </div>

          </div>

          {/* TOP SELLING PRODUCTS TABLE */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-emerald-400" />
              <span>Bidhaa Zinazotoka Sana (Top 10)</span>
            </h2>

            {topProducts.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 text-center">Hakuna data za bidhaa zilizouzwa bado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      <th className="py-3.5 px-4">Jina la Bidhaa</th>
                      <th className="py-3.5 px-4">Idadi Iliyouzwa</th>
                      <th className="py-3.5 px-4 text-right">Jumla ya Mapato</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {topProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition">
                        <td className="py-3.5 px-4 font-semibold text-white">{p.product__name}</td>
                        <td className="py-3.5 px-4 text-slate-300 font-bold">{p.total_quantity_sold}</td>
                        <td className="py-3.5 px-4 text-right text-emerald-400 font-bold">
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