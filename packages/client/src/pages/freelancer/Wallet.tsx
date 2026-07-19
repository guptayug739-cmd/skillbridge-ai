import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { Wallet as WalletIcon, ArrowDownRight, ArrowUpRight, CreditCard, IndianRupee, Clock, X } from 'lucide-react';

interface WalletData { balance: number; lockedBalance: number; totalWithdrawn: number; totalEarned: number; }
interface Transaction { id: string; type: string; amount: number; fee: number; netAmount: number; status: string; description: string; createdAt: string; }

const TYPE_CONFIG: Record<string, { icon: typeof ArrowDownRight; color: string; prefix: string }> = {
  PAYMENT: { icon: ArrowDownRight, color: 'text-green-600 bg-green-50', prefix: '+' },
  RELEASE: { icon: ArrowDownRight, color: 'text-blue-600 bg-blue-50', prefix: '+' },
  WITHDRAWAL: { icon: ArrowUpRight, color: 'text-orange-600 bg-orange-50', prefix: '-' },
  FEE: { icon: ArrowUpRight, color: 'text-red-600 bg-red-50', prefix: '-' },
};

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', accountNumber: '', ifscCode: '', accountHolder: '', bankName: '' });

  useEffect(() => {
    Promise.all([
      api.get('/payments/wallet'),
      api.get('/payments/transactions'),
    ]).then(([wRes, tRes]) => {
      setWallet(wRes.data.data);
      setTransactions(tRes.data.data);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawForm.amount);
    if (amount < 500) { toast.error('Minimum withdrawal is ₹500'); return; }
    if (wallet && amount > wallet.balance) { toast.error('Insufficient balance'); return; }
    setWithdrawing(true);
    try {
      await api.post('/payments/withdraw', {
        amount, accountNumber: withdrawForm.accountNumber, ifscCode: withdrawForm.ifscCode,
        accountHolder: withdrawForm.accountHolder, bankName: withdrawForm.bankName,
      });
      setWallet((prev) => prev ? { ...prev, balance: prev.balance - amount, lockedBalance: prev.lockedBalance + amount } : prev);
      setShowWithdraw(false);
      setWithdrawForm({ amount: '', accountNumber: '', ifscCode: '', accountHolder: '', bankName: '' });
      toast.success('Withdrawal request submitted');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Withdrawal failed');
    } finally { setWithdrawing(false); }
  };

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';

  if (isLoading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">{[1,2,3,4].map((i) => <div key={i} className="card animate-pulse-soft h-24" />)}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Wallet & Transactions</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <WalletIcon className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-2xl font-bold">₹{(wallet?.balance || 0).toLocaleString()}</p>
          <p className="text-sm opacity-80">Available Balance</p>
        </div>
        <div className="card">
          <IndianRupee className="w-6 h-6 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">₹{(wallet?.totalEarned || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Earned</p>
        </div>
        <div className="card">
          <Clock className="w-6 h-6 text-orange-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">₹{(wallet?.lockedBalance || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500">In Escrow</p>
        </div>
        <div className="card">
          <ArrowUpRight className="w-6 h-6 text-gray-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">₹{(wallet?.totalWithdrawn || 0).toLocaleString()}</p>
          <p className="text-sm text-gray-500">Total Withdrawn</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
        {(wallet?.balance || 0) >= 500 && (
          <button onClick={() => setShowWithdraw(true)} className="btn-primary text-sm flex items-center gap-1.5"><CreditCard className="w-4 h-4" /> Withdraw</button>
        )}
      </div>

      {transactions.length > 0 ? (
        <div className="space-y-2">
          {transactions.map((t, i) => {
            const config = TYPE_CONFIG[t.type] || TYPE_CONFIG.PAYMENT;
            const isCredit = t.type === 'PAYMENT' || t.type === 'RELEASE';
            return (
              <div key={t.id} className="card flex items-center gap-4 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <config.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.description}</p>
                  <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-bold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>{isCredit ? '+' : '-'}₹{t.netAmount.toLocaleString()}</p>
                  {t.fee > 0 && <p className="text-xs text-gray-400">Fee: ₹{t.fee.toLocaleString()}</p>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <WalletIcon className="w-14 h-14 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No transactions yet</p>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-fade-up relative">
            <button onClick={() => setShowWithdraw(false)} className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Withdraw Funds</h2>
            <p className="text-sm text-gray-500 mb-4">Available: ₹{(wallet?.balance || 0).toLocaleString()} | Min ₹500 | 2% fee</p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div><label className={labelClass}>Amount (₹) *</label><input type="number" className={inputClass} min={500} required value={withdrawForm.amount} onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} placeholder="5000" /></div>
              <div><label className={labelClass}>Account Holder Name *</label><input type="text" className={inputClass} required value={withdrawForm.accountHolder} onChange={(e) => setWithdrawForm({ ...withdrawForm, accountHolder: e.target.value })} placeholder="John Doe" /></div>
              <div><label className={labelClass}>Bank Name *</label><input type="text" className={inputClass} required value={withdrawForm.bankName} onChange={(e) => setWithdrawForm({ ...withdrawForm, bankName: e.target.value })} placeholder="HDFC Bank" /></div>
              <div><label className={labelClass}>Account Number *</label><input type="text" className={inputClass} required value={withdrawForm.accountNumber} onChange={(e) => setWithdrawForm({ ...withdrawForm, accountNumber: e.target.value })} placeholder="1234567890" /></div>
              <div><label className={labelClass}>IFSC Code *</label><input type="text" className={inputClass} required value={withdrawForm.ifscCode} onChange={(e) => setWithdrawForm({ ...withdrawForm, ifscCode: e.target.value })} placeholder="HDFC0001234" /></div>
              <button type="submit" disabled={withdrawing} className="w-full btn-primary py-2.5 flex items-center justify-center gap-2">
                {withdrawing ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" /> : <><CreditCard className="w-4 h-4" /> Request Withdrawal</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
