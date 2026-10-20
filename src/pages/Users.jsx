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
  UserCheck,
  UserX,
  Phone,
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

  // Form Error State (Kucheza ndani ya Modal badala ya background toast)
  const [formError, setFormError] = useState(null);

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
    if (formError) setFormError(null); // Futa error ikianza kuandikwa
  };

  const handleOpenModal = () => {
    setFormError(null);
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: ''
    });
    setShowModal(true);
  };

  const handleCreateCashier = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

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
        if (typeof errRes === 'string') {
          errMsg = errRes;
        } else if (errRes.detail) {
          errMsg = errRes.detail;
        } else if (errRes.error) {
          errMsg = errRes.error;
        } else if (typeof errRes === 'object') {
          const firstKey = Object.keys(errRes)[0];
          const val = errRes[firstKey];
          errMsg = Array.isArray(val) ? `${firstKey}: ${val[0]}` : `${firstKey}: ${val}`;
        }
      }
      
      // Weka error ndani ya Form/Modal badala ya Toast Notification
      setFormError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // KUHANDLE KUFUTA MFANYAKAZI
  const handleDeleteCashier = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiClient.delete(`auth/cashiers/${deleteModal.id}/`);
      triggerNotification(res.data?.message || `Mfanyakazi "${deleteModal.username}" amefutwa kikamilifu!`);
      setDeleteModal({ show: false, id: null, username: '' });
      fetchCashiers();
    } catch (err) {
      const errMsg = err.response?.data?.error || "Imeshindikana kufuta mfanyakazi!";
      triggerNotification(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // KAMA SIO BOSI, ZUIA UKURASA MZIMA
  if (!isOwner) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white border-2 border-red-500/40 rounded-3xl p-8 max-w-md text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-blue-950">Hukuruhusiwa Kuingia Hapa</h3>
          <p className="text-sm font-semibold text-slate-500">
            Ukurasa wa Usimamizi wa Wafanyakazi unapatikana kwa akaunti ya Bosi (Owner) pekee.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative font-sans text-slate-800 pb-12">

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white font-black px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-500 animate-bounce text-sm">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 p-6 rounded-3xl text-white shadow-xl border-2 border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="z-10 relative">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <UsersIcon className="w-7 h-7 text-emerald-400" />
            <span>Usimamizi wa Wafanyakazi (Cashiers)</span>
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Sajili akaunti za Cashier wa duka lako ili waweze kulogin kufanya mauzo.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition self-start sm:self-auto z-10"
        >
          <UserPlus className="w-5 h-5" />
          <span>Sajili Mfanyakazi Mpya</span>
        </button>
      </div>

      {/* CASHIERS TABLE */}
      <div className="bg-white border-2 border-emerald-500/40 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 gap-2 font-medium">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Inapakia orodha ya wafanyakazi...</span>
          </div>
        ) : cashiers.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <UserX className="w-12 h-12 text-slate-400 mx-auto" />
            <p className="text-slate-600 font-bold">Bado hujasajili Mfanyakazi (Cashier) yeyote.</p>
            <p className="text-xs text-slate-400 font-semibold">Bonyeza button ya "Sajili Mfanyakazi Mpya" hapo juu kuongeza.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-black">
                  <th className="py-4 px-6">Mfanyakazi</th>
                  <th className="py-4 px-6">Username</th>
                  <th className="py-4 px-6">Mawasiliano</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Tarehe ya Kusajiliwa</th>
                  <th className="py-4 px-6 text-right">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {cashiers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-extrabold text-blue-950 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-center font-black">
                        {c.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div>{c.first_name ? `${c.first_name} ${c.last_name || ''}` : c.username}</div>
                        <div className="text-xs text-slate-400 font-semibold">{c.email || 'Bila Email'}</div>
                      </div>
                    </td>

                    <td className="py-4 px-6 text-emerald-700 font-mono font-black">@{c.username}</td>

                    <td className="py-4 px-6 text-slate-600 font-mono text-xs font-bold">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{c.phone || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-blue-50 text-blue-900 border border-blue-200 uppercase">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Cashier
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-500 text-xs font-mono font-bold">
                      {new Date(c.date_joined).toLocaleDateString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setDeleteModal({ show: true, id: c.id, username: c.username })}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-blue-950 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <span>Sajili Mfanyakazi Mpya (Cashier)</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* FORM ERROR INLINE NOTIFICATION */}
            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-xs font-black animate-fadeIn">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCashier} className="space-y-4">
              
              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">
                  Username ya Kuingilia *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Mfano: hassan_pos"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-mono font-bold focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Jina la Kwanza</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Hassan"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Jina la Pili</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Ali"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Namba ya Simu</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0712345678"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Email (Hiari)</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="hassan@gmail.com"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">
                  Password ya Kuingilia * (Angalau Herufi 8, Namba, Herufi Kubwa)
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Mfano: Cashier@2026"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-mono font-bold focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition mt-2 text-sm"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-2 border-red-500/40 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-black text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>Kufuta Mfanyakazi</span>
              </div>
              <button onClick={() => setDeleteModal({ show: false, id: null, username: '' })} className="p-1 rounded-xl text-slate-400 hover:text-slate-600 bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 font-medium leading-relaxed">
              Je, una uhakika unataka kufuta akaunti ya Mfanyakazi <strong className="font-black text-blue-950">"@{deleteModal.username}"</strong>?
              <p className="text-xs font-extrabold text-amber-600 mt-2">
                - Mfanyakazi huyu hataweza tena kulogin kwenye POS ya duka hili.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal({ show: false, id: null, username: '' })}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition text-xs"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleDeleteCashier}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition flex items-center justify-center gap-2 text-xs shadow-md shadow-red-600/20"
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