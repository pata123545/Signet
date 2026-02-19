import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const Auth = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin,
                }
            });
            if (error) throw error;
            setSent(true);
            toast.success('קישור התחברות נשלח למייל שלך');
        } catch (error) {
            console.error(error);
            toast.error('שגיאה בהתחברות: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-900 p-6 font-sans" dir="rtl">

            <div className="w-full max-w-sm flex flex-col items-center text-center animate-in fade-in duration-700">
                <div className="mb-10 text-4xl font-black tracking-tight flex items-center gap-1">
                    Busni
                </div>

                {!sent ? (
                    <>
                        <h1 className="text-xl font-bold mb-2">כניסה למערכת</h1>
                        <p className="text-gray-400 text-sm mb-8">הזן את האימייל שלך לקבלת קישור כניסה מהיר</p>

                        <form onSubmit={handleLogin} className="w-full space-y-4">
                            <input
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-gray-50 border border-transparent focus:border-gray-200 focus:bg-white rounded-xl text-left outline-none transition-all placeholder:text-right"
                                required
                                disabled={loading}
                                dir="ltr"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-black text-white rounded-xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : 'שלח קישור התחברות'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="w-full bg-gray-50 p-6 rounded-2xl border border-gray-100 animate-in zoom-in-95 duration-300">
                        <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Loader2 size={24} className="animate-spin" />
                        </div>
                        <h2 className="font-bold text-lg mb-2">בדוק את האימייל שלך</h2>
                        <p className="text-sm text-gray-500 mb-6">
                            שלחנו קישור התחברות לכתובת <strong>{email}</strong>
                        </p>
                        <button
                            onClick={() => setSent(false)}
                            className="text-sm font-bold text-gray-900 flex items-center justify-center gap-2 hover:underline"
                        >
                            <ArrowLeft size={14} />
                            נסה אימייל אחר
                        </button>
                    </div>
                )}

                <div className="mt-12 text-[10px] text-gray-300 font-medium cursor-default">
                    Protected by Busni Security
                </div>
            </div>
        </div>
    );
};

export default Auth;
