import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import apiClient from '../api/axios';

export default function BillingSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const orderTrackingId = searchParams.get('OrderTrackingId') || searchParams.get('orderTrackingId');
  const merchantRef = searchParams.get('OrderMerchantReference') || searchParams.get('merchant_ref');

  const confirmPayment = async () => {
    setLoading(true);
    setErrorMessage('');

    if (!merchantRef) {
      setIsSuccess(false);
      setErrorMessage("Taarifa za muamala hazijapatikana.");
      setLoading(false);
      return;
    }

    try {
      // Ita IPN callback View ili kuhakiki malipo halisi PesaPal
      const res = await apiClient.get(
        `auth/billing/pesapal-ipn/?OrderTrackingId=${orderTrackingId || ''}&OrderMerchantReference=${merchantRef}`
      );

      // Backend ikirudisha status == 'SUCCESS' na HTTP 200
      if (res.data && res.data.status === 'SUCCESS') {
        setIsSuccess(true);
      } else {
        setIsSuccess(false);
        setErrorMessage(res.data?.message || "Malipo hayajakamilishwa na PesaPal.");
      }
    } catch (err) {
      console.error("IPN verification error:", err);
      setIsSuccess(false);
      
      // Chukua maelezo ya error kutoka backend
      const backendDetail = err.response?.data?.message || err.response?.data?.detail;
      setErrorMessage(
        backendDetail || "Muamala haujathibitishwa na PesaPal (ilighairiwa au haukuingiza PIN sahihi)."
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
        <h3 className="text-base font-bold">Inathibitisha Malipo Na PesaPal...</h3>
        <p className="text-xs text-slate-400 mt-1">Tafadhali subiri kidogo usiondoke kwenye ukurasa huu.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
        
        {isSuccess ? (
          /* ================= SKRINI YA MAFANIKIO (PALE TU ALIPOLIPA HALALI) ================= */
          <>
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
          </>
        ) : (
          /* ================= SKRINI YA HITILAFU (AKIBONYEZA EXIT AU KUWEKA NAMBA FEKI) ================= */
          <>
            <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shadow-xl">
              <XCircle className="w-12 h-12" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white">Malipo Hayajakamilika!</h2>
              <p className="text-red-400 text-sm font-medium mt-2">
                {errorMessage}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={confirmPayment}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-2xl flex items-center justify-center gap-2 text-sm transition border border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Subiri/Hakiki Tena</span>
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