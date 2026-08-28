import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  Edit3, 
  Trash2, 
  X, 
  Loader2, 
  Check,
  Scan,
  CheckCircle2,
  Layers,
  Filter,
  Tag,
  Wallet,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export default function Inventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // State ya Permissions
  const [permissions, setPermissions] = useState({
    show_profit_to_cashier: false,
    allow_cashier_debts: true,
    allow_cashier_custom_price: true,
    show_buying_price_to_cashier: false
  });
  
  // State ya Thamani ya Stoko (Summary Metrics)
  const [summaryData, setSummaryData] = useState({
    total_current_cost: 0,
    total_potential_retail: 0,
    expected_stock_profit: 0,
    total_products_count: 0
  });

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    show: false,
    type: '', 
    id: null,
    title: '',
    name: ''
  });
  
  // Category Filter State
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState(null);

  // References kwa ajili ya Barcode Hardware Scanner
  const barcodeInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Form State ya Bidhaa
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    category: '',
    buying_price: '',
    selling_price: '',
    quantity: '',
    unit: 'pcs',
    min_stock_alert: '5.00'
  });

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const triggerNotification = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [showModal]);

  const fetchInventoryData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, sumRes, permRes] = await Promise.all([
        apiClient.get('inventory/products/?page_size=10000'),
        apiClient.get('inventory/categories/'),
        apiClient.get('inventory/products/summary/'),
        apiClient.get('auth/business-permissions/')
      ]);
      
      const prodData = prodRes.data.results || prodRes.data || [];
      const catData = catRes.data.results || catRes.data || [];
      
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
      setPermissions(permRes.data);
      if (sumRes.data) {
        setSummaryData(sumRes.data);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching inventory data:", err);
      setLoading(false);
    }
  };

  // Kagua Haki za Mtumiaji (Owner vs Cashier)
  const isOwner = user?.role === 'owner';
  const canSeeBuyingPrice = isOwner || permissions.show_buying_price_to_cashier;
  const canSeeSummaryCards = isOwner || (permissions.show_profit_to_cashier && permissions.show_buying_price_to_cashier);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      nameInputRef.current?.focus();
    }
  };

  const openAddModal = () => {
    setEditId(null);
    setFormData({
      name: '',
      barcode: '',
      category: '',
      buying_price: '',
      selling_price: '',
      quantity: '',
      unit: 'pcs',
      min_stock_alert: '5.00'
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditId(product.id);
    setFormData({
      name: product.name,
      barcode: product.barcode || '',
      category: product.category || '',
      buying_price: product.buying_price,
      selling_price: product.selling_price,
      quantity: product.quantity,
      unit: product.unit || 'pcs',
      min_stock_alert: product.min_stock_alert || '5.00'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      category: formData.category || null
    };

    try {
      if (editId) {
        await apiClient.put(`inventory/products/${editId}/`, payload);
        triggerNotification(`Taarifa za "${formData.name}" zimebadilishwa kikamilifu!`);
      } else {
        await apiClient.post('inventory/products/', payload);
        triggerNotification(`Bidhaa ya "${formData.name}" imeongezwa kwenye stoko!`);
      }
      setIsSubmitting(false);
      setShowModal(false);
      fetchInventoryData();
    } catch (err) {
      triggerNotification(err.response?.data?.message || err.response?.data?.detail || "Imeshindikana kuhifadhi bidhaa!");
      setIsSubmitting(false);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.post('inventory/categories/', { name: newCategoryName.trim() });
      triggerNotification(`Kundi la "${newCategoryName}" limesajiliwa!`);
      setNewCategoryName('');
      fetchInventoryData();
    } catch (err) {
      triggerNotification(err.response?.data?.detail || err.response?.data?.name?.[0] || "Imeshindikana kusajili kundi!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const promptDeleteProduct = (id, name) => {
    setConfirmModal({
      show: true,
      type: 'product',
      id,
      title: 'Kufuta Bidhaa',
      name
    });
  };

  const promptDeleteCategory = (id, name) => {
    setConfirmModal({
      show: true,
      type: 'category',
      id,
      title: 'Kufuta Kundi la Bidhaa',
      name
    });
  };

  const handleExecuteDelete = async () => {
    const { type, id, name } = confirmModal;
    setIsSubmitting(true);

    try {
      if (type === 'product') {
        await apiClient.delete(`inventory/products/${id}/`);
        triggerNotification(`Bidhaa ya "${name}" imefutwa!`);
      } else if (type === 'category') {
        await apiClient.delete(`inventory/categories/${id}/`);
        triggerNotification(`Kundi la "${name}" limefutwa!`);
      }
      setConfirmModal({ show: false, type: '', id: null, title: '', name: '' });
      fetchInventoryData();
    } catch (err) {
      triggerNotification("Imeshindikana kufuta!");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          (p.barcode && p.barcode.includes(search));
    
    if (selectedCategoryFilter === 'ALL') return matchesSearch;
    if (selectedCategoryFilter === 'UNCATEGORIZED') return matchesSearch && !p.category;
    return matchesSearch && p.category === selectedCategoryFilter;
  });

  return (
    <div className="space-y-6 relative">
      
      {/* POP-UP TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-emerald-500 text-slate-950 font-bold px-5 py-3.5 rounded-2xl shadow-2xl border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-emerald-400" />
            <span>Usimamizi wa Stoko & Bidhaa</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Sajili bidhaa mpya, husianisha na makundi, na badilisha taarifa za bei na stoko.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {isOwner && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold rounded-2xl border border-purple-500/30 flex items-center gap-2 transition"
            >
              <Layers className="w-5 h-5 text-purple-400" />
              <span>Manage Makundi ({categories.length})</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Ongeza Bidhaa Mpya</span>
          </button>
        </div>
      </div>

      {/* INVENTORY VALUE SUMMARY CARDS (ONESHWA KWA BOSI PEKEE AU CASHIER WENYE RUHUSA) */}
      {canSeeSummaryCards && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thamani ya Stoko (Gharama)</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-white font-mono">
              {Number(summaryData.total_current_cost || 0).toLocaleString()} TZS
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Gharama za kununulia bidhaa zilizopo dukani hivi sasa</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thamani Tarajiwa ya Mauzo</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-white font-mono">
              {Number(summaryData.total_potential_retail || 0).toLocaleString()} TZS
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Jumla ya fedha zitakazopatikana stoko yote ikiuzwa</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Faida Iliyopo Kwenye Stoko</span>
              <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-purple-400 font-mono">
              {Number(summaryData.expected_stock_profit || 0).toLocaleString()} TZS
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">Kadirio la faida itakayopatikana baada ya stoko kuisha</p>
          </div>
        </div>
      )}

      {/* Search Bar & Category Filter Buttons */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-3xl space-y-4">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tafuta bidhaa kwa jina au Barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
          <span className="text-xs text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 pr-2 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-emerald-400" /> Kundi:
          </span>

          <button
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Bidhaa Zote ({products.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategoryFilter === cat.id
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.name} ({cat.products_count ?? 0})
            </button>
          ))}

          <button
            onClick={() => setSelectedCategoryFilter('UNCATEGORIZED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategoryFilter === 'UNCATEGORIZED'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-950 text-slate-500 hover:text-slate-300 border border-slate-800'
            }`}
          >
            Bila Kundi
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Inapakia orodha ya bidhaa...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            Hakuna bidhaa iliyopatikana kwenye kundi hili.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Bidhaa</th>
                  <th className="py-4 px-6">Kundi (Category)</th>
                  <th className="py-4 px-6">Barcode</th>
                  {canSeeBuyingPrice && <th className="py-4 px-6">Bei ya Kununua</th>}
                  <th className="py-4 px-6">Bei ya Kuuzia</th>
                  <th className="py-4 px-6">Stoko Iliyopo</th>
                  <th className="py-4 px-6 text-right">Vitendo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredProducts.map((p) => {
                  const isLowStock = Number(p.quantity) <= Number(p.min_stock_alert || 5);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-6 font-semibold text-white">{p.name}</td>
                      
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                          <Tag className="w-3 h-3 text-purple-400" />
                          {p.category_name || 'Bila Kundi'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-400 font-mono">{p.barcode || 'N/A'}</td>
                      {canSeeBuyingPrice && (
                        <td className="py-4 px-6 text-slate-300">{Number(p.buying_price || 0).toLocaleString()} TZS</td>
                      )}
                      <td className="py-4 px-6 text-emerald-400 font-bold">{Number(p.selling_price || 0).toLocaleString()} TZS</td>
                      
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          isLowStock 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                          {p.quantity} {p.unit}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition"
                          title="Badilisha (Edit)"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => promptDeleteProduct(p.id, p.name)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                            title="Futa (Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* MODAL 1: FOR ADD / EDIT PRODUCT */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editId ? 'Badilisha Taarifa za Bidhaa' : 'Sajili Bidhaa Mpya'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="flex text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 items-center gap-2">
                  <Scan className="w-4 h-4 text-emerald-400" />
                  <span>Barcode (Scan au Andika)</span>
                </label>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleInputChange}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Elekeza Scanner au andika kodi..."
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Jina la Bidhaa *</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Mfano: Azam Juice 1L"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Kundi la Bidhaa (Category)</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Bila Kundi --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={`grid ${canSeeBuyingPrice ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {canSeeBuyingPrice && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Bei ya Kununua (TZS)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="buying_price"
                      required
                      value={formData.buying_price}
                      onChange={handleInputChange}
                      placeholder="2000"
                      className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Bei ya Kuuzia (TZS)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="selling_price"
                    required
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    placeholder="2500"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Stoko (Idadi)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="quantity"
                    required
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="50"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Kipimo (Unit)</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="plate">plate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Min Alert</label>
                  <input
                    type="number"
                    step="0.01"
                    name="min_stock_alert"
                    value={formData.min_stock_alert}
                    onChange={handleInputChange}
                    placeholder="5"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                <span>{editId ? 'Hifadhi Mabadiliko' : 'Ongeza Kwenye Stoko'}</span>
              </button>
            </form>

          </div>
        </div>
      )}

      {/* MODAL 2: MANAGE CATEGORIES */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                <span>Simamia Makundi ya Bidhaa</span>
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Mfano: Vinywaji, Sigara, Mikate..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition flex items-center gap-1"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Sajili</span>
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Makundi Yaliyopo ({categories.length})</h4>
              {categories.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Bado hujasajili kundi lolote.</p>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-bold text-white">{cat.name}</span>
                      <span className="text-[10px] bg-slate-900 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/20">
                        {cat.products_count ?? 0} Bidhaa
                      </span>
                    </div>
                    {isOwner && (
                      <button
                        onClick={() => promptDeleteCategory(cat.id, cat.name)}
                        className="text-slate-500 hover:text-red-400 p-1 transition"
                        title="Futa Kundi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-400 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                <span>{confirmModal.title}</span>
              </div>
              <button 
                onClick={() => setConfirmModal({ show: false, type: '', id: null, title: '', name: '' })} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-slate-300">
              Je, una uhakika unataka kufuta {confirmModal.type === 'product' ? 'bidhaa ya' : 'kundi la'} <span className="font-extrabold text-white">"{confirmModal.name}"</span>?
              {confirmModal.type === 'category' && (
                <p className="text-xs text-amber-400 mt-2">
                  * Bidhaa zote zilizokuwa kwenye kundi hili zitawekwa "Bila Kundi".
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ show: false, type: '', id: null, title: '', name: '' })}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition text-sm"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
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