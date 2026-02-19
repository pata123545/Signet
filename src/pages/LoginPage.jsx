import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, ArrowLeft, Upload, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// --- MINIMALIST INPUT CAPSULE ---
const LandingInput = ({ onClick }) => (
    <div
        onClick={onClick}
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-full p-2 pl-4 flex items-center shadow-sm hover:shadow-md transition-shadow cursor-text group"
    >
        <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-slate-100 transition-colors">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </div>
        <div className="flex-1 text-right pr-4 text-slate-400 font-light text-lg">
            ...ספר לי על העסק שלך
        </div>
    </div>
);

// --- REGISTRATION MODAL ---
const RegistrationModal = ({ onClose }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    // Profile Data
    const [profile, setProfile] = useState({
        businessName: '',
        businessAddress: '',
        businessPhone: '',
        logo: null, // base64 preview
        signature: null, // base64 preview
    });

    // Auth (Magic Link)
    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: window.location.origin }
            });
            if (error) throw error;
            setOtpSent(true);
            toast.success('קישור אימות נשלח למייל!');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper: File Upload
    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveAndAuth = () => {
        // Save to LocalStorage for post-auth sync
        localStorage.setItem('temp_registration_profile', JSON.stringify({
            ...profile,
        }));
        setStep(4); // "Enter Email" step
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-full max-w-lg p-8 shadow-2xl relative overflow-hidden" dir="rtl">
                <button onClick={onClose} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition-colors"><ArrowLeft size={20} /></button>

                {/* Progress */}
                <div className="flex justify-center gap-2 mb-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-slate-800' : 'w-2 bg-slate-200'}`} />
                    ))}
                </div>

                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">פרטים עסקיים</h2>
                            <p className="text-slate-500">התחל בהזנת פרטי העסק שלך</p>
                        </div>
                        <input
                            autoFocus
                            type="text"
                            placeholder="שם העסק"
                            className="w-full p-4 bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-center font-bold text-lg outline-none transition-all"
                            value={profile.businessName}
                            onChange={e => setProfile({ ...profile, businessName: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="טלפון"
                            className="w-full p-4 bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-center outline-none transition-all"
                            value={profile.businessPhone}
                            onChange={e => setProfile({ ...profile, businessPhone: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="כתובת מלאה"
                            className="w-full p-4 bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-center outline-none transition-all"
                            value={profile.businessAddress}
                            onChange={e => setProfile({ ...profile, businessAddress: e.target.value })}
                        />
                        <button
                            disabled={!profile.businessName}
                            onClick={() => setStep(2)}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                            המשך
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">נכסים דיגיטליים</h2>
                            <p className="text-slate-500">העלה לוגו וחתימה למסמכים</p>
                        </div>

                        <div className="flex justify-center gap-6">
                            <div className="text-center">
                                <span className="block text-sm font-bold text-slate-700 mb-2">לוגו</span>
                                <label className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors relative overflow-hidden">
                                    {profile.logo ? <img src={profile.logo} className="w-full h-full object-cover" /> : <Upload size={24} className="text-slate-300" />}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                                </label>
                            </div>
                            <div className="text-center">
                                <span className="block text-sm font-bold text-slate-700 mb-2">חתימה</span>
                                <label className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors relative overflow-hidden">
                                    {profile.signature ? <img src={profile.signature} className="w-full h-full object-contain" /> : <Upload size={24} className="text-slate-300" />}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature')} />
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(3)}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                        >
                            סיום ושמירה
                        </button>
                        <button onClick={() => setStep(3)} className="w-full text-center text-sm text-slate-400">דלג לשלב הבא</button>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">יצירת חשבון</h2>
                            <p className="text-slate-500">הזן אימייל לסיום ההרשמה</p>
                        </div>

                        {!otpSent ? (
                            <>
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="w-full p-4 bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-center text-lg outline-none transition-all"
                                    dir="ltr"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                                <button
                                    onClick={(e) => { handleSaveAndAuth(); handleAuth(e); }}
                                    disabled={loading || !email}
                                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'שלח קישור התחברות'}
                                </button>
                            </>
                        ) : (
                            <div className="bg-green-50 text-green-700 p-6 rounded-xl text-center">
                                <div className="flex justify-center mb-4"><Check size={32} /></div>
                                <h3 className="font-bold text-lg">המייל נשלח בהצלחה!</h3>
                                <p className="text-sm opacity-80 mt-2">בדוק את תיבת הדואר שלך בכתובת {email} כדי להתחבר.</p>
                                <p className="text-xs text-slate-400 mt-4">אתה יכול לסגור את החלון הזה.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- LOGIN MODAL ---
const LoginModal = ({ onClose }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otpSent, setOtpSent] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: window.location.origin }
            });
            if (error) throw error;
            setOtpSent(true);
            toast.success('קישור התחברות נשלח!');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl relative" dir="rtl">
                <button onClick={onClose} className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 transition-colors"><ArrowLeft size={20} /></button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">כניסה למערכת</h2>
                    <p className="text-slate-500">הזן את האימייל שלך להתחברות</p>
                </div>

                {!otpSent ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="email"
                            placeholder="name@example.com"
                            className="w-full p-4 bg-slate-50 border border-transparent focus:bg-white focus:border-slate-200 rounded-xl text-center text-lg outline-none transition-all"
                            dir="ltr"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'שלח קישור קסם'}
                        </button>
                    </form>
                ) : (
                    <div className="bg-green-50 text-green-700 p-6 rounded-xl text-center">
                        <div className="flex justify-center mb-4"><Check size={32} /></div>
                        <h3 className="font-bold text-lg">לינק נשלח למייל</h3>
                        <p className="text-sm opacity-80 mt-2">בדוק את התיבה שלך בכתובת {email}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const LoginPage = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    // Check for existing session
    const navigate = useNavigate();
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) navigate('/');
        });
    }, []);

    return (
        <div className="min-h-screen bg-[#FBFBF9] font-sans text-slate-900 flex flex-col relative overflow-hidden" dir="rtl">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-full h-[50vh] bg-gradient-to-b from-white to-transparent opacity-50 pointer-events-none" />

            {/* HEADER */}
            <header className="w-full p-6 flex justify-between items-center z-10 relative">
                <div className="text-2xl font-bold text-slate-800 tracking-tighter cursor-default select-none">Busni</div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowLogin(true)}
                        className="text-slate-600 font-medium hover:text-slate-900 transition-colors"
                    >
                        כניסה
                    </button>
                    <button
                        onClick={() => setShowRegister(true)}
                        className="bg-slate-800 text-white px-6 py-2 rounded-full font-medium hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 hover:shadow-xl"
                    >
                        מנוי חינם
                    </button>
                </div>
            </header>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 -mt-20">
                <h1 className="text-4xl md:text-6xl font-light text-slate-800 text-center mb-12 tracking-tight leading-tight max-w-4xl mx-auto">
                    במה <span className="font-bold">Busni</span> יכול לעזור<br />לעסק שלך היום?
                </h1>

                <LandingInput onClick={() => setShowRegister(true)} />

                <p className="mt-8 text-slate-400 text-sm font-light tracking-wide">
                    מערכת הפעלה עסקית • הצעות מחיר • ניהול מסמכים
                </p>
            </main>

            <footer className="py-6 text-center text-slate-300 text-xs font-mono uppercase tracking-widest">
                Protected by Busni Security
            </footer>

            {/* MODALS */}
            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
            {showRegister && <RegistrationModal onClose={() => setShowRegister(false)} />}
        </div>
    );
};

export default LoginPage;
