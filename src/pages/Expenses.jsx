import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Loader2, 
  Check, 
  Receipt,
  Calendar,
  User,
  Clock,
  TrendingDown
} from 'lucide-react';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'FOOD',
    description: ''
  });

  useEffect(() => {
    fetchExpenses();
  }, []);

  const showNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchExpenses = async () => {
    try {
      const res = await apiClient.get('sales/expenses/');
      setExpenses(res.data.results || res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiClient.post('sales/expenses/', formData);
      showNotification(`Matumizi ya "${formData.title}" yamerekodiwa!`);
      setFormData({ title: '', amount: '', category: 'FOOD', description: '' });
      setIsSubmitting(false);
      fetchExpenses();
    } catch (err) {
      alert(err.response?.data?.detail || "Imeshindikana kuhifadhi matumizi!");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Je, una uhakika unataka kufuta rekodi hii ya matumizi?")) {
      try {
        await apiClient.delete(`sales/expenses/${id}/`);
        showNotification("Matumizi yamefutwa!");
        fetchExpenses();
      } catch (err) {
        alert("Imeshindikana kufuta matumizi!");
      }
    }
  };

  // --- LOGIC YA KUKOKOTOA MATUMIZI YA LEO, JANA, WIKI HII NA JUMLA YOTE ---
  const now = new Date();
  
  // Tarehe ya Leo (YYYY-MM-DD)
  const todayStr = now.toISOString().split('T')[0];

  // Tarehe ya Jana (YYYY-MM-DD)
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Tarehe ya Kuanzia Wiki Hii (Jumatatu iliyopita)
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay();
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(now.getDate() - distanceToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // 1. Matumizi ya Leo
  const todayExpenses = expenses
    .filter(item => item.created_at && item.created_at.startsWith(todayStr))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // 2. Matumizi ya Jana
  const yesterdayExpenses = expenses
    .filter(item => item.created_at && item.created_at.startsWith(yesterdayStr))
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // 3. Matumizi ya Wiki Hii
  const thisWeekExpenses = expenses
    .filter(item => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= startOfWeek;
    })
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  // 4. Jumla Kuu ya Matumizi Yote
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const getCategoryBadge = (cat) => {
    const categories = {
      UTILITIES: { label: 'Umeme / Maji', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      FOOD: { label: 'Chakula / Vinywaji', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
      TRANSPORT: { label: 'Usafiri / Nauli', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
      SUPPLIES: { label: 'Vifaa vya Ofisi', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
      OTHER: { label: 'Mengineyo', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
    };
    return categories[cat] || categories.OTHER;
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-500 text-slate-950 font-bold px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400 animate-bounce">
          <Check className="w-5 h-5 bg-slate-950 text-emerald-400 rounded-full p-0.5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Wallet className="w-7 h-7 text-emerald-400" />
          <span>Matumizi ya Duka (Expenses)</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">Sajili matumizi ya kila siku ili kupata hesabu halisi za faida.</p>
      </div>

      {/* SUMMARY CARDS: LEO, JANA, WIKI HII, JUMLA YOTE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Leo */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Leo</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-400 font-mono">
            {todayExpenses.toLocaleString()} TZS
          </p>
        </div>

        {/* Card 2: Jana */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Jana</span>
            <Calendar className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl font-extrabold text-blue-400 font-mono">
            {yesterdayExpenses.toLocaleString()} TZS
          </p>
        </div>

        {/* Card 3: Wiki Hii */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Wiki Hii</span>
            <TrendingDown className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-extrabold text-purple-400 font-mono">
            {thisWeekExpenses.toLocaleString()} TZS
          </p>
        </div>

        {/* Card 4: Jumla Kuu */}
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Jumla Yote</span>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-extrabold text-amber-400 font-mono">
            {totalExpense.toLocaleString()} TZS
          </p>
        </div>

      </div>

      {/* Main Grid: Form + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form ya Kuingiza Matumizi */}
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl space-y-5 h-fit">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-400" />
            <span>Sajili Matumizi Mpya</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Jina la Matumizi</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Mfano: LUKU ya dukani, Nauli, Chakula"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Kiasi (TZS)</label>
              <input
                type="number"
                name="amount"
                step="0.01"
                required
                value={formData.amount}
                onChange={handleInputChange}
                placeholder="5000"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Aina ya Matumizi</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="FOOD">Chakula / Vinywaji</option>
                <option value="UTILITIES">Umeme / Maji</option>
                <option value="TRANSPORT">Usafiri / Nauli</option>
                <option value="SUPPLIES">Vifaa vya Ofisi</option>
                <option value="OTHER">Mengineyo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Maelezo ya Ziada (Hiari)</label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Andika maelezo kwa ufupi..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 font-bold text-slate-950 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              <span>Hifadhi Matumizi</span>
            </button>
          </form>
        </div>

        {/* Orodha ya Matumizi (Expenses List) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span>Orodha ya Matumizi yaliyorekodiwa</span>
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Inapakia matumizi...</span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              Hakuna matumizi yaliyorekodiwa bado.
            </div>
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => {
                const badge = getCategoryBadge(exp.category);
                return (
                  <div 
                    key={exp.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 gap-3 hover:border-slate-700 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{exp.title}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{exp.description || 'Bila maelezo'}</p>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          {exp.recorded_by_name || 'Admin'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(exp.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                      <span className="font-extrabold font-mono text-amber-400 text-base">
                        -{Number(exp.amount).toLocaleString()} TZS
                      </span>
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                        title="Futa Matumizi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}