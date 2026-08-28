import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  X, 
  ShieldAlert, 
  Lock, 
  UserCheck,
  UserX,
  Phone,
  Mail,
  AlertTriangle
} from 'lucide-react';

export default function Users() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [cashiers, setCashiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State ya Cashier Mpya
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: ''
  });

  // Modal ya Kufuta Mfanyakazi
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    id: null,
    username: ''
  });

  useEffect(() => {
    if (isOwner) {
      fetchCashiers();
    }
  }, [isOwner]);

  const triggerNotification = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchCashiers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('auth/cashiers/');
      setCashiers(res.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching cashiers:", err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateCashier = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await apiClient.post('auth/cashiers/', formData);
      triggerNotification(res.data?.message || `Mfanyakazi "${formData.username}" amesajiliwa kikamilifu!`);
      setShowModal(false);
      setFormData({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: ''
      });
      fetchCashiers();
    } catch (err) {
      const errRes = err.response?.data;
      let errMsg = "Imeshindikana kusajili mfanyakazi!";
      if (errRes) {
        if (typeof errRes === 'object') {
          const firstKey = Object.keys(errRes)[0];
          const val = errRes[firstKey];
          errMsg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : val;
        } else if (errRes.error) {
          errMsg = errRes.error;
        }
      }
      triggerNotification(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCashier = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.delete(`auth/cashiers/${deleteModal.id}/`);
      triggerNotification(`Mfanyakazi "${deleteModal.username}" amefutwa kikamilifu!`);
      setDeleteModal({ show: false, id: null, username: '' });
      fetchCashiers();
    } catch (err) {
      triggerNotification("Imeshindikana kufuta mfanyakazi!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // KAMA SIO BOSI, ZUIA UKURASA MZIMA
  if (!isOwner) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Hukuruhusiwa Kuingia Hapa</h3>
          <p className="text-sm text-slate-400">
            Ukurasa wa Usimamizi wa Wafanyakazi unapatikana kwa akaunti ya Bosi (Owner) pekee.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-500 text-slate-950 font-bold px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UsersIcon className="w-7 h-7 text-emerald-400" />
            <span>Usimamizi wa Wafanyakazi (Cashiers)</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Sajili akaunti za Cashier wa duka lako ili waweze kulogin kufanya mauzo.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition self-start sm:self-auto"
        >
          <UserPlus className="w-5 h-5" />
          <span>Sajili Mfanyakazi Mpya</span>
        </button>
      </div>

      {/* CASHIERS TABLE */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Inapakia orodha ya wafanyakazi...</span>
          </div>
        ) : cashiers.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <UserX className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-slate-400 font-medium">Bado hujasajili Mfanyakazi (Cashier) yeyote.</p>
            <p className="text-xs text-slate-500">Bonyeza button ya "Sajili Mfanyakazi Mpya" hapo juu kuongeza.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Mfanyakazi</th>
                  <th className="py-4 px-6">Username</th>
                  <th className="py-4 px-6">Mawasiliano</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Tarehe ya Kusajiliwa</th>
                  <th className="py-4 px-6 text-right">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {cashiers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-4 px-6 font-semibold text-white flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                        {c.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div>{c.first_name ? `${c.first_name} ${c.last_name || ''}` : c.username}</div>
                        <div className="text-xs text-slate-500 font-normal">{c.email || 'Bila Email'}</div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-emerald-400 font-mono font-bold">@{c.username}</td>

                    <td className="py-4 px-6 text-slate-400 font-mono text-xs">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{c.phone || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        <UserCheck className="w-3.5 h-3.5" />
                        Cashier
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-400 text-xs font-mono">
                      {new Date(c.date_joined).toLocaleDateString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setDeleteModal({ show: true, id: c.id, username: c.username })}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                        title="Futa Mfanyakazi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: FOR REGISTERING NEW CASHIER */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <span>Sajili Mfanyakazi Mpya (Cashier)</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCashier} className="space-y-4">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Username ya Kuingilia *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Mfano: hassan_pos"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Jina la Kwanza</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Hassan"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Jina la Pili</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Ali"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Namba ya Simu</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0712345678"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Email (Hiari)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="hassan@gmail.com"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Password ya Kuingilia * (Angalau Herufi 8, Namba, Herufi Kubwa)
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mfano: Cashier@2026"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition mt-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                <span>Sajili Mfanyakazi</span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM DELETE CASHIER */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Kufuta Mfanyakazi</span>
              </div>
              <button onClick={() => setDeleteModal({ show: false, id: null, username: '' })} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-slate-300">
              Je, una uhakika unataka kufuta akaunti ya Mfanyakazi <span className="font-extrabold text-white">"@{deleteModal.username}"</span>?
              <p className="text-xs text-amber-400 mt-2">
                * Mfanyakazi huyu hataweza tena kulogin kwenye POS ya duka hili.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ show: false, id: null, username: '' })}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition text-sm"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleDeleteCashier}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-slate-950 font-extrabold rounded-xl transition flex items-center justify-center gap-2 text-sm"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Thibitisha Kufuta</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}