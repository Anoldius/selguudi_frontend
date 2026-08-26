import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  CheckCircle2, 
  Loader2,
  BookOpen,
  UserCheck,
  X,
  AlertCircle,
  Filter
} from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Choices: 'cash', 'mobile_money', 'bank_card', 'credit'
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [isCheckout, setIsCheckout] = useState(false);

  // State za Modal ya Kukopa
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [debtNotes, setDebtNotes] = useState('');

  // Floating Toast Notification State
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
    try {
      const [prodRes, catRes] = await Promise.all([
        apiClient.get('inventory/products/'),
        apiClient.get('inventory/categories/')
      ]);
      setProducts(prodRes.data.results || prodRes.data || []);
      setCategories(catRes.data.results || catRes.data || []);
    } catch (err) {
      console.error("Error fetching POS data:", err);
    } finally {
      setLoading(false);
    }
  };

  // CHUJO LA BIDHAA KWA KUTUMIA SEARCH & CATEGORY
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          (p.barcode && p.barcode.includes(search));
    
    if (selectedCategory === 'ALL') return matchesSearch;
    if (selectedCategory === 'UNCATEGORIZED') return matchesSearch && !p.category;
    return matchesSearch && p.category === selectedCategory;
  });

  const addToCart = (product) => {
    const stockAvailable = Number(product.quantity ?? product.stock_quantity ?? 0);

    if (stockAvailable <= 0) {
      triggerToast("Bidhaa hii imeisha stoko!", "error");
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= stockAvailable) {
        triggerToast("Huwezi kuongeza zaidi ya stoko iliyopo!", "error");
        return;
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, availableStock: stockAvailable }]);
    }
  };

  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.availableStock) {
          triggerToast("Umezidi stoko iliyopo!", "error");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.selling_price) * item.quantity), 0);
  const change = amountPaid ? Math.max(0, parseFloat(amountPaid) - totalAmount) : 0;

  const handleInitiateCheckout = () => {
    if (cart.length === 0) return;

    if (paymentMethod === 'credit') {
      setShowDebtModal(true);
    } else {
      executeCheckout({});
    }
  };

  const executeCheckout = async (debtDetails = {}) => {
    setIsCheckout(true);
    try {
      if (paymentMethod === 'credit') {
        let customerId = null;

        try {
          const custRes = await apiClient.get('sales/customers/');
          const existingCustomers = custRes.data.results || custRes.data || [];
          
          const match = existingCustomers.find(c => 
            c.name?.toLowerCase() === debtDetails.customer_name?.toLowerCase() ||
            (debtDetails.customer_phone && c.phone === debtDetails.customer_phone)
          );

          if (match) {
            customerId = match.id;
          } else {
            const newCustRes = await apiClient.post('sales/customers/', {
              name: debtDetails.customer_name,
              phone: debtDetails.customer_phone || ''
            });
            customerId = newCustRes.data.id;
          }
        } catch (cErr) {
          console.error("Error creating/fetching customer:", cErr);
        }

        if (customerId) {
          const debtPayload = {
            customer: customerId,
            total_amount: totalAmount,
            remaining_amount: totalAmount,
          };
          if (debtDetails.due_date && debtDetails.due_date.trim() !== '') {
            debtPayload.due_date = debtDetails.due_date;
          }

          await apiClient.post('sales/debts/', debtPayload);
        }
      }

      const salePayload = {
        payment_method: paymentMethod,
        customer_name: debtDetails.customer_name || '',
        customer_phone: debtDetails.customer_phone || '',
        items: cart.map(item => ({
          product_id: String(item.id),
          quantity: Number(item.quantity)
        }))
      };

      await apiClient.post('sales/transactions/', salePayload);
      
      triggerToast(
        paymentMethod === 'credit' 
          ? 'Deni Limesajiliwa Kwenye Daftari na Mauzo Yamekamilika! 📝' 
          : 'Mauzo Yamekamilika Vizuri! 🎉', 
        'success'
      );
      
      setCart([]);
      setAmountPaid('');
      setShowDebtModal(false);
      setCustomerName('');
      setCustomerPhone('');
      setDueDate('');
      setDebtNotes('');
      fetchData(); // Refresh products to get updated stock
    } catch (err) {
      console.error("Full Sale Error Response:", err.response);

      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.stock_error) {
          triggerToast(errorData.stock_error, 'error');
        } else {
          triggerToast("Imeshindikana kukamilisha mauzo!", 'error');
        }
      } else {
        triggerToast('Imeshindikana kuunganisha na server!', 'error');
      }
    } finally {
      setIsCheckout(false);
    }
  };

  const handleDebtSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      triggerToast("Tafadhali weka Jina la Mteja!", "error");
      return;
    }
    executeCheckout({
      customer_name: customerName,
      customer_phone: customerPhone,
      due_date: dueDate,
      notes: debtNotes
    });
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
      
      {/* FLOATING TOAST NOTIFICATION TOP RIGHT */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-[9999] px-5 py-4 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-md transition-all animate-bounce ${
          toast.type === 'success' 
            ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-300 shadow-emerald-950/50' 
            : 'bg-red-950/95 border-red-500/50 text-red-300 shadow-red-950/50'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* LEFT SIDE: Product Catalog & Search */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
        
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tafuta bidhaa kwa jina au kuanza kuscann Barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Category Filter Horizontal Scroll */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-2 scrollbar-none border-b border-slate-800/50">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 pr-1 whitespace-nowrap">
            <Filter className="w-3 h-3 text-emerald-400" /> Kundi:
          </span>

          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Zote
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.name}
            </button>
          ))}

          <button
            onClick={() => setSelectedCategory('UNCATEGORIZED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              selectedCategory === 'UNCATEGORIZED'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-950 text-slate-500 hover:text-slate-300 border border-slate-800'
            }`}
          >
            Bila Kundi
          </button>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
              <span>Inapakia bidhaa...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Hakuna bidhaa iliyopatikana.
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const stock = Number(product.quantity ?? product.stock_quantity ?? 0);
                const minAlert = Number(product.min_stock_alert || 5);
                const isLow = stock <= minAlert;

                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl text-left transition flex flex-col justify-between group"
                  >
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-emerald-400 transition truncate">{product.name}</h3>
                      <p className="text-[10px] text-purple-400 mt-0.5 truncate">{product.category_name || 'Bila Kundi'}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Stoko: <span className={isLow ? 'text-amber-400 font-bold' : 'text-slate-200'}>{stock} {product.unit || 'pcs'}</span>
                      </p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-extrabold text-emerald-400 text-sm">{Number(product.selling_price).toLocaleString()} TZS</span>
                      <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Cart Section */}
      <div className="w-full md:w-96 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <span>Kikapu cha Mauzo</span>
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold">
              {cart.reduce((a, b) => a + b.quantity, 0)} Items
            </span>
          </div>

          <div className="mt-4 max-h-64 overflow-y-auto space-y-3 pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-sm">
                Kikapu kipo wazi. Bonyeza bidhaa kuongeza.
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="overflow-hidden pr-2">
                    <h4 className="text-sm font-semibold text-white truncate">{item.name}</h4>
                    <p className="text-xs text-emerald-400">{Number(item.selling_price).toLocaleString()} TZS</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-slate-400 hover:text-white">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 text-xs font-bold text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-slate-400 hover:text-white">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button onClick={() => removeFromCart(item.id)} className="text-slate-500 hover:text-red-400 p-1 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Options Summary */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Njia ya Malipo</label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'cash', label: 'Cash' },
                { id: 'mobile_money', label: 'Lipa' },
                { id: 'bank_card', label: 'Card' },
                { id: 'credit', label: 'Kukopa' }
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`py-2 text-xs font-bold rounded-xl border capitalize transition ${
                    paymentMethod === method.id
                      ? method.id === 'credit' 
                        ? 'bg-amber-500 text-slate-950 border-amber-500' 
                        : 'bg-emerald-500 text-slate-950 border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod !== 'credit' && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Fedha Iliyotolewa:</span>
                {change > 0 && <span className="text-emerald-400 font-bold">Chenji: {change.toLocaleString()} TZS</span>}
              </div>
              <input
                type="number"
                placeholder="Weka kiasi kilicholipwa..."
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Jumla Kuu:</span>
            <span className="text-2xl font-extrabold text-emerald-400">{totalAmount.toLocaleString()} TZS</span>
          </div>

          <button
            onClick={handleInitiateCheckout}
            disabled={cart.length === 0 || isCheckout}
            className={`w-full py-3.5 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50 ${
              paymentMethod === 'credit'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {isCheckout ? <Loader2 className="w-5 h-5 animate-spin" /> : paymentMethod === 'credit' ? <BookOpen className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
            <span>{paymentMethod === 'credit' ? 'Sajili Kama Deni' : 'Kamilisha Mauzo'}</span>
          </button>
        </div>
      </div>

      {/* MODAL FORM YA SAJILI DENI */}
      {showDebtModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <BookOpen className="w-5 h-5" />
                <span>Taarifa za Mteja Anayekopa</span>
              </div>
              <button onClick={() => setShowDebtModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDebtSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Jina la Mteja *</label>
                <input
                  type="text"
                  required
                  placeholder="Mfano: John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Namba ya Simu</label>
                <input
                  type="text"
                  placeholder="Mfano: 0712345678"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Tarehe ya Ahadi ya Kulipa</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Maelezo Ziada (Notes)</label>
                <textarea
                  rows="2"
                  placeholder="Maelezo mengine ya ziada..."
                  value={debtNotes}
                  onChange={(e) => setDebtNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-semibold">Jumla ya Deni:</span>
                <span className="text-lg font-extrabold text-amber-400">{totalAmount.toLocaleString()} TZS</span>
              </div>

              <button
                type="submit"
                disabled={isCheckout}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl transition flex items-center justify-center gap-2"
              >
                {isCheckout ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserCheck className="w-5 h-5" />}
                <span>Hifadhi & Kamilisha Deni</span>
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}