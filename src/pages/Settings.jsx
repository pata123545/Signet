import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import FileUploader from '../components/FileUploader';
import { Save, Loader2, Building2 } from "lucide-react";

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

const Settings = () => {
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('הגדרות העסק נשמרו בהצלחה');
    const [user, setUser] = useState(null);

    // Initial State
    const [profile, setProfile] = useState({
        businessName: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        logo: null,
        signature: null
    });

    // Helper: Fetch Profile
    const loadProfile = async (userId) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (data) {
            setProfile({
                businessName: data.business_name || '',
                email: data.email || '',
                phone: data.phone || '',
                address: data.address || '',
                taxId: data.tax_id || '',
                logo: data.logo_url || null,
                signature: data.signature_url || null
            });
        }
        if (error && error.code !== 'PGRST116') {
            console.error("Error fetching profile:", error);
        }
    };

    // Fetch Settings on Mount
    useEffect(() => {
        // Get Initial Session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUser(session.user);
                loadProfile(session.user.id);
            }
        });

        // Listen for Auth Changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadProfile(session.user.id);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleChange = (key, value) => {
        setProfile(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setLoading(true);

        if (!user) {
            setLoading(false);
            setToastMessage("נא להתחבר למערכת כדי לשמור שינויים");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        try {
            console.log("Saving settings for user:", user.id);

            // Helper: Upload to Supabase Storage
            const uploadToSupabase = async (base64String, folder) => {
                const blob = base64ToBlob(base64String, 'image/png');
                const fileName = `${folder}/${user.id}_${Date.now()}.png`;

                const { error: uploadError } = await supabase.storage
                    .from('logos')
                    .upload(fileName, blob, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicData } = supabase.storage
                    .from('logos')
                    .getPublicUrl(fileName);

                return publicData.publicUrl;
            };

            // 2. Upload Logo if Changed (Base64)
            let logoUrl = profile.logo;
            if (profile.logo && profile.logo.startsWith('data:')) {
                logoUrl = await uploadToSupabase(profile.logo, 'logos');
            }

            // 3. Upload Signature if Changed (Base64)
            let signatureUrl = profile.signature;
            if (profile.signature && profile.signature.startsWith('data:')) {
                signatureUrl = await uploadToSupabase(profile.signature, 'logos');
            }

            // 4. Upsert to Supabase
            const updates = {
                id: user.id, // Primary Key
                business_name: profile.businessName,
                address: profile.address,
                phone: profile.phone,
                email: profile.email,
                tax_id: profile.taxId,
                logo_url: logoUrl,
                signature_url: signatureUrl,
                updated_at: new Date(),
                theme_color: '#D4AF37',
                font_family: 'Heebo'
            };

            const { error: upsertError } = await supabase
                .from('profiles')
                .upsert(updates);

            if (upsertError) throw upsertError;

            // 5. Update Local State & Show Success Toast
            setProfile(prev => ({
                ...prev,
                logo: logoUrl,
                signature: signatureUrl
            }));

            setToastMessage('הגדרות העסק נשמרו בלבן פנינה וזהב!');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);

        } catch (error) {
            console.error("Save Error:", error);
            setToastMessage("שגיאה בשמירת הנתונים - נסה שנית");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-12 min-h-screen bg-[#FAFAFA]" dir="rtl">
            <div className="max-w-4xl mx-auto relative">

                {/* TOAST NOTIFICATION */}
                {showToast && (
                    <div className="fixed top-10 left-1/2 -translate-x-1/2 bg-black text-white px-8 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="w-2.5 h-2.5 bg-[#D4AF37] rounded-full animate-pulse shadow-[0_0_10px_#D4AF37]"></div>
                        <span className="text-sm font-bold tracking-wide">{toastMessage}</span>
                    </div>
                )}

                {/* HEADER */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">הגדרות עסק</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">ניהול פרטי העסק והמותג שלך</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-black text-white rounded-full text-sm font-bold hover:bg-gray-800 shadow-xl shadow-black/10 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin text-[#D4AF37]" />
                                <span className="text-gray-300">שומר...</span>
                            </>
                        ) : (
                            <>
                                <Save size={18} className="text-[#D4AF37]" />
                                שמור שינויים
                            </>
                        )}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* LEFT COLUMN: BRANDING */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-[#D4AF37]/20 transition-colors">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">לוגו ראשי</h3>
                            <FileUploader
                                label="לוגו העסק"
                                currentImage={profile.logo}
                                onUpload={(url) => handleChange('logo', url)}
                            />
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-[#D4AF37]/20 transition-colors">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">חתימה דיגיטלית</h3>
                            <FileUploader
                                label="חתימה ברירת מחדל"
                                currentImage={profile.signature}
                                onUpload={(url) => handleChange('signature', url)}
                            />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: DETAILS */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:border-[#D4AF37]/20 transition-colors">
                            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-50">
                                <div className="p-2 bg-[#D4AF37]/10 rounded-lg text-[#D4AF37]">
                                    <Building2 size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">פרטים כלליים</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="שם העסק" value={profile.businessName} onChange={e => handleChange('businessName', e.target.value)} />
                                <Input label="ח.פ / עוסק מורשה" value={profile.taxId} onChange={e => handleChange('taxId', e.target.value)} />
                                <Input label="אימייל לעסקים" value={profile.email} onChange={e => handleChange('email', e.target.value)} />
                                <Input label="טלפון" value={profile.phone} onChange={e => handleChange('phone', e.target.value)} />
                                <div className="md:col-span-2">
                                    <Input label="כתובת העסק" value={profile.address} onChange={e => handleChange('address', e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const Input = ({ label, value, onChange }) => (
    <div>
        <label className="text-xs font-bold text-gray-500 mb-2 block">{label}</label>
        <input
            value={value || ''}
            onChange={onChange}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black/10 focus:bg-white transition-all font-medium"
        />
    </div>
);

export default Settings;
