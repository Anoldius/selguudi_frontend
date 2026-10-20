import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Loader2, RefreshCw, Smartphone } from 'lucide-react';
import apiClient from '../api/axios';

export default function BillingSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const merchantRef = searchParams.get('OrderMerchantReference') || searchParams.get('merchant_ref');

  const confirmPayment = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Kama kuna merchant_ref, jaribu kuhakiki muamala huo
      if (merchantRef) {
        const res = await apiClient.post('auth/billing/verify-payment/', {
          merchant_ref: merchantRef
        });

        if (res.status === 200) {
          setIsSuccess(true);
          setLoading(false);
          return;
        }
      }

      // 2. Kama hakuna merchant_ref au direct verify, kagua Status ya sasa ya Subscription
      const statusRes = await apiClient.get('auth/billing/status/');
      if (statusRes.data && statusRes.data.has_active_access) {
        setIsSuccess(true);
      } else {
        setIsSuccess(false);
        setErrorMessage("Malipo yako bado hayajathibitishwa na mfumo. Hakikisha umetuma fedha kupitia namba sahihi ya usajili.");
      }
    } catch (err) {
      console.error("Payment verification error:", err);
      setIsSuccess(false);
      
      const backendError = err.response?.data?.error || err.response?.data?.detail;
      setErrorMessage(
        backendError || "Muamala bado haujakamilika. Kama umeshatuma fedha, subiri sekunde chache kisha ubonyeze 'Hakiki Tena'."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    confirmPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <Loader2 className="w-12 h-12 animate-spin text-emerald-400 mb-4" />
        <h3 className="text-base font-bold">Inathibitisha Malipo Yako...</h3>
        <p className="text-xs text-slate-400 mt-1">Mfumo unasoma SMS ya muamala wako, tafadhali subiri kidogo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        
        {isSuccess ? (
          /* ================= SKRINI YA MAFANIKIO (AKILIPA AU SMS IKISOMA) ================= */
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-xl">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">Malipo Yamefanikiwa! 🎉</h2>
              <p className="text-slate-400 text-sm mt-2">
                Asante kwa kulipia subscription ya Selguudi POS. Akaunti ya duka lako imewashwa na kuongezwa muda wa matumizi kikamilifu.
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
          </>
        ) : (
          /* ================= SKRINI YA HITILAFU / INASUBIRI MALIPO ================= */
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-xl">
              <Smartphone className="w-12 h-12" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">Uthibitisho wa Malipo</h2>
              <p className="text-amber-400 text-sm font-medium mt-2">
                {errorMessage}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={confirmPayment}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl flex items-center justify-center gap-2 text-sm transition border border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Hakiki Tena (Refresh Status)</span>
              </button>

              <button
                onClick={() => {
                  window.location.href = '/dashboard';
                }}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
              >
                <span>Rudi Kwenye Dashboard</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}