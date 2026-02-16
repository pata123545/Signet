import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, ArrowRight, Building2, Phone, MapPin, CheckCircle, Lock } from 'lucide-react';
import FileUploader from '../components/FileUploader';

// Helper: Convert Base64 to Blob
const base64ToBlob = (base64Data, contentType) => {
    const byteCharacters = atob(base64Data.split(',')[1]);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
};

const Auth = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Step State: 1 = Auth (Google), 2 = Business, 3 = Branding
    const [step, setStep] = useState(1);

    // User Data
    const [userId, setUserId] = useState(null);
    const [userEmail, setUserEmail] = useState('');

    // Business Data
    const [fullName, setFullName] = useState('');
    const [businessName, setBusinessName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');

    // Branding Data
    const [logo, setLogo] = useState(null);
    const [signature, setSignature] = useState(null);

    // --- EFFECT: CHECK AUTH & PERSISTENCE ---
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                setUserId(session.user.id);
                setUserEmail(session.user.email);

                // Fetch Profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    // Pre-fill state
                    setFullName(profile.full_name || session.user.user_metadata?.full_name || '');
                    setBusinessName(profile.business_name || '');
                    setPhone(profile.phone || '');
                    setAddress(profile.address || '');
                    setLogo(profile.logo_url || null);
                    setSignature(profile.signature_url || null);

                    // Determine Step
                    if (profile.business_name && profile.logo_url) {
                        // Fully complete -> Dashboard
                        navigate('/app');
                    } else if (profile.business_name) {
                        // Partial -> Step 3
                        setStep(3);
                    } else {
                        // Profile exists but empty -> Step 2
                        setStep(2);
                    }
                } else {
                    // No profile row yet -> Step 2 (and create empty row)
                    await supabase.from('profiles').insert([{
                        id: session.user.id,
                        email: session.user.email,
                        full_name: session.user.user_metadata?.full_name || ''
                    }]);
                    setStep(2);
                }
            }
        };

        checkUser();

        // Listen for auth changes (e.g. after Google redirect)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) checkUser();
        });

        return () => subscription.unsubscribe();
    }, [navigate]);


    // --- STEP 1: GOOGLE AUTH ---
    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin + '/auth', // Redirect back to this page
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                },
            });
            if (error) throw error;
        } catch (error) {
            console.error(error);
            toast.error('שגיאה בהתחברות לגוגל');
            setLoading(false);
        }
    };

    // --- STEP 2: BUSINESS IDENTITY ---
    const handleBusinessSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!userId) throw new Error("User ID missing");

            const updates = {
                id: userId,
                full_name: fullName,
                business_name: businessName,
                phone: phone,
                address: address,
                email: userEmail,
                updated_at: new Date()
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            toast.success('פרטי העסק נשמרו');
            setStep(3);
        } catch (error) {
            console.error(error);
            toast.error('שגיאה בשמירה: ' + (error.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    // --- STEP 3: VISUAL BRANDING ---
    const handleBrandingSave = async () => {
        setLoading(true);
        try {
            // Upload Logic
            const upload = async (base64) => {
                const blob = base64ToBlob(base64, 'image/png');
                // Path: userId_timestamp.png (Flat structure to avoid nesting issues)
                const fileName = `${userId}_${Date.now()}.png`;
                const { error } = await supabase.storage.from('logos').upload(fileName, blob, { upsert: true });
                if (error) throw error;
                const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
                return data.publicUrl;
            };

            let logoUrl = logo && !logo.startsWith('http') ? await upload(logo) : logo;
            let sigUrl = signature && !signature.startsWith('http') ? await upload(signature) : signature;

            // Update Profile
            const updates = {
                id: userId,
                logo_url: logoUrl,
                signature_url: sigUrl,
                updated_at: new Date()
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            toast.success('המותג שלך מוכן! ברוך הבא ל-Signet', {
                duration: 4000,
                icon: '🦅'
            });

            // Redirect to Dashboard
            navigate('/app');

        } catch (error) {
            console.error(error);
            toast.error('שגיאה: ' + (error.message || 'שגיאה בהעלאת קבצים'));
        } finally {
            setLoading(false);
        }
    };


    // --- RENDER HELPERS ---
    const ProgressBar = () => (
        <div className="w-full h-1 bg-gray-100 rounded-full mb-8 overflow-hidden flex" dir="ltr">
            <div className={`h-full bg-[#D4AF37] transition-all duration-500 ease-out ${step === 1 ? 'w-1/3' : step === 2 ? 'w-2/3' : 'w-full'}`}></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-6 font-sans text-gray-900" dir="rtl">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.05)] border border-gray-100 p-10 relative overflow-hidden transition-all duration-500">

                {/* Decorative */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-bl-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gray-50 rounded-tr-full -ml-12 -mb-12"></div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        {/* ICON */}
                        <div className="w-16 h-16 bg-black text-[#D4AF37] rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-xl shadow-black/10">
                            {step === 1 && <Lock size={28} />}
                            {step === 2 && <Building2 size={28} />}
                            {step === 3 && <CheckCircle size={28} />}
                        </div>

                        <h1 className="text-3xl font-black tracking-tight mb-2">
                            {step === 1 ? 'כניסה למערכת' :
                                step === 2 ? 'פרטי העסק' : 'מיתוג אישי'}
                        </h1>
                        <p className="text-gray-400 text-sm font-medium">
                            {step === 1 ? 'התחברות מאובטחת באמצעות Google' :
                                step === 2 ? 'ספר לנו על העסק שלך' : 'הוסף את הלוגו והחתימה שלך'}
                        </p>
                    </div>

                    <ProgressBar />

                    {/* --- STEP 1: GOOGLE AUTH --- */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className="w-full bg-white border border-[#D4AF37] text-gray-700 py-4 rounded-xl font-bold flex items-center justify-center gap-3 relative overflow-hidden group hover:shadow-xl hover:shadow-[#D4AF37]/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 size={24} className="animate-spin text-[#D4AF37]" /> : (
                                    <>
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                        </svg>
                                        <span>התחבר באמצעות Google</span>
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
                                בלחיצה על התחברות, אתה מאשר את תנאי השימוש ומדיניות הפרטיות של Signet.
                            </p>
                        </div>
                    )}

                    {/* --- STEP 2: BUSINESS --- */}
                    {step === 2 && (
                        <form onSubmit={handleBusinessSave} className="space-y-5 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                            <div className="relative">
                                <Building2 className="absolute top-3.5 right-4 text-gray-300" size={18} />
                                <input type="text" placeholder="שם העסק" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-3.5 pr-12 pl-4 text-sm font-medium outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all font-sans" required />
                            </div>
                            <div className="relative">
                                <Phone className="absolute top-3.5 right-4 text-gray-300" size={18} />
                                <input type="tel" placeholder="טלפון עסקי" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-3.5 pr-12 pl-4 text-sm font-medium outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all" required />
                            </div>
                            <div className="relative">
                                <MapPin className="absolute top-3.5 right-4 text-gray-300" size={18} />
                                <input type="text" placeholder="כתובת העסק" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-gray-50/50 border border-gray-100 rounded-xl py-3.5 pr-12 pl-4 text-sm font-medium outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/20 transition-all" required />
                            </div>
                            <Button loading={loading} text="שמור והמשך" />
                        </form>
                    )}

                    {/* --- STEP 3: BRANDING --- */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                            <div className="space-y-4">
                                <FileUploader label="לוגו העסק" currentImage={logo} onUpload={setLogo} />
                                <FileUploader label="חתימה דיגיטלית (אופציונלי)" currentImage={signature} onUpload={setSignature} />
                            </div>
                            <Button loading={loading} text="סיום והתחלת עבודה" onClick={handleBrandingSave} />
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

const Button = ({ loading, text, onClick }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className="w-full bg-black text-[#D4AF37] py-4 rounded-xl font-bold flex items-center justify-center gap-3 relative overflow-hidden group hover:shadow-xl hover:shadow-[#D4AF37]/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
    >
        {loading ? <Loader2 size={20} className="animate-spin" /> : (
            <>
                <span>{text}</span>
                <ArrowRight size={18} className="group-hover:-translate-x-1 transition-transform" />
            </>
        )}
    </button>
);

export default Auth;
