import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import apiClient from '../api/axios';

export default function BillingSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const confirmPayment = async () => {
      const orderTrackingId = searchParams.get('OrderTrackingId');
      const merchantRef = searchParams.get('OrderMerchantReference') || searchParams.get('merchant_ref');

      if (merchantRef) {
        try {
          // Ita IPN callback View ili kusasisha subscription kwenye DB
          await apiClient.get(`auth/billing/pesapal-ipn/?OrderTrackingId=${orderTrackingId || 'SANDBOX_TEST'}&OrderMerchantReference=${merchantRef}`);
        } catch (err) {
          console.error("IPN trigger error:", err);
        }
      }
      setLoading(false);
    };

    confirmPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mb-4" />
        <p className="text-sm text-slate-400">Inathibitisha malipo yako...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xl">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <h2 className="text-2xl font-extrabold text-white">Malipo Yamefanikiwa! 🎉</h2>
          <p className="text-slate-400 text-sm mt-2">
            Asante kwa kulipia subscription ya Selguudi POS. Akaunti yako imeongezwa siku 30 za matumizi.
          </p>
        </div>

        <button
          onClick={() => {
            window.location.href = '/dashboard'; // Force reload ili kurefresh billing state
          }}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
        >
          <span>Rudi Kwenye Dashboard</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}