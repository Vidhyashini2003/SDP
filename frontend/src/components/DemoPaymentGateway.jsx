import { useState, useEffect } from 'react';

const DemoPaymentGateway = ({ isOpen, onClose, onPaymentSuccess, amount }) => {
    const [step, setStep] = useState('input'); // input, processing, success
    const [cardData, setCardData] = useState({
        cardNumber: '',
        expiry: '',
        cvc: '',
        name: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setStep('input');
            setErrors({});
            setCardData({ cardNumber: '', expiry: '', cvc: '', name: '' });
        }
    }, [isOpen]);

    const validate = () => {
        const newErrors = {};
        
        // Card Number: 16 digits (XXXX XXXX XXXX XXXX)
        const cleanCard = cardData.cardNumber.replace(/\s/g, '');
        if (cleanCard.length !== 16 || !/^\d+$/.test(cleanCard)) {
            newErrors.cardNumber = 'Invalid card number (16 digits required)';
        }

        // Expiry: MM/YY
        if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
            newErrors.expiry = 'Use MM/YY format';
        } else {
            const [mm, yy] = cardData.expiry.split('/').map(Number);
            const now = new Date();
            const currentYear = now.getFullYear() % 100;
            const currentMonth = now.getMonth() + 1;
            
            if (mm < 1 || mm > 12) newErrors.expiry = 'Invalid month';
            else if (yy < currentYear || (yy === currentYear && mm < currentMonth)) {
                newErrors.expiry = 'Card has expired';
            }
        }

        // CVC: 3 digits
        if (!/^\d{3}$/.test(cardData.cvc)) {
            newErrors.cvc = '3-digit CVC required';
        }

        // Name
        if (cardData.name.trim().length < 3) {
            newErrors.name = 'Full name required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePayment = (e) => {
        e.preventDefault();
        if (!validate()) return;

        setStep('processing');
        
        // Simulate a realistic payment processing delay
        setTimeout(() => {
            setStep('success');
            setTimeout(() => {
                onPaymentSuccess();
                onClose();
            }, 2000);
        }, 3000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4 font-sans text-slate-900">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 border border-slate-200">
                {/* Header - System Theme (Gold & Slate) */}
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gold-500/30">
                            <span className="text-3xl">🛡️</span>
                        </div>
                        <h2 className="text-xl font-black text-white uppercase tracking-widest italic leading-none">
                            Janas <span className="text-gold-500 font-black">Gateway</span>
                        </h2>
                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-[0.2em] mt-2">Secure Academic Transaction</p>
                    </div>
                </div>

                <div className="p-8">
                    {step === 'input' && (
                        <form onSubmit={handlePayment} className="space-y-6">
                            <div className="flex justify-between items-end pb-6 border-b border-slate-100 mb-2">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Payable Amount</p>
                                    <h3 className="text-3xl font-black text-slate-900 leading-none">
                                        <span className="text-gold-600 text-sm align-top mr-1">Rs.</span>
                                        {amount?.toLocaleString()}
                                    </h3>
                                </div>
                                <div className="flex gap-2 mb-1">
                                    <div className="w-10 h-6 bg-slate-50 rounded border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-300 italic">VISA</div>
                                    <div className="w-10 h-6 bg-slate-50 rounded border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-300 italic">MC</div>
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-gold-600 transition-colors">Cardholder Name</label>
                                    <input 
                                        type="text" 
                                        placeholder="EX: KAMAL PERERA"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border-2 rounded-2xl outline-none transition-all uppercase font-bold text-slate-700 placeholder:text-slate-200 text-sm ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-100 focus:border-gold-500 focus:bg-white focus:shadow-lg focus:shadow-gold-500/10'}`}
                                        value={cardData.name}
                                        onChange={(e) => setCardData({...cardData, name: e.target.value})}
                                    />
                                    {errors.name && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 italic">{errors.name}</p>}
                                </div>

                                <div className="group">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-gold-600 transition-colors">Card Number</label>
                                    <div className="relative">
                                        <input 
                                            type="text" 
                                            placeholder="XXXX XXXX XXXX XXXX"
                                            className={`w-full px-5 py-3.5 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-mono text-slate-700 placeholder:text-slate-200 text-sm tracking-widest ${errors.cardNumber ? 'border-red-400 bg-red-50' : 'border-slate-100 focus:border-gold-500 focus:bg-white focus:shadow-lg focus:shadow-gold-500/10'}`}
                                            value={cardData.cardNumber}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').substring(0, 16).replace(/(\d{4})/g, '$1 ').trim();
                                                setCardData({...cardData, cardNumber: val});
                                            }}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity">💳</span>
                                    </div>
                                    {errors.cardNumber && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 italic">{errors.cardNumber}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-gold-600 transition-colors">Expiry</label>
                                        <input 
                                            type="text" 
                                            placeholder="MM / YY"
                                            className={`w-full px-5 py-3.5 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-mono text-slate-700 placeholder:text-slate-200 text-center text-sm ${errors.expiry ? 'border-red-400 bg-red-50' : 'border-slate-100 focus:border-gold-500 focus:bg-white focus:shadow-lg focus:shadow-gold-500/10'}`}
                                            value={cardData.expiry}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/\D/g, '');
                                                if (val.length >= 2) val = val.substring(0,2) + '/' + val.substring(2,4);
                                                setCardData({...cardData, expiry: val});
                                            }}
                                            maxLength="5"
                                        />
                                        {errors.expiry && <p className="text-[10px] text-red-500 font-bold mt-1.5 italic text-center">{errors.expiry}</p>}
                                    </div>
                                    <div className="group">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-focus-within:text-gold-600 transition-colors">CVC</label>
                                        <input 
                                            type="password" 
                                            placeholder="***"
                                            className={`w-full px-5 py-3.5 bg-slate-50 border-2 rounded-2xl outline-none transition-all font-mono text-slate-700 placeholder:text-slate-200 text-center text-sm ${errors.cvc ? 'border-red-400 bg-red-50' : 'border-slate-100 focus:border-gold-500 focus:bg-white focus:shadow-lg focus:shadow-gold-500/10'}`}
                                            value={cardData.cvc}
                                            onChange={(e) => setCardData({...cardData, cvc: e.target.value.replace(/\D/g, '').substring(0,3)})}
                                            maxLength="3"
                                        />
                                        {errors.cvc && <p className="text-[10px] text-red-500 font-bold mt-1.5 italic text-center">{errors.cvc}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button 
                                    type="submit"
                                    className="w-full h-14 bg-gold-600 hover:bg-gold-700 text-white font-black rounded-2xl shadow-xl shadow-gold-600/30 hover:shadow-gold-600/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-3"
                                >
                                    <span>Proceed to Pay</span>
                                    <span className="text-xl">➔</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={onClose}
                                    className="w-full mt-3 py-2 text-slate-300 hover:text-slate-500 font-bold text-[10px] transition-colors uppercase tracking-widest"
                                >
                                    Cancel & Return
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'processing' && (
                        <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                            <div className="relative w-24 h-24 mb-8">
                                <div className="absolute inset-0 border-8 border-slate-100 rounded-full"></div>
                                <div className="absolute inset-0 border-8 border-gold-500 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center text-3xl">🏦</div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Verifying...</h3>
                            <p className="text-slate-400 text-sm mt-3 font-medium font-sans">Securing connection with <br/>central banking authority</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="py-16 flex flex-col items-center justify-center text-center animate-in zoom-in spin-in-90 duration-700">
                            <div className="w-24 h-24 bg-gold-500 text-white rounded-3xl flex items-center justify-center text-5xl mb-8 shadow-2xl shadow-gold-500/40 transform rotate-12">
                                ✓
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">SUCCESS!</h3>
                            <p className="text-gold-600 font-extrabold mt-1 mb-8 tracking-[0.3em] text-[10px] uppercase">Transaction Authorized</p>
                            
                            <div className="w-full p-6 bg-slate-900 rounded-[2rem] text-left relative overflow-hidden shadow-inner">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-full -mr-12 -mt-12 blur-lg"></div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Receipt Ref</p>
                                <p className="font-mono text-gold-500 text-sm font-bold">JAN-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                    <p className="text-[9px] font-black text-slate-300 tracking-[0.2em] uppercase">
                        Academic Demonstration Mode Only
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DemoPaymentGateway;
