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
  Trash2
} from 'lucide-react';

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('debts');

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
  const [debtData, setDebtData] = useState({ customer: '', total_amount: '', due_date: '' });

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
      };

      if (debtData.due_date && debtData.due_date.trim() !== '') {
        payload.due_date = debtData.due_date;
      }

      await apiClient.post('sales/debts/', payload);
      triggerToast("Deni jipya limesajiliwa vizuri! 📝", "success");
      setShowAddDebtModal(false);
      setDebtData({ customer: '', total_amount: '', due_date: '' });
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

  // LOGIC YA KUFUTA DENI
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

  const filteredDebts = debts.filter(d => 
    d.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    (d.customer_phone && d.customer_phone.includes(search))
  );

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 space-y-6 relative">
      
      {/* FLOATING TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-4 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-md transition-all animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50' 
            : 'bg-red-950/95 border-red-500/50 text-red-300 shadow-red-950/50'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-emerald-400" />
            <span>Daftari la Madeni & Wateja</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Simamia madeni ya wateja, fanya ufuatiliaji, na rekodi au futa madeni.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl border border-slate-700 flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" />
            <span>Mteja Mpya</span>
          </button>

          <button
            onClick={() => setShowAddDebtModal(true)}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Sajili Deni Jipya</span>
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Jumla ya Madeni Nje</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-1">
              {totalDebtAmount.toLocaleString()} <span className="text-xs text-slate-400">TZS</span>
            </p>
          </div>
          <div className="p-3 bg-slate-800 border border-slate-700 rounded-2xl text-amber-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Wateja Wanaodaiwa</p>
            <p className="text-2xl font-extrabold text-white mt-1">{activeDebtorsCount} <span className="text-xs text-slate-400">Wateja</span></p>
          </div>
          <div className="p-3 bg-slate-800 border border-slate-700 rounded-2xl text-blue-400">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Madeni Yaliyokamilika</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-1">
              {debts.filter(d => d.status === 'PAID').length} <span className="text-xs text-slate-400">Yalolipwa</span>
            </p>
          </div>
          <div className="p-3 bg-slate-800 border border-slate-700 rounded-2xl text-emerald-400">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* SEARCH AND TABS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tafuta mteja au namba ya simu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('debts')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'debts' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Orodha ya Madeni
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-bold text-sm transition ${
              activeTab === 'customers' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Orodha ya Wateja
          </button>
        </div>
      </div>

      {/* DEBTS TABLE */}
      {activeTab === 'debts' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Inapakia madeni...</span>
            </div>
          ) : filteredDebts.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-medium">
              Hakuna kumbukumbu za madeni zilizopatikana.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                    <th className="py-4 px-6">Mteja</th>
                    <th className="py-4 px-6">Deni Lote</th>
                    <th className="py-4 px-6">Kilicholipwa</th>
                    <th className="py-4 px-6">Salio Linalobaki</th>
                    <th className="py-4 px-6">Hali (Status)</th>
                    <th className="py-4 px-6 text-right">Vitendo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filteredDebts.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800 transition">
                      <td className="py-4 px-6 font-semibold text-white">
                        <div>{d.customer_name}</div>
                        {d.customer_phone && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" /> {d.customer_phone}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-slate-300 font-mono">{Number(d.total_amount).toLocaleString()} TZS</td>
                      <td className="py-4 px-6 text-emerald-400 font-mono">{Number(d.paid_amount || d.amount_paid || 0).toLocaleString()} TZS</td>
                      <td className="py-4 px-6 text-amber-400 font-bold font-mono">{Number(d.remaining_amount).toLocaleString()} TZS</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                          d.status === 'PAID' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : d.status === 'PARTIAL'
                            ? 'bg-amber-950 text-amber-400 border border-amber-800'
                            : 'bg-red-950 text-red-400 border border-red-800'
                        }`}>
                          {d.status === 'PAID' && <CheckCircle className="w-3.5 h-3.5" />}
                          {d.status === 'PARTIAL' && <Clock className="w-3.5 h-3.5" />}
                          {d.status === 'PENDING' && <AlertCircle className="w-3.5 h-3.5" />}
                          {d.status === 'PAID' ? 'Imelipwa Yote' : d.status === 'PARTIAL' ? 'Imelipwa Nusu' : 'Haijalipwa'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {d.status !== 'PAID' && (
                            <button
                              onClick={() => { setSelectedDebt(d); setShowPayModal(true); }}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl font-semibold text-xs transition"
                            >
                              Sajili Malipo
                            </button>
                          )}

                          {/* KITUFE CHA KUFUTA DENI */}
                          <button
                            onClick={() => { setDebtToDelete(d); setShowDeleteModal(true); }}
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition"
                            title="Futa Deni"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CUSTOMERS TABLE */}
      {activeTab === 'customers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Jina la Mteja</th>
                  <th className="py-4 px-6">Namba ya Simu</th>
                  <th className="py-4 px-6">Jumla Anayodaiwa</th>
                  <th className="py-4 px-6">Tarehe ya Kusajiliwa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800 transition">
                    <td className="py-4 px-6 font-semibold text-white">{c.name}</td>
                    <td className="py-4 px-6 text-slate-400 font-mono">{c.phone || 'N/A'}</td>
                    <td className="py-4 px-6 text-amber-400 font-bold font-mono">{Number(c.total_debt || 0).toLocaleString()} TZS</td>
                    <td className="py-4 px-6 text-slate-400 text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: PAY DEBT MODAL */}
      {showPayModal && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Sajili Malipo ya Deni</h3>
              <button onClick={() => setShowPayModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Mteja:</span>
                <span className="text-white font-semibold">{selectedDebt.customer_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Salio Linalobaki:</span>
                <span className="text-amber-400 font-bold font-mono">{Number(selectedDebt.remaining_amount).toLocaleString()} TZS</span>
              </div>
            </div>
            <form onSubmit={handlePayDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Kiasi Anacholipa Sasa (TZS)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="10000"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Maelezo</label>
                <input
                  type="text"
                  placeholder="Mfano: Kalipa kwa M-Pesa"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Sajili Mteja Mpya</h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Jina la Mteja</label>
                <input
                  type="text"
                  required
                  placeholder="Mama Maria"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Namba ya Simu</label>
                <input
                  type="text"
                  placeholder="0712345678"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                <span>Hifadhi Mteja</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: RECORD DEBT */}
      {showAddDebtModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Rekodi Deni Jipya</h3>
              <button onClick={() => setShowAddDebtModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddDebt} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Chagua Mteja</label>
                <select
                  required
                  value={debtData.customer}
                  onChange={(e) => setDebtData({ ...debtData, customer: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Chagua Mteja --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone || 'Bila Simu'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Jumla ya Deni (TZS)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="50000"
                  value={debtData.total_amount}
                  onChange={(e) => setDebtData({ ...debtData, total_amount: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Tarehe ya Kurudisha (Hiyari)</label>
                <input
                  type="date"
                  value={debtData.due_date}
                  onChange={(e) => setDebtData({ ...debtData, due_date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                <Trash2 className="w-5 h-5" />
                <span>Thibitisha Kufuta Deni</span>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed">
              Je, una uhakika unataka kufuta kabisa kumbukumbu ya deni la <strong className="text-white">{debtToDelete.customer_name}</strong> lenye thamani ya <strong className="text-amber-400">{Number(debtToDelete.total_amount).toLocaleString()} TZS</strong>?
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition text-xs"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleDeleteDebt}
                disabled={isDeleting}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-slate-950 font-extrabold rounded-xl transition text-xs flex items-center justify-center gap-2"
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