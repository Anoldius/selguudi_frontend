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
  DollarSign,
  ShieldAlert
} from 'lucide-react';

export default function Inventory() {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  
  // Haki ya Cashier kuongeza/kubadilisha bidhaa
  const canAddProducts = isOwner || Boolean(user?.permissions?.allow_cashier_add_products);

  // 1. INSTANT CACHE LOAD: SOMA PRODUCTS, CATEGORIES NA SUMMARY KUTOKA LOCALSTORAGE
  const [products, setProducts] = useState(() => {
    const cached = localStorage.getItem('selguudi_inv_products');
    return cached ? JSON.parse(cached) : [];
  });

  const [categories, setCategories] = useState(() => {
    const cached = localStorage.getItem('selguudi_inv_categories');
    return cached ? JSON.parse(cached) : [];
  });

  const [summaryData, setSummaryData] = useState(() => {
    const cached = localStorage.getItem('selguudi_inv_summary');
    return cached ? JSON.parse(cached) : {
      total_current_cost: 0,
      total_potential_retail: 0,
      expected_stock_profit: 0,
      total_products_count: 0
    };
  });

  // Kama tunazo products kwenye cache, ondoa loading state hapo hapo
  const [loading, setLoading] = useState(() => {
    const cachedProducts = localStorage.getItem('selguudi_inv_products');
    return !cachedProducts;
  });

  const [search, setSearch] = useState('');

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

  // Toast Notification with status type
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

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
    min_stock_alert: '5'
  });

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const triggerNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3500);
  };

  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [showModal]);

  // 2. BACKGROUND SYNC: REFRESH DATA KUTOKA SERVER KIMYA KIMYA
  const fetchInventoryData = async () => {
    try {
      const [prodRes, catRes, sumRes] = await Promise.all([
        apiClient.get('inventory/products/?page_size=10000'),
        apiClient.get('inventory/categories/'),
        apiClient.get('inventory/products/summary/').catch(() => ({ data: null }))
      ]);
      
      const prodData = prodRes.data.results || prodRes.data || [];
      const catData = catRes.data.results || catRes.data || [];
      const productList = Array.isArray(prodData) ? prodData : [];
      const categoryList = Array.isArray(catData) ? catData : [];

      setProducts(productList);
      setCategories(categoryList);

      let computedSummary = summaryData;
      if (sumRes.data && Number(sumRes.data.total_current_cost) > 0) {
        computedSummary = sumRes.data;
      } else {
        const cost = productList.reduce((acc, p) => acc + (Number(p.quantity || 0) * Number(p.buying_price || 0)), 0);
        const retail = productList.reduce((acc, p) => acc + (Number(p.quantity || 0) * Number(p.selling_price || 0)), 0);
        
        computedSummary = {
          total_current_cost: cost,
          total_potential_retail: retail,
          expected_stock_profit: retail - cost,
          total_products_count: productList.length
        };
      }

      setSummaryData(computedSummary);

      // HIFADHI KWENYE LOCALSTORAGE FOR INSTANT LOADS SIKU ZOTE
      localStorage.setItem('selguudi_inv_products', JSON.stringify(productList));
      localStorage.setItem('selguudi_inv_categories', JSON.stringify(categoryList));
      localStorage.setItem('selguudi_inv_summary', JSON.stringify(computedSummary));

    } catch (err) {
      console.error("Error background fetching inventory data:", err);
    } finally {
      setLoading(false);
    }
  };

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
    if (!canAddProducts) {
      triggerNotification("Huna mamlaka ya kuongeza au kubadilisha stoko. Wasiliana na Bosi.", "error");
      return;
    }

    setEditId(null);
    setFormData({
      name: '',
      barcode: '',
      category: '',
      buying_price: '',
      selling_price: '',
      quantity: '',
      unit: 'pcs',
      min_stock_alert: '5'
    });
    setShowModal(true);
  };

  const openEditModal = (product) => {
    if (!canAddProducts) {
      triggerNotification("Huna mamlaka ya kubadilisha stoko. Wasiliana na Bosi.", "error");
      return;
    }

    setEditId(product.id);
    setFormData({
      name: product.name || '',
      barcode: product.barcode || '',
      category: product.category || '',
      buying_price: product.buying_price !== undefined && product.buying_price !== null ? String(product.buying_price) : '',
      selling_price: product.selling_price !== undefined && product.selling_price !== null ? String(product.selling_price) : '',
      quantity: product.quantity !== undefined && product.quantity !== null ? String(Number(product.quantity)) : '',
      unit: product.unit || 'pcs',
      min_stock_alert: product.min_stock_alert !== undefined && product.min_stock_alert !== null ? String(Number(product.min_stock_alert)) : '5'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      ...formData,
      category: formData.category || null,
      buying_price: formData.buying_price !== '' && formData.buying_price !== null 
        ? parseFloat(formData.buying_price) 
        : 0.0,
      selling_price: formData.selling_price !== '' && formData.selling_price !== null 
        ? parseFloat(formData.selling_price) 
        : 0.0,
      quantity: formData.quantity !== '' && formData.quantity !== null 
        ? parseFloat(formData.quantity) 
        : 0.0,
      min_stock_alert: formData.min_stock_alert !== '' && formData.min_stock_alert !== null 
        ? parseFloat(formData.min_stock_alert) 
        : 5.0
    };

    try {
      if (editId) {
        await apiClient.put(`inventory/products/${editId}/`, payload);
        triggerNotification(`Taarifa za "${formData.name}" zimebadilishwa kikamilifu!`, "success");
        setIsSubmitting(false);
        setShowModal(false);
      } else {
        await apiClient.post('inventory/products/', payload);
        triggerNotification(`Bidhaa ya "${formData.name}" imeongezwa kwenye stoko!`, "success");
        setIsSubmitting(false);

        setFormData(prev => ({
          ...prev,
          barcode: '',
          quantity: '',
          buying_price: '',
          selling_price: '',
          name: prev.name,
          category: prev.category,
        }));

        setTimeout(() => {
          barcodeInputRef.current?.focus();
        }, 100);
      }

      fetchInventoryData();
    } catch (err) {
      setIsSubmitting(false);
      
      if (err.response?.status === 403) {
        triggerNotification("Huna mamlaka ya kubadilisha au kuongeza stoko! Wasiliana na Bosi.", "error");
        return;
      }

      const errData = err.response?.data;
      let msg = "Imeshindikana kuhifadhi bidhaa!";
      if (errData) {
        if (typeof errData === 'string') msg = errData;
        else if (errData.detail) msg = errData.detail;
        else if (errData.message) msg = errData.message;
        else {
          const firstKey = Object.keys(errData)[0];
          msg = `${firstKey}: ${errData[firstKey]}`;
        }
      }
      triggerNotification(msg, "error");
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.post('inventory/categories/', { name: newCategoryName.trim() });
      triggerNotification(`Kundi la "${newCategoryName}" limesajiliwa!`, "success");
      setNewCategoryName('');
      fetchInventoryData();
    } catch (err) {
      if (err.response?.status === 403) {
        triggerNotification("Huna mamlaka ya kusajili makundi! Wasiliana na Bosi.", "error");
      } else {
        triggerNotification(err.response?.data?.detail || "Imeshindikana kusajili kundi!", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const promptDeleteProduct = (id, name) => {
    if (!canAddProducts) {
      triggerNotification("Huna mamlaka ya kufuta bidhaa! Wasiliana na Bosi.", "error");
      return;
    }

    setConfirmModal({
      show: true,
      type: 'product',
      id,
      title: 'Kufuta Bidhaa',
      name
    });
  };

  const promptDeleteCategory = (id, name) => {
    if (!canAddProducts) {
      triggerNotification("Huna mamlaka ya kufuta makundi! Wasiliana na Bosi.", "error");
      return;
    }

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
        triggerNotification(`Bidhaa ya "${name}" imefutwa!`, "success");
      } else if (type === 'category') {
        await apiClient.delete(`inventory/categories/${id}/`);
        triggerNotification(`Kundi la "${name}" limefutwa!`, "success");
      }
      setConfirmModal({ show: false, type: '', id: null, title: '', name: '' });
      fetchInventoryData();
    } catch (err) {
      if (err.response?.status === 403) {
        triggerNotification("Huna mamlaka ya kufuta! Wasiliana na Bosi.", "error");
      } else {
        triggerNotification("Imeshindikana kufuta!", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const searchTerm = search.toLowerCase().trim();
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchTerm)) ||
      (p.category_name && p.category_name.toLowerCase().includes(searchTerm));
    
    if (selectedCategoryFilter === 'ALL') return matchesSearch;
    if (selectedCategoryFilter === 'UNCATEGORIZED') return matchesSearch && !p.category;
    return matchesSearch && p.category === selectedCategoryFilter;
  });

  return (
    <div className="space-y-6 relative font-sans text-slate-800 pb-12">
      
      {/* POP-UP TOAST NOTIFICATION */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border font-bold animate-bounce ${
          toast.type === 'error' 
            ? 'bg-red-600 text-white border-red-500' 
            : 'bg-emerald-600 text-white border-emerald-500'
        }`}>
          {toast.type === 'error' ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 p-6 rounded-3xl text-white shadow-xl border-2 border-emerald-500/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="z-10">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Package className="w-7 h-7 text-emerald-400" />
            <span>Usimamizi wa Stoko & Bidhaa</span>
          </h1>
          <p className="text-blue-200 text-sm mt-1">Sajili bidhaa mpya, husianisha na makundi, na badilisha taarifa za bei na stoko.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap z-10">
          {canAddProducts && (
            <button
              onClick={() => setShowCategoryModal(true)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-emerald-300 font-extrabold rounded-2xl border border-white/20 flex items-center gap-2 transition text-sm shadow-md"
            >
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Manage Makundi ({categories.length})</span>
            </button>
          )}

          {canAddProducts && (
            <button
              onClick={openAddModal}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition text-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Ongeza Bidhaa Mpya</span>
            </button>
          )}
        </div>
      </div>

      {/* INVENTORY VALUE SUMMARY CARDS (ZINAONEKANA KWA OWNER PEKEE) */}
      {isOwner && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Thamani ya Stoko (Gharama)</span>
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-blue-950 font-mono">
              {Number(summaryData.total_current_cost || 0).toLocaleString()} TZS
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Gharama za kununulia bidhaa zilizopo dukani hivi sasa</p>
          </div>

          <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Thamani Tarajiwa ya Mauzo</span>
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-blue-950 font-mono">
              {Number(summaryData.total_potential_retail || 0).toLocaleString()} TZS
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Jumla ya fedha zitakazopatikana stoko yote ikiuzwa</p>
          </div>

          <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Faida Iliyopo Kwenye Stoko</span>
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-black text-emerald-700 font-mono">
              {Number(summaryData.expected_stock_profit || 0).toLocaleString()} TZS
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Kadirio la faida itakayopatikana baada ya stoko kuisha</p>
          </div>
        </div>
      )}

      {/* Search Bar & Category Filter Buttons */}
      <div className="bg-white border-2 border-emerald-500/40 p-4 rounded-3xl space-y-4 shadow-xs">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tafuta kwa jina la bidhaa, barcode, au kundi (category)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 text-sm font-semibold"
          />
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
          <span className="text-xs text-blue-950 font-black uppercase tracking-wider flex items-center gap-1 pr-2 whitespace-nowrap">
            <Filter className="w-3.5 h-3.5 text-emerald-600" /> Kundi:
          </span>

          <button
            onClick={() => setSelectedCategoryFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
              selectedCategoryFilter === 'ALL'
                ? 'bg-blue-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:text-blue-950 border border-slate-200'
            }`}
          >
            Bidhaa Zote ({products.length})
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
                selectedCategoryFilter === cat.id
                  ? 'bg-blue-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:text-blue-950 border border-slate-200'
              }`}
            >
              {cat.name} ({cat.products_count ?? 0})
            </button>
          ))}

          <button
            onClick={() => setSelectedCategoryFilter('UNCATEGORIZED')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap ${
              selectedCategoryFilter === 'UNCATEGORIZED'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-100 text-slate-600 hover:text-blue-950 border border-slate-200'
            }`}
          >
            Bila Kundi
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white border-2 border-emerald-500/40 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500 gap-2 font-medium">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            <span>Inapakia orodha ya bidhaa...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-sm font-semibold">
            Hakuna bidhaa iliyopatikana kwenye kundi hili au utafutaji wako.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-extrabold">
                  <th className="py-4 px-6">Bidhaa</th>
                  <th className="py-4 px-6">Kundi (Category)</th>
                  <th className="py-4 px-6">Barcode</th>
                  {isOwner && <th className="py-4 px-6">Bei ya Kununua</th>}
                  <th className="py-4 px-6">Bei ya Kuuzia</th>
                  <th className="py-4 px-6">Stoko Iliyopo</th>
                  {canAddProducts && <th className="py-4 px-6 text-right">Vitendo</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProducts.map((p) => {
                  const currentStock = Number(p.quantity ?? 0);
                  const minAlert = Number(p.min_stock_alert || 5);
                  const isLowStock = currentStock <= minAlert;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="py-4 px-6 font-extrabold text-blue-950">{p.name}</td>
                      
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-blue-50 text-blue-800 border border-blue-200 uppercase">
                          <Tag className="w-3 h-3 text-emerald-600" />
                          {p.category_name || 'Bila Kundi'}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-500 font-mono text-xs font-semibold">{p.barcode || 'N/A'}</td>
                      {isOwner && (
                        <td className="py-4 px-6 text-slate-600 font-mono font-bold">{Number(p.buying_price || 0).toLocaleString()} TZS</td>
                      )}
                      <td className="py-4 px-6 text-blue-950 font-black font-mono">{Number(p.selling_price || 0).toLocaleString()} TZS</td>
                      
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black ${
                          isLowStock 
                            ? 'bg-amber-50 text-amber-700 border border-amber-300' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                        }`}>
                          {isLowStock && <AlertTriangle className="w-3.5 h-3.5" />}
                          {currentStock} {p.unit}
                        </span>
                      </td>

                      {canAddProducts && (
                        <td className="py-4 px-6 text-right space-x-2">
                          <button
                            onClick={() => openEditModal(p)}
                            className="p-2 text-slate-600 hover:text-blue-950 hover:bg-slate-100 rounded-xl transition"
                            title="Badilisha (Edit)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => promptDeleteProduct(p.id, p.name)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                            title="Futa (Delete)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-blue-950">
                {editId ? 'Badilisha Taarifa za Bidhaa' : 'Sajili Bidhaa Mpya'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="flex text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5 items-center gap-2">
                  <Scan className="w-4 h-4 text-emerald-600" />
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
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-mono font-bold focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Jina la Bidhaa *</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Mfano: Azam Juice 1L"
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Kundi la Bidhaa (Category)</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600 text-sm"
                >
                  <option value="">-- Bila Kundi --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className={`grid ${isOwner ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                {isOwner && (
                  <div>
                    <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Bei ya Kununua (TZS)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="buying_price"
                      required
                      value={formData.buying_price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 focus:outline-none focus:border-emerald-600 text-sm font-mono font-bold"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Bei ya Kuuzia (TZS)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="selling_price"
                    required
                    value={formData.selling_price}
                    onChange={handleInputChange}
                    placeholder="2500"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 focus:outline-none focus:border-emerald-600 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Stoko (Idadi)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="quantity"
                    required
                    value={formData.quantity}
                    onChange={handleInputChange}
                    placeholder="50"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 focus:outline-none focus:border-emerald-600 text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Kipimo (Unit)</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold focus:outline-none focus:border-emerald-600 text-sm"
                  >
                    <option value="pcs">pcs</option>
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="plate">plate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-blue-950 uppercase tracking-wider mb-1.5">Min Alert</label>
                  <input
                    type="number"
                    step="0.01"
                    name="min_stock_alert"
                    value={formData.min_stock_alert}
                    onChange={handleInputChange}
                    placeholder="5"
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 focus:outline-none focus:border-emerald-600 text-sm font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition text-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-blue-950 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600" />
                <span>Simamia Makundi ya Bidhaa</span>
              </h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-xl bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Jina la kundi jipya..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl text-blue-950 font-bold text-sm focus:outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-sm transition shadow-md shadow-emerald-600/20 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Sajili</span>
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {categories.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-xs font-semibold">Hakuna makundi yaliyosajiliwa bado.</p>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                    <span className="text-xs font-black text-blue-950 uppercase">{cat.name}</span>
                    <button
                      onClick={() => promptDeleteCategory(cat.id, cat.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                      title="Futa Kundi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL YA KUFUTA */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white border-2 border-red-500/40 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4 text-center animate-fadeIn">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-blue-950">{confirmModal.title}</h3>
              <p className="text-xs text-slate-600 font-medium mt-1">
                Una uhakika unataka kufuta <strong className="text-blue-950 font-black">"{confirmModal.name}"</strong>? Hatua hii haiwezi kurejeshwa.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal({ show: false, type: '', id: null, title: '', name: '' })}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition text-xs"
              >
                Ghairi
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition text-xs shadow-md shadow-red-600/20 flex items-center justify-center gap-1"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Ndiyo, Futa</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}