import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/axios';
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
  CheckCircle2
} from 'lucide-react';

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State ya Pop-up Toast Notification
  const [toastMessage, setToastMessage] = useState(null);

  // References kwa ajili ya ku-control cursor focus (Barcode Hardware Scanner)
  const barcodeInputRef = useRef(null);
  const nameInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    buying_price: '',
    selling_price: '',
    quantity: '',
    unit: 'pcs',
    min_stock_alert: '5.00'
  });

  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  // Function ya Kuonyesha Notification kwa sekunde 3
  const triggerNotification = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Weka cursor kwenye Barcode Input kiotomatiki mara tu Modal inapofunguka
  useEffect(() => {
    if (showModal) {
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 100);
    }
  }, [showModal]);

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('inventory/products/?page_size=10000');
      
      if (Array.isArray(res.data)) {
        setProducts(res.data);
      } else if (res.data && Array.isArray(res.data.results)) {
        setProducts(res.data.results);
      } else {
        setProducts([]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Logic ya kukamata 'Enter' kutoka kwa Barcode Scanner
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

    try {
      if (editId) {
        await apiClient.put(`inventory/products/${editId}/`, formData);
        triggerNotification(`Taarifa za "${formData.name}" zimebadilishwa kikamilifu!`);
      } else {
        await apiClient.post('inventory/products/', formData);
        triggerNotification(`Bidhaa ya "${formData.name}" imeongezwa kwenye stoko!`);
      }
      setIsSubmitting(false);
      setShowModal(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || "Imeshindikana kuhifadhi bidhaa!");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, productName) => {
    if (window.confirm(`Je, una uhakika unataka kufuta bidhaa ya "${productName}"?`)) {
      try {
        await apiClient.delete(`inventory/products/${id}/`);
        triggerNotification(`Bidhaa ya "${productName}" imefutwa!`);
        fetchProducts();
      } catch (err) {
        alert("Imeshindikana kufuta bidhaa!");
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

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
          <p className="text-slate-400 text-sm mt-1">Ongeza bidhaa mpya au badilisha taarifa za bei na stoko.</p>
        </div>

        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-5 h-5" />
          <span>Ongeza Bidhaa Mpya</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Tafuta bidhaa kwa jina au Barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-900/80 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
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
            Hakuna bidhaa iliyopatikana kwenye mfumo.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                  <th className="py-4 px-6">Bidhaa</th>
                  <th className="py-4 px-6">Barcode</th>
                  <th className="py-4 px-6">Bei ya Kununua</th>
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
                      <td className="py-4 px-6 text-slate-400 font-mono">{p.barcode || 'N/A'}</td>
                      <td className="py-4 px-6 text-slate-300">{Number(p.buying_price || 0).toLocaleString()} TZS</td>
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
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition"
                          title="Futa (Delete)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL FOR ADD / EDIT PRODUCT */}
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
              
              {/* BARCODE INPUT */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Scan className="w-4 h-4 text-emerald-400" />
                  <span>Barcode (Scan au Andika)</span>
                </label>
                <div className="relative">
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
              </div>

              {/* PRODUCT NAME INPUT */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Jina la Bidhaa</label>
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

              <div className="grid grid-cols-2 gap-4">
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

    </div>
  );
}