import { useState } from 'react';

/**
 * CardSwipeMachine
 * A UI-only component simulating a physical card swipe terminal.
 * In the future this can be wired to actual hardware via WebSocket/serial port.
 *
 * Props:
 *   isOpen         — boolean
 *   onClose        — () => void
 *   onPaymentSuccess — () => void  (called when receptionist confirms swipe)
 *   amount         — number
 *   label          — optional string e.g. "Vehicle Hire Payment"
 */
const CardSwipeMachine = ({ isOpen, onClose, onPaymentSuccess, amount, label = 'Walk-in Payment' }) => {
    const [step, setStep] = useState('ready'); // ready | awaiting | success

    const handleReset = () => setStep('ready');

    const handleActivate = () => {
        setStep('awaiting');
    };

    const handleConfirmSwipe = () => {
        setStep('success');
        setTimeout(() => {
            onPaymentSuccess();
            onClose();
            setStep('ready');
        }, 2200);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[10000] flex items-center justify-center p-4 font-mono">
            <div className="w-full max-w-sm">

                {/* Terminal body */}
                <div className="bg-slate-900 rounded-[2.5rem] border border-slate-700 shadow-2xl shadow-black/80 overflow-hidden">

                    {/* Screen bezel */}
                    <div className="bg-slate-950 mx-6 mt-6 rounded-2xl border border-slate-800 p-1">
                        <div className="bg-slate-900 rounded-xl p-5 min-h-[220px] flex flex-col items-center justify-center relative overflow-hidden">

                            {/* Screen scanline effect */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-800/5 to-transparent bg-[size:100%_4px] pointer-events-none" />

                            {step === 'ready' && (
                                <div className="text-center space-y-3 animate-in fade-in duration-300">
                                    <div className="flex justify-center mb-2">
                                        <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-lg shadow-green-400/50" />
                                    </div>
                                    <p className="text-[10px] font-bold text-green-400 uppercase tracking-[0.3em]">Terminal Ready</p>
                                    <h2 className="text-white text-2xl font-black tracking-tight">
                                        Rs. {Number(amount || 0).toLocaleString()}
                                    </h2>
                                    <p className="text-slate-400 text-[10px] uppercase tracking-widest">{label}</p>
                                </div>
                            )}

                            {step === 'awaiting' && (
                                <div className="text-center space-y-4 animate-in fade-in duration-300">
                                    {/* Animated card swipe slot */}
                                    <div className="relative w-32 h-20 mx-auto">
                                        <div className="absolute inset-0 border-2 border-dashed border-gold-500/40 rounded-xl flex items-center justify-center">
                                            <div className="w-full h-px bg-gradient-to-r from-transparent via-gold-400 to-transparent animate-pulse" />
                                        </div>
                                        <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-center">
                                            <div className="text-4xl animate-bounce">💳</div>
                                        </div>
                                    </div>
                                    <p className="text-gold-400 text-[11px] font-black uppercase tracking-[0.2em] animate-pulse">
                                        Please swipe customer card
                                    </p>
                                    <p className="text-slate-500 text-[9px] uppercase tracking-widest">
                                        on the connected terminal device
                                    </p>
                                    <div className="flex justify-center gap-1 mt-2">
                                        {[0,1,2].map(i => (
                                            <div
                                                key={i}
                                                className="w-2 h-2 rounded-full bg-gold-400"
                                                style={{ animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {step === 'success' && (
                                <div className="text-center space-y-3 animate-in zoom-in duration-500">
                                    <div className="w-16 h-16 rounded-2xl bg-green-500 flex items-center justify-center text-4xl mx-auto shadow-xl shadow-green-500/30 rotate-3">
                                        ✓
                                    </div>
                                    <p className="text-green-400 text-sm font-black uppercase tracking-widest">Payment Approved</p>
                                    <p className="text-slate-400 text-[10px]">Rs. {Number(amount || 0).toLocaleString()} — Authorized</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card slot visual */}
                    <div className="mx-12 mt-4 h-2 bg-slate-800 rounded-full border border-slate-700 relative overflow-hidden">
                        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-600 to-transparent rounded-full" />
                    </div>
                    <p className="text-center text-[8px] text-slate-600 uppercase tracking-[0.3em] mt-1 mb-4">card slot</p>

                    {/* Keypad area */}
                    <div className="px-6 pb-6 space-y-3">

                        {step === 'ready' && (
                            <>
                                <button
                                    onClick={handleActivate}
                                    className="w-full py-4 bg-gold-600 hover:bg-gold-500 text-white font-black rounded-2xl uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg shadow-gold-600/30"
                                >
                                    🟢 Activate Terminal
                                </button>
                                <button
                                    onClick={onClose}
                                    className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-[10px] uppercase tracking-widest transition-colors font-bold"
                                >
                                    Cancel
                                </button>
                            </>
                        )}

                        {step === 'awaiting' && (
                            <>
                                <button
                                    onClick={handleConfirmSwipe}
                                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl uppercase tracking-widest text-sm transition-all active:scale-95 shadow-lg shadow-green-600/30 flex items-center justify-center gap-2"
                                >
                                    <span>✓</span>
                                    <span>Card Swiped — Confirm</span>
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-[10px] uppercase tracking-widest transition-colors font-bold"
                                >
                                    ← Back
                                </button>
                            </>
                        )}

                        {step === 'success' && (
                            <div className="text-center py-2">
                                <p className="text-green-400 text-xs font-bold">Processing...</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Terminal base label */}
                <p className="text-center text-[9px] text-slate-600 uppercase tracking-[0.3em] mt-3 font-bold">
                    Janas Hotel — POS Terminal v2.0
                </p>
            </div>
        </div>
    );
};

export default CardSwipeMachine;
