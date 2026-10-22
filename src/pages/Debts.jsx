import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { 
  Users, 
  CreditCard, 
  DollarSign, 
  Search, 
  Plus, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader2, 
  X, 
  Check, 
  Phone,
  UserPlus,
  Trash2,
  Calendar,
  Filter,
  ShoppingBag
} from 'lucide-react';

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('debts');

  // Date Filtering States
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'yesterday', 'juzi', 'custom'
  const [customDate, setCustomDate] = useState('');

  // Modals States
  const [showPayModal, setShowPayModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddDebtModal, setShowAddDebtModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [selectedDebt, setSelectedDebt] = useState(null);
  const [debtToDelete, setDebtToDelete] = useState(null);

  // Form States
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [customerData, setCustomerData] = useState({ name: '', phone: '' });
  const [debtData, setDebtData] = useState({ customer: '', total_amount: '', due_date: '', items_summary: '' });

  // Floating Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [debtsRes, custRes] = await Promise.all([
        apiClient.get('sales/debts/'),
        apiClient.get('sales/customers/')
      ]);
      setDebts(debtsRes.data.results || debtsRes.data);
      setCustomers(custRes.data.results || custRes.data);
    } catch (err) {
      console.error("Error fetching debt data:", err);
      triggerToast("Imeshindikana kuvuta taarifa za madeni!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('sales/customers/', customerData);
      triggerToast("Mteja amesajiliwa vizuri! 🎉", "success");
      setShowAddCustomerModal(false);
      setCustomerData({ name: '', phone: '' });
      fetchData();
    } catch (err) {
      triggerToast(err.response?.data?.message || "Imeshindikana kusajili mteja!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDebt = async (e) => {
    e.preventDefault();
    if (!debtData.customer || !debtData.total_amount) {
      triggerToast("Tafadhali chagua mteja na uweke kiasi cha deni!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const amount = parseFloat(debtData.total_amount);

      const payload = {
        customer: debtData.customer,
        total_amount: amount,
        remaining_amount: amount,
        items_summary: debtData.items_summary || 'Bidhaa mbalimbali'
      };

      if (debtData.due_date && debtData.due_date.trim() !== '') {
        payload.due_date = debtData.due_date;
      }

      await apiClient.post('sales/debts/', payload);
      triggerToast("Deni jipya limesajiliwa vizuri! 📝", "success");
      setShowAddDebtModal(false);
      setDebtData({ customer: '', total_amount: '', due_date: '', items_summary: '' });
      fetchData();
    } catch (err) {
      console.error("Error creating debt:", err.response?.data);
      triggerToast(err.response?.data?.message || "Imeshindikana kurekodi deni!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayDebt = async (e) => {
    e.preventDefault();
    if (!payAmount || Number(payAmount) <= 0) {
      triggerToast("Ingiza kiasi sahihi cha malipo!", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`sales/debts/${selectedDebt.id}/pay/`, {
        amount_paid: parseFloat(payAmount),
        notes: payNotes
      });
      triggerToast("Malipo yamesajiliwa vizuri! 🎉", "success");
      setShowPayModal(false);
      setPayAmount('');
      setPayNotes('');
      fetchData();
    } catch (err) {
      triggerToast(err.response?.data?.error || err.response?.data?.message || "Imeshindikana kurekodi malipo!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDebt = async () => {
    if (!debtToDelete) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`sales/debts/${debtToDelete.id}/`);
      triggerToast("Deni limefutwa kabisa kwenye mfumo! 🗑️", "success");
      setShowDeleteModal(false);
      setDebtToDelete(null);
      fetchData();
    } catch (err) {
      console.error("Delete Debt Error:", err.response);
      triggerToast(err.response?.data?.message || "Imeshindikana kufuta deni hili!", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const totalDebtAmount = debts
    .filter(d => d.status !== 'PAID')
    .reduce((acc, curr) => acc + Number(curr.remaining_amount || 0), 0);

  const activeDebtorsCount = debts.filter(d => d.status !== 'PAID').length;

  // CHUJO LA TAREHE NA SEARCH
  const filteredDebts = debts.filter(d => {
    const matchesSearch = 
      d.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      (d.customer_phone && d.customer_phone.includes(search)) ||
      (d.items_summary && d.items_summary.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (dateFilter === 'all') return true;

    if (!d.created_at) return false;
    const debtDateStr = new Date(d.created_at).toISOString().split('T')[0];
    
    const today = new Date();
    const formatDate = (dObj) => {
      const year = dObj.getFullYear();
      const month = String(dObj.getMonth() + 1).padStart(2, '0');
      const day = String(dObj.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    if (dateFilter === 'today') {
      return debtDateStr === formatDate(today);
    }
    if (dateFilter === 'yesterday') {
      const yest = new Date();
      yest.setDate(today.getDate() - 1);
      return debtDateStr === formatDate(yest);
    }
    if (dateFilter === 'juzi') {
      const juzi = new Date();
      juzi.setDate(today.getDate() - 2);
      return debtDateStr === formatDate(juzi);
    }
    if (dateFilter === 'custom' && customDate) {
      return debtDateStr === customDate;
    }

    return true;
  });

  return (
    <div className="w-full space-y-6 relative font-sans text-slate-800 pb-12">
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-4 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-md transition-all animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-600 border-emerald-500 text-white shadow-emerald-900/20' 
            : 'bg-red-600 border-red-500 text-white shadow-red-900/20'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-white" /> : <AlertCircle className="w-5 h-5 text-white" />}
          <span className="text-xs font-black tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 p-6 rounded-3xl text-white shadow-xl border-2 border-emerald-500/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="z-10 relative">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-400" />
            <span>Daftari la Madeni & Wateja</span>
          </h1>
          <p className="text-blue-200 text-sm mt-1">Simamia madeni ya wateja, kagua bidhaa walizokopa, na rekodi malipo.</p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="px-4 py-3 bg-white/10 hover:bg-white/20 text-emerald-300 font-extrabold rounded-2xl border border-white/20 flex items-center gap-2 transition shadow-md"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Mteja Mpya</span>
          </button>

          <button
            onClick={() => setShowAddDebtModal(true)}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Sajili Deni Jipya</span>
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border-2 border-emerald-500/40 p-6 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Jumla ya Madeni Nje</p>
            <p className="text-2xl font-black text-amber-600 font-mono mt-1">
              {totalDebtAmount.toLocaleString()} <span className="text-xs text-slate-500 font-bold">TZS</span>
            </p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border-2 border-emerald-500/40 p-6 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Wateja Wanaodaiwa</p>
            <p className="text-2xl font-black text-blue-950 font-mono mt-1">{activeDebtorsCount} <span className="text-xs text-slate-500 font-bold">Wateja</span></p>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border-2 border-emerald-500/40 p-6 rounded-3xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-xs font-extrabold uppercase tracking-wider">Madeni Yaliyokamilika</p>
            <p className="text-2xl font-black text-emerald-700 font-mono mt-1">
              {debts.filter(d => d.status === 'PAID').length} <span className="text-xs text-slate-500 font-bold">Yalolipwa</span>
            </p>
          </div>
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH AND TABS */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tafuta mteja, simu, au bidhaa aliyokopa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-300 rounded-2xl text-blue-950 font-bold placeholder-slate-400 focus:outline-none focus:border-emerald-600 shadow-xs text-sm"
          />
        </div>

        {/* DATE FILTERS */}
        {activeTab === 'debts' && (
          <div className="flex items-center gap-1.5 bg-white p-1.5 border-2 border-slate-200 rounded-2xl overflow-x-auto w-full md:w-auto shadow-xs">
            <span className="text-[10px] font-black uppercase text-slate-400 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-emerald-600" /> Kipindi:
            </span>
            {[
              { id: 'all', label: 'Yote' },
              { id: 'today', label: 'Leo' },
              { id: 'yesterday', label: 'Jana' },
              { id: 'juzi', label: 'Juzi' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => { setDateFilter(f.id); setCustomDate(''); }}
                className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition ${
                  dateFilter === f.id ? 'bg-blue-900 text-white shadow-md' : 'text-slate-600 hover:text-blue-950 bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}

            <div className="relative flex items-center">
              <input
                type="date"
                value={customDate}
                onChange={(e) => { setCustomDate(e.target.value); setDateFilter('custom'); }}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-blue-950 text-xs font-bold font-mono focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 bg-white p-1.5 border-2 border-slate-200 rounded-2xl w-full md:w-auto shadow-xs">
          <button
            onClick={() => setActiveTab('debts')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-sm transition ${
              activeTab === 'debts' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-600 hover:text-blue-950'
            }`}
          >
            Orodha ya Madeni
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 md:flex-none px-5 py-2.5 rounded-xl font-black text-sm transition ${
              activeTab === 'customers' ? 'bg-blue-900 text-white shadow-md' : 'text-slate-600 hover:text-blue-950'
            }`}
          >
            Orodha ya Wateja
          </button>
        </div>
      </div>

      {/* DEBTS TABLE WITH ITEMS BORROWED */}
      {activeTab === 'debts' && (
        <div className="bg-white border-2 border-emerald-500/40 rounded-3xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500 gap-2 font-medium">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span>Inapakia madeni...</span>
            </div>
          ) : filteredDebts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-extrabold">
              Hakuna kumbukumbu za madeni zilizopatikana kwa kipindi hiki.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-black">
                    <th className="py-4 px-6">Mteja & Simu</th>
                    <th className="py-4 px-6">Bidhaa Alizokopa</th>
                    <th className="py-4 px-6">Tarehe</th>
                    <th className="py-4 px-6">Deni Lote</th>
                    <th className="py-4 px-6">Salio Linalobaki</th>
                    <th className="py-4 px-6">Hali (Status)</th>
                    <th className="py-4 px-6 text-right">Vitendo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredDebts.map((d) => {
                    const itemsList = d.items || d.sale_items || [];

                    return (
                      <tr key={d.id} className="hover:bg-slate-50 transition">
                        <td className="py-4 px-6 font-black text-blue-950">
                          <div>{d.customer_name}</div>
                          {d.customer_phone && (
                            <div className="text-xs text-slate-500 font-bold flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-emerald-600" /> {d.customer_phone}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-6 max-w-xs">
                          {itemsList.length > 0 ? (
                            <div className="space-y-1">
                              {itemsList.map((item, idx) => (
                                <div key={idx} className="text-xs font-bold text-slate-700 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                                  <ShoppingBag className="w-3 h-3 text-emerald-600 shrink-0" />
                                  <span className="truncate">{item.product_name || item.name || 'Bidhaa'}:</span>
                                  <span className="text-blue-950 font-black font-mono">{item.quantity} {item.unit || 'pcs'}</span>
                                </div>
                              ))}
                            </div>
                          ) : d.items_summary ? (
                            <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-block">
                              📦 {d.items_summary}
                            </span>
                          ) : (
                            <span className="text-xs font-slate-400 italic bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                              ⚠️ Deni la Jumla (Bila Mchanganuo)
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-slate-500 font-mono text-xs font-bold whitespace-nowrap">
                          {d.created_at ? new Date(d.created_at).toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="py-4 px-6 text-slate-600 font-mono font-bold whitespace-nowrap">
                          {Number(d.total_amount).toLocaleString()} TZS
                        </td>

                        <td className="py-4 px-6 text-amber-600 font-black font-mono whitespace-nowrap">
                          {Number(d.remaining_amount).toLocaleString()} TZS
                        </td>

                        <td className="py-4 px-6 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                            d.status === 'PAID' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                              : d.status === 'PARTIAL'
                              ? 'bg-amber-50 text-amber-700 border border-amber-300'
                              : 'bg-red-50 text-red-700 border border-red-300'
                          }`}>
                            {d.status === 'PAID' && <CheckCircle className="w-3.5 h-3.5" />}
                            {d.status === 'PARTIAL' && <Clock className="w-3.5 h-3.5" />}
                            {d.status === 'PENDING' && <AlertCircle className="w-3.5 h-3.5" />}
                            {d.status === 'PAID' ? 'Imelipwa Yote' : d.status === 'PARTIAL' ? 'Imelipwa Nusu' : 'Haijalipwa'}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {d.status !== 'PAID' && (
                              <button
                                onClick={() => { setSelectedDebt(d); setShowPayModal(true); }}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs transition shadow-2xs"
                              >
                                Sajili Malipo
                              </button>
                            )}

                            <button
                              onClick={() => { setDebtToDelete(d); setShowDeleteModal(true); }}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition"
                              title="Futa Deni"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CUSTOMERS TABLE */}
      {activeTab === 'customers' && (
        <div className="bg-white border-2 border-emerald-500/40 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-black">
                  <th className="py-4 px-6">Jina la Mteja</th>
                  <th className="py-4 px-6">Namba ya Simu</th>
                  <th className="py-4 px-6">Jumla Anayodaiwa</th>
                  <th className="py-4 px-6">Tarehe ya Kusajiliwa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-black text-blue-950">{c.name}</td>
                    <td className="py-4 px-6 text-slate-500 font-mono font-semibold">{c.phone || 'N/A'}</td>
                    <td className="py-4 px-6 text-amber-600 font-black font-mono">{Number(c.total_debt || 0).toLocaleString()} TZS</td>
                    <td className="py-4 px-6 text-slate-500 font-bold text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: PAY DEBT MODAL */}
      {showPayModal && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-blue-950">Sajili Malipo ya Deni</h3>
              <button onClick={() => setShowPayModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-bold">Mteja:</span>
                <span className="text-blue-950 font-black">{selectedDebt.customer_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-bold">Salio Linalobaki:</span>
                <span className="text-amber-600 font-black font-mono">{Number(selectedDebt.remaining_amount).toLocaleString()} TZS</span>
              </div>
            </div>
            <form onSubmit={handlePayDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Kiasi Anacholipa Sasa (TZS)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="10000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-mono font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Maelezo</label>
                <input
                  type="text"
                  placeholder="Mfano: Kalipa kwa M-Pesa"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                <span>Hifadhi Malipo</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD CUSTOMER */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-blue-950">Sajili Mteja Mpya</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Jina la Mteja</label>
                <input
                  type="text"
                  required
                  placeholder="Mama Maria"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Namba ya Simu</label>
                <input
                  type="text"
                  placeholder="0712345678"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                <span>Hifadhi Mteja</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD DEBT (YENYE SEHEMU YA KUWEKA AINA YA BIDHAA ZILIZOKOPWA) */}
      {showAddDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 w-full max-w-md space-y-5 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-blue-950">Rekodi Deni Jipya</h3>
              <button onClick={() => setShowAddDebtModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Chagua Mteja</label>
                <select
                  required
                  value={debtData.customer}
                  onChange={(e) => setDebtData({ ...debtData, customer: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600"
                >
                  <option value="">-- Chagua Mteja --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone || 'Bila Simu'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Jumla ya Deni (TZS)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="50000"
                  value={debtData.total_amount}
                  onChange={(e) => setDebtData({ ...debtData, total_amount: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-mono font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* SEHEMU MPYA YA KUIWEKEA BIDHAA / MAELEZO YA VITY VILIVYOKOPWA */}
              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Bidhaa Alizokopa (Maelezo)</label>
                <input
                  type="text"
                  placeholder="Mfano: Sukari kilo 2, Mchele kilo 5"
                  value={debtData.items_summary}
                  onChange={(e) => setDebtData({ ...debtData, items_summary: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Tarehe ya Kurudisha (Hiari)</label>
                <input
                  type="date"
                  value={debtData.due_date}
                  onChange={(e) => setDebtData({ ...debtData, due_date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                <span>Rekodi Deni</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE DEBT CONFIRMATION */}
      {showDeleteModal && debtToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-red-500/40 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-black text-base">
                <Trash2 className="w-5 h-5" />
                <span>Thibitisha Kufuta Deni</span>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600 text-xs font-medium leading-relaxed">
              Je, una uhakika unataka kufuta kabisa kumbukumbu ya deni la <strong className="text-blue-950 font-black">{debtToDelete.customer_name}</strong> lenye thamani ya <strong className="text-amber-600 font-black">{Number(debtToDelete.total_amount).toLocaleString()} TZS</strong>?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition text-xs"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleDeleteDebt}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-2"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Ndio, Futa Deni</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}