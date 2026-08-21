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
  Loader2 
} from 'lucide-react';

export default function POS() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Choices za Backend Django Model: 'cash', 'mobile_money', 'bank_card'
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [isCheckout, setIsCheckout] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Vuta Bidhaa Kutoka Backend
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('inventory/products/');
      setProducts(res.data.results || res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setLoading(false);
    }
  };

  // Filter bidhaa kwa search term
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.includes(search))
  );

  // 2. Add to Cart Logic
  const addToCart = (product) => {
    const stockAvailable = Number(product.quantity ?? product.stock_quantity ?? 0);

    if (stockAvailable <= 0) {
      alert("Bidhaa hii imeisha stoko!");
      return;
    }

    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= stockAvailable) {
        alert("Huwezi kuongeza zaidi ya stoko iliyopo!");
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

  // Update Quantity
  const updateQuantity = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.availableStock) {
          alert("Umezidi stoko iliyopo!");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  // Remove Item
  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  // Calculate Totals
  const totalAmount = cart.reduce((sum, item) => sum + (parseFloat(item.selling_price) * item.quantity), 0);
  const change = amountPaid ? Math.max(0, parseFloat(amountPaid) - totalAmount) : 0;

  // 3. Process Sale / Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsCheckout(true);
    try {
      const payload = {
        payment_method: paymentMethod, // 'cash', 'mobile_money', au 'bank_card'
        items: cart.map(item => ({
          product_id: String(item.id),
          quantity: Number(item.quantity)
        }))
      };

      await apiClient.post('sales/transactions/', payload);
      
      setSuccessMsg('Mauzo Yamekamilika Vizuri! 🎉');
      setCart([]);
      setAmountPaid('');
      fetchProducts();

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error("Full Sale Error Response:", err.response);

      if (err.response?.data) {
        const errorData = err.response.data;
        if (errorData.errors) {
          alert(`Validation Error: ${JSON.stringify(errorData.errors)}`);
        } else if (errorData.stock_error) {
          alert(errorData.stock_error);
        } else {
          alert(`Error: ${JSON.stringify(errorData)}`);
        }
      } else {
        alert('Imeshindikana kuunganisha na server!');
      }
    } finally {
      setIsCheckout(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-6">
      
      {/* LEFT SIDE: Product Catalog & Search */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-900/60 border border-slate-800 rounded-3xl p-5">
        
        {/* Search Bar */}
        <div className="relative mb-5">
          <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tafuta bidhaa kwa jina au kuanza kuscann Barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Products Grid */}
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

      {/* RIGHT SIDE: Cart / Bill Section */}
      <div className="w-full md:w-96 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between">
        
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="font-bold text-lg text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-emerald-400" />
              <span>Kikapu cha Mauzo</span>
            </h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-bold">
              {cart.reduce((a, b) => a + b.quantity, 0)} Items
            </span>
          </div>

          {/* Success Notification */}
          {successMsg && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Cart Items List */}
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

        {/* Payment Summary */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          
          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Njia ya Malipo</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'cash', label: 'Cash' },
                { id: 'mobile_money', label: 'Lipa' },
                { id: 'bank_card', label: 'Card' }
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id)}
                  className={`py-2 text-xs font-bold rounded-xl border capitalize transition ${
                    paymentMethod === method.id
                      ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid Input */}
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

          {/* Total Price & Submit */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Jumla Kuu:</span>
            <span className="text-2xl font-extrabold text-emerald-400">{totalAmount.toLocaleString()} TZS</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isCheckout}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
          >
            {isCheckout ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
            <span>Kamilisha Mauzo</span>
          </button>
        </div>

      </div>

    </div>
  );
}