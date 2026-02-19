import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Plus, Mic, Sparkles, MessageSquare, Settings, X, Image as ImageIcon, FileText, PieChart, CheckSquare, TrendingUp, Printer, Menu, History, LogOut, Upload, Search, Wrench, MoreVertical, Paperclip, Pin, Edit, Trash, Folder, Download, File, FileCheck, Share, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { runBusniAI } from '../utils/ai';
import ReactMarkdown from 'react-markdown';

// --- STYLES & ASSETS ---
const useLocalStorage = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });
    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };
    return [storedValue, setValue];
};

// --- COMPONENTS ---

// Slate Gray Sparkle
const BusniSparkle = ({ color = '#334155' }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block" style={{ color: color }}>
        <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" fill="currentColor" />
    </svg>
);


// FLOATING CAPSULE INPUT (Strict Slate/White)
const InputCapsule = ({ input, setInput, handleSend, loading, onPlusClick }) => (
    <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="w-full relative group">
        {/* The Capsule Container */}
        <div className={`
            relative overflow-hidden bg-white/95 backdrop-blur-3xl border border-slate-200/50 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 min-h-[120px] flex flex-col p-4
            rounded-[32px] group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)]
        `}>
            {/* Input Field Area */}
            <div className="flex flex-col gap-4 w-full h-full">
                {/* Textarea (Top) */}
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={loading ? "Busni חושב..." : "שאל את Busni כל דבר..."}
                    className="w-full min-h-[60px] py-1 text-2xl font-medium text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none resize-none text-right custom-scrollbar tracking-wide"
                    rows={1}
                    disabled={loading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                        }
                    }}
                />

                {/* Icons Row (Bottom) */}
                <div className="flex items-center justify-between mt-auto">
                    {/* Right Side (Plus) */}
                    <button
                        type="button"
                        onClick={onPlusClick}
                        className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors shrink-0"
                    >
                        <Plus size={20} />
                    </button>

                    {/* Left Side (Mic/Send) */}
                    <div className="flex items-center gap-2 shrink-0">
                        {input.trim() ? (
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-white hover:bg-slate-800 transition-all shadow-lg"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowLeft size={24} />}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="p-3 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                                <Mic size={24} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>

        {/* Thinking Pulse (Mimic Gemini Sparkle) */}
        {loading && (
            <div className="absolute inset-0 -z-10 rounded-[32px] bg-gradient-to-r from-slate-100 via-white to-slate-100 blur-xl thinking-pulse"></div>
        )}
    </form>
);

// --- PROPOSAL RENDERER (FIXED LAYOUT) ---
const ProposalRenderer = ({ data, brandColor, logoUrl, signatureUrl, businessDetails }) => {
    const [clientLink, setClientLink] = useState(null);

    const generateClientLink = () => {
        const link = `https://busni.app/sign/${data.quoteDetails?.number || Date.now()}`;
        setClientLink(link);
        navigator.clipboard.writeText(link);
    };

    return (
        <div className="bg-white rounded-sm shadow-xl border border-slate-100 p-[20mm] pt-[40px] font-sans text-slate-900 mx-auto max-w-[210mm] relative min-h-[297mm] flex flex-col mb-20">

            {/* HEADER GRID */}
            <div className="flex flex-row-reverse justify-between items-start mb-16 border-b border-slate-100 pb-12 w-full" dir="rtl">

                {/* RIGHT SIDE (RTL): Business & Client */}
                <div className="text-right flex flex-col items-end w-1/2">
                    {/* Business Info */}
                    <div className="text-sm text-slate-800 leading-relaxed font-light">
                        {logoUrl ? (
                            <img src={logoUrl} className="h-16 object-contain mb-6" alt="Business Logo" />
                        ) : (
                            <div className="font-bold text-2xl mb-1 text-slate-800 tracking-tight">{businessDetails?.name || 'Busni'}</div>
                        )}
                        <div className="text-slate-500 font-medium tracking-tight mb-4">ח.פ. {businessDetails?.hp || '512345678'}</div>
                        <div className="text-slate-500">{businessDetails?.address}</div>
                        <div className="text-slate-500">{businessDetails?.phone}</div>
                        <div className="text-slate-500">{businessDetails?.email}</div>
                    </div>

                    {/* Client Info ('לכבוד') */}
                    <div className="text-right border-r-4 border-[#334155] pr-6 mt-12 bg-slate-50/50 p-4 rounded-l-lg w-full">
                        <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">לכבוד</div>
                        <div className="text-2xl font-bold text-slate-900 leading-tight">
                            {data.customerDetails?.name}
                        </div>
                        {data.customerDetails?.company && (
                            <div className="text-slate-500 font-medium mt-1">{data.customerDetails.company}</div>
                        )}
                    </div>
                </div>

                {/* LEFT SIDE: Technical (Date & Invoice Number) - LTR Refinement */}
                <div className="text-left w-1/3 flex flex-col items-start pt-2" dir="ltr">
                    <div className="space-y-4 text-sm font-light text-slate-600 w-full">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 w-full">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">תאריך</span>
                            <span className="font-bold text-slate-800 ml-4">{data.quoteDetails?.date || new Date().toLocaleDateString('he-IL')}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3 w-full">
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">מספר מסמך</span>
                            <span className="font-bold text-slate-800 ml-4">{data.quoteDetails?.number || 'QUO-' + Math.floor(Math.random() * 10000)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* DOCUMENT TITLE */}
            <div className="mb-12 text-center">
                <h1 className="text-6xl font-black text-slate-100/50 tracking-[0.3em] uppercase select-none font-['Assistant']">PROPOSAL</h1>
            </div>

            {/* TABLE */}
            <div className="mb-12">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="border-b border-slate-200">
                            <th className="py-3 font-bold text-slate-400 text-xs w-16">#</th>
                            <th className="py-3 font-bold text-slate-600 text-xs tracking-wider">תיאור</th>
                            <th className="py-3 font-bold text-slate-600 text-xs w-24 text-center tracking-wider">כמות</th>
                            <th className="py-3 font-bold text-slate-600 text-xs w-32 tracking-wider">מחיר יח'</th>
                            <th className="py-3 font-bold text-slate-800 text-xs w-32 tracking-wider">סה"כ</th>
                        </tr>
                    </thead>
                    <tbody className="text-slate-700 text-sm">
                        {data.items?.map((item, idx) => (
                            <tr key={item.id || idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 text-slate-300 font-mono">{(idx + 1).toString().padStart(2, '0')}</td>
                                <td className="py-4 font-medium">{item.description}</td>
                                <td className="py-4 text-center text-slate-500">{item.quantity}</td>
                                <td className="py-4 text-slate-500">{item.unitPrice?.toLocaleString()} ₪</td>
                                <td className="py-4 font-bold text-slate-900">{item.total?.toLocaleString()} ₪</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* TOTALS */}
            <div className="flex justify-end mt-4 mb-20">
                <div className="w-72 bg-slate-50 p-6 rounded border border-slate-100">
                    <div className="flex justify-between mb-2 text-sm text-slate-500">
                        <span>סכום ביניים</span>
                        <span className="font-mono">{data.totals?.subtotal?.toLocaleString()} ₪</span>
                    </div>
                    <div className="flex justify-between mb-2 text-sm text-slate-500">
                        <span>מע"מ (18%)</span>
                        <span className="font-mono">{data.totals?.vat?.toLocaleString()} ₪</span>
                    </div>
                    <div className="border-t border-slate-200 my-3"></div>
                    <div className="flex justify-between text-xl font-bold text-slate-900">
                        <span>סה"כ לתשלום</span>
                        <span>{data.totals?.grandTotal?.toLocaleString()} ₪</span>
                    </div>
                </div>
            </div>

            {/* TERMS & NOTES */}
            <div className="flex-grow mb-16">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">הערות ותנאים</h3>
                <div className="text-sm text-slate-500 leading-relaxed max-w-2xl border-l-2 border-slate-100 pl-4">
                    {data.notes || "תוקף ההצעה 14 יום. התשלום יתבצע עם קבלת החשבונית. המחירים אינם כוללים מע\"מ אלא אם צוין אחרת."}
                </div>
            </div>

            {/* FOOTER / SIGNATURES */}
            <div className="mt-auto pt-12 border-t border-slate-100 flex justify-between items-end">
                <div className="text-center w-48">
                    {signatureUrl ? (
                        <img src={signatureUrl} className="h-16 object-contain mb-3 mx-auto" />
                    ) : (
                        <div className="h-16 w-full mx-auto mb-3 border-b-2 border-slate-200"></div>
                    )}
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">חתימת העסק</div>
                </div>
                <div className="text-center w-48">
                    <div className="h-16 w-full mx-auto mb-3 border border-dashed border-slate-300 rounded bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                        ממתין לחתימה
                    </div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">חתימת הלקוח</div>
                </div>
            </div>

            <div className="text-center mt-12 text-xs text-slate-300 font-mono tracking-widest uppercase">
                {businessDetails?.email || 'GENERATED BY BUSNI'}
            </div>

            {/* WEB ACTIONS */}
            <div className="absolute top-0 -left-20 h-full flex flex-col gap-2 pt-0 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                <button onClick={() => window.print()} className="p-3 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-600" title="Print PDF"><Printer size={20} /></button>
                <button onClick={generateClientLink} className="p-3 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 text-slate-600" title="Link"><CheckSquare size={20} /></button>
            </div>
        </div>
    );
};

// --- INVOICE A4 PREVIEW ---
const InvoiceA4Preview = ({ data, businessDetails, logoUrl, signatureUrl, onGenerate }) => {
    const total = parseFloat(data.price) || 0;
    const amount_before_vat = total / 1.17;
    const vat = total - amount_before_vat;

    return (
        <div className="fixed left-6 top-24 bottom-24 w-[450px] bg-white shadow-2xl border border-slate-200 p-8 flex flex-col font-sans z-[100] animate-in slide-in-from-left-8 duration-500 overflow-y-auto custom-scrollbar" dir="rtl">
            {/* Action Buttons */}
            <div className="absolute top-4 left-4 flex flex-col gap-3 print:hidden">
                <button
                    onClick={() => window.print()}
                    className="w-10 h-10 bg-black text-white rounded-full shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center shrink-0"
                    title="הדפס חשבונית"
                >
                    <Printer size={20} />
                </button>
                <button
                    onClick={() => {
                        const link = window.location.href;
                        navigator.clipboard.writeText(link);
                        alert('לינק הועתק לשיתוף');
                    }}
                    className="w-10 h-10 bg-white border border-black text-black rounded-full shadow-lg hover:bg-slate-50 transition-all flex items-center justify-center shrink-0"
                    title="העתק לינק לשיתוף"
                >
                    <Share size={20} />
                </button>
                <button
                    onClick={onGenerate}
                    className="w-10 h-10 bg-black text-white rounded-full shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center shrink-0"
                    title="צור חשבונית במערכת"
                >
                    <FileCheck size={20} />
                </button>
            </div>

            {/* Header */}
            <div className="flex flex-row-reverse justify-between items-start mb-10 pb-6 border-b border-slate-100">
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-black mb-1">{businessDetails?.name || "חשבונית מס / קבלה"}</h2>
                    <p className="text-xs text-slate-500">ח.פ: {businessDetails?.hp}</p>
                    <p className="text-xs text-slate-500">{businessDetails?.address}</p>
                </div>
                {logoUrl && <img src={logoUrl} className="h-12 object-contain" alt="Logo" />}
            </div>

            <h1 className="text-3xl font-black text-slate-100 mb-8 tracking-widest text-left select-none">INVOICE</h1>

            {/* Client Info */}
            <div className="mb-10">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">לכבוד:</div>
                <p className="text-xl font-bold text-black">{data.clientName || "..."}</p>
                <p className="text-sm text-slate-500 mt-1">ח.פ / ת.ז: {data.clientId || "..."}</p>
            </div>

            {/* Table */}
            <table className="w-full text-right mb-10">
                <thead>
                    <tr className="border-b border-black text-xs uppercase tracking-wider">
                        <th className="py-2 font-bold">תיאור השירות</th>
                        <th className="py-2 font-bold text-left">סה"כ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="border-b border-slate-50">
                        <td className="py-4 text-sm">{data.service || "..."}</td>
                        <td className="py-4 text-sm text-left">{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</td>
                    </tr>
                </tbody>
            </table>

            {/* Totals */}
            <div className="mr-auto w-48 space-y-2 mb-10 pt-4">
                <div className="flex justify-between text-sm text-slate-500">
                    <span>סה"כ לפני מע"מ:</span>
                    <span>{amount_before_vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                    <span>מע"מ (17%):</span>
                    <span>{vat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</span>
                </div>
                <div className="border-t border-black pt-2 flex justify-between text-lg font-bold text-black">
                    <span>סה"כ לתשלום:</span>
                    <span>{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₪</span>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-end">
                <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">חתימת העסק</p>
                    {signatureUrl ? (
                        <img src={signatureUrl} className="h-10 object-contain" />
                    ) : (
                        <div className="h-10 w-24 border-b border-slate-200"></div>
                    )}
                </div>
                <p className="text-[10px] text-slate-300 font-mono">ORIGINAL DOCUMENT</p>
            </div>
        </div>
    );
};

// --- CHAT MESSAGE ---
const ChatMessage = ({ msg, userProfile, onAction }) => {
    const isUser = msg.role === 'user';
    const jsonMatch = msg.content && msg.content.match(/```json_proposal([\s\S]*?)```/);
    const proposalData = jsonMatch ? JSON.parse(jsonMatch[1]) : null;
    const cleanContent = jsonMatch ? msg.content.replace(jsonMatch[0], '').trim() : msg.content;

    return (
        <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'} mb-8 group`}>
            {!isUser && (
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 ml-4 mt-1 shadow-sm">
                    <BusniSparkle size={14} />
                </div>
            )}

            <div className={`max-w-[85%] ${isUser ? 'order-1' : 'order-2'}`}>
                {/* User Bubble */}
                {isUser ? (
                    <div className="bg-[#F1F3F4] text-slate-800 px-5 py-3 rounded-2xl rounded-tr-sm text-base leading-relaxed">
                        {msg.content}
                    </div>
                ) : (
                    // AI Response (Clean Text or Proposal)
                    <div className="text-slate-800 text-base leading-relaxed space-y-4">
                        {proposalData ? (
                            <div className="w-full my-6">
                                <ProposalRenderer
                                    data={proposalData}
                                    logoUrl={userProfile.logo}
                                    signatureUrl={userProfile.signature}
                                    businessDetails={{
                                        name: userProfile.businessName,
                                        hp: userProfile.businessHp,
                                        address: userProfile.businessAddress,
                                        phone: userProfile.businessPhone,
                                        email: userProfile.businessEmail
                                    }}
                                />
                            </div>
                        ) : (
                            <>
                                <ReactMarkdown components={{
                                    p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc pr-5 mb-4 space-y-1" {...props} />,
                                    li: ({ node, ...props }) => <li className="pl-1" {...props} />
                                }}>{cleanContent}</ReactMarkdown>

                                {msg.actions && (
                                    <div className="flex flex-wrap gap-2 mt-4" dir="rtl">
                                        {msg.actions.map((action, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => onAction(action)}
                                                className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- SETUP OVERLAY (Connected to Supabase) ---
const SetupOverlay = ({ userProfile, setUserProfile, onComplete }) => {
    const [step, setStep] = useState(1);
    const [isExiting, setIsExiting] = useState(false);
    const [localProfile, setLocalProfile] = useState(userProfile);
    const [uploading, setUploading] = useState(false);
    const [filesToUpload, setFilesToUpload] = useState({ logo: null, signature: null });

    const handleFileUpload = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLocalProfile(prev => ({ ...prev, [field]: reader.result }));
            reader.readAsDataURL(file);
            setFilesToUpload(prev => ({ ...prev, [field]: file }));
        }
    };

    const handleNext = () => {
        if (step === 1 && localProfile.businessName) setStep(2);
        else if (step === 2 && localProfile.businessPhone) setStep(3);
        else if (step === 3) handleComplete();
    };

    const handleComplete = async () => {
        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            let logoUrl = localProfile.logo;
            let signatureUrl = localProfile.signature;

            if (filesToUpload.logo) {
                const fileName = `${user.id}/logo_${Date.now()}`;
                const { error: uploadError } = await supabase.storage
                    .from('branding')
                    .upload(fileName, filesToUpload.logo);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(fileName);
                    logoUrl = publicUrl;
                }
            }

            if (filesToUpload.signature) {
                const fileName = `${user.id}/signature_${Date.now()}`;
                const { error: uploadError } = await supabase.storage
                    .from('branding')
                    .upload(fileName, filesToUpload.signature);

                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage.from('branding').getPublicUrl(fileName);
                    signatureUrl = publicUrl;
                }
            }

            const updates = {
                user_id: user.id,
                business_name: localProfile.businessName,
                business_hp: localProfile.businessHp,
                business_phone: localProfile.businessPhone,
                business_address: localProfile.businessAddress,
                business_email: localProfile.businessEmail,
                brand_color: localProfile.brandColor,
                logo_url: logoUrl,
                signature_url: signatureUrl,
                updated_at: new Date()
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            setUserProfile({ ...localProfile, logo: logoUrl, signature: signatureUrl });
            setIsExiting(true);
            setTimeout(onComplete, 1000);
        } catch (error) {
            console.error("Setup save failed:", error);
            alert("שגיאה בשמירת הפרטים. נסה שוב.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] bg-[#FBFBF9] flex flex-col items-center justify-center p-6 transition-all duration-1000 ease-in-out ${isExiting ? 'opacity-0 scale-110 blur-xl pointer-events-none' : 'opacity-100 scale-100 blur-0'}`}>
            <div className="w-full max-w-md p-8 text-center animate-in fade-in zoom-in duration-700">
                <div className="mb-8 flex justify-center">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl shadow-slate-100 flex items-center justify-center border border-slate-50">
                        <BusniSparkle size={40} />
                    </div>
                </div>

                <div className="space-y-3 mb-12">
                    <h1 className="text-4xl font-light text-[#1E293B] tracking-tight ">
                        {step === 1 && 'ברוכים הבאים ל-Busni'}
                        {step === 2 && 'פרטים ליצירת קשר'}
                        {step === 3 && 'מיתוג וזהות עסקית'}
                    </h1>
                    <p className="text-slate-400 text-lg font-light ">
                        {step === 1 && 'הבינה המלאכותית שתנהל את העסק שלך.'}
                        {step === 2 && 'כדי שנוכל לעדכן את הלקוחות שלך.'}
                        {step === 3 && 'העלה לוגו וחתימה למסמכים רשמיים.'}
                    </p>
                </div>

                <div className="space-y-6">
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            <input
                                type="text"
                                placeholder="שם העסק שלך"
                                className="w-full h-16 bg-white border border-slate-100 rounded-2xl text-center text-2xl shadow-sm focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all "
                                value={localProfile.businessName}
                                onChange={(e) => setLocalProfile({ ...localProfile, businessName: e.target.value })}
                            />
                            <button onClick={handleNext} disabled={!localProfile.businessName} className="w-full h-16 bg-[#334155] text-white rounded-2xl font-medium  hover:bg-slate-800 transition-all shadow-lg disabled:opacity-50">המשך</button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
                            <input
                                type="tel"
                                placeholder="טלפון עסקי"
                                className="w-full h-16 bg-white border border-slate-100 rounded-2xl text-center text-2xl shadow-sm focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all "
                                value={localProfile.businessPhone}
                                onChange={(e) => setLocalProfile({ ...localProfile, businessPhone: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder='מספר ח"פ / עוסק'
                                className="w-full h-16 bg-white border border-slate-100 rounded-2xl text-center text-2xl shadow-sm focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all "
                                value={localProfile.businessHp}
                                onChange={(e) => setLocalProfile({ ...localProfile, businessHp: e.target.value })}
                            />
                            <input
                                type="text"
                                placeholder="כתובת (אופציונלי)"
                                className="w-full h-16 bg-white border border-slate-100 rounded-2xl text-center text-xl shadow-sm focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all "
                                value={localProfile.businessAddress}
                                onChange={(e) => setLocalProfile({ ...localProfile, businessAddress: e.target.value })}
                            />
                            <button onClick={handleNext} disabled={!localProfile.businessPhone} className="w-full h-16 bg-[#334155] text-white rounded-2xl font-medium  hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">המשך</button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                            <div className="flex gap-6 justify-center">
                                <label className="w-28 h-28 rounded-3xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group overflow-hidden">
                                    {localProfile.logo ? <img src={localProfile.logo} className="w-full h-full object-cover" /> : <><Upload size={24} className="text-slate-400 mb-2 group-hover:scale-110 transition-transform" /><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">לוגו</span></>}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                                </label>
                                <label className="w-28 h-28 rounded-3xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group overflow-hidden">
                                    {localProfile.signature ? <img src={localProfile.signature} className="w-full h-full object-contain" /> : <><Edit size={24} className="text-slate-400 mb-2 group-hover:scale-110 transition-transform" /><span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">חתימה</span></>}
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature')} />
                                </label>
                            </div>
                            <button onClick={handleComplete} disabled={uploading} className="w-full h-16 bg-[#334155] text-white rounded-2xl font-medium  hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-3">
                                {uploading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "סיום והתחלה"}
                            </button>
                            <button onClick={handleComplete} className="w-full text-sm text-slate-400 underline ">דלג בינתיים</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="absolute bottom-12 text-xs text-slate-300 font-mono tracking-widest uppercase">Busni Interface • Reveal Gateway</div>
        </div>
    );
};

// --- AUTH MODALS (UPDATED) ---

const LoginModal = ({ onClose }) => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            alert(error.message);
            setLoading(false);
        } else {
            onClose();
        }
    };

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
        });
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FBFBF9] rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-in zoom-in duration-200 border border-white">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowRight size={20} /> {/* "Back/Exit" icon */}
                </button>

                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">כניסה למערכת</h2>

                <div className="space-y-4">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-3 bg-white border border-slate-200 rounded-xl text-slate-700 tracking-wide hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#94a3b8" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                        כניסה עם Google
                    </button>

                    <div className="flex items-center gap-4 my-6">
                        <div className="h-px bg-slate-200 flex-1"></div>
                        <span className="text-sm text-slate-400">או</span>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm tracking-wide text-slate-700 mb-1">אימייל</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-right focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm tracking-wide text-slate-700 mb-1">סיסמה</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-right focus:ring-2 focus:ring-slate-400 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-[#334155] text-white rounded-xl tracking-wide hover:bg-slate-900 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                        >
                            {loading ? 'מתחבר...' : 'כניסה'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const RegistrationModal = ({ onClose }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Business Info
    const [businessName, setBusinessName] = useState('');
    const [hpNumber, setHpNumber] = useState('');
    const [address, setAddress] = useState('');

    // Step 2: Account
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // 1. Sign Up
            const { data: { user }, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            // 2. Create Profile
            if (user) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        user_id: user.id,
                        business_name: businessName,
                        business_hp: hpNumber,
                        business_address: address,
                    });

                if (profileError) {
                    // Profile creation failed (maybe RLS or trigger issues), but user is created.
                    console.error("Profile creation error:", profileError);
                }
            }

            alert('הרשמה הצליחה! אנא בדוק את המייל לאימות.');
            onClose();

        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                redirectTo: window.location.origin
            }
        });
        // Note: We need to handle the profile creation AFTER callback for Google Auth. 
        // This usually requires a forceful profile check/create on the callback page (ChatInterface mount).
        // Since we are redirecting back to /, ChatInterface will load. 
        // We should save the temp business info to localStorage to pick it up after redirect.
        localStorage.setItem('temp_registration_profile', JSON.stringify({ businessName, businessHp: hpNumber, businessAddress: address, businessEmail: email }));
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FBFBF9] rounded-2xl shadow-xl w-full max-w-md p-8 relative animate-in zoom-in duration-200 border border-white">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowRight size={20} />
                </button>

                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">הרשמה למערכת</h2>

                {step === 1 && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm tracking-wide text-slate-700 mb-1">שם העסק</label>
                            <input
                                value={businessName}
                                onChange={(e) => setBusinessName(e.target.value)}
                                className="w-full p-3 bg-white text-right border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none"
                                placeholder="שם העסק שלך"
                            />
                        </div>
                        <div>
                            <label className="block text-sm tracking-wide text-slate-700 mb-1">מספר ח"פ / עוסק</label>
                            <input
                                value={hpNumber}
                                onChange={(e) => setHpNumber(e.target.value)}
                                className="w-full p-3 bg-white text-right border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none"
                                placeholder="512345678"
                            />
                        </div>
                        <div>
                            <label className="block text-sm tracking-wide text-slate-700 mb-1">כתובת העסק</label>
                            <input
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="w-full p-3 bg-white text-right border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-400 outline-none"
                                placeholder="רחוב, עיר"
                            />
                        </div>
                        <button
                            onClick={() => {
                                if (businessName && hpNumber && address) setStep(2);
                                else alert('אנא מלא את כל הפרטים');
                            }}
                            className="w-full py-3 bg-[#334155] text-white rounded-xl tracking-wide hover:bg-slate-900 transition-all shadow-md mt-4"
                        >
                            המשך לשלב הבא
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <button
                            onClick={handleGoogleSignUp}
                            className="w-full py-3 bg-white border border-slate-200 rounded-xl text-slate-700 tracking-wide hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#94a3b8" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            הרשמה עם Google
                        </button>

                        <div className="flex items-center gap-4 my-6">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-sm text-slate-400">או</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm tracking-wide text-slate-700 mb-1">אימייל</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-right focus:ring-2 focus:ring-slate-400 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm tracking-wide text-slate-700 mb-1">סיסמה</label>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-right focus:ring-2 focus:ring-slate-400 outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-[#334155] text-white rounded-xl tracking-wide hover:bg-slate-900 transition-all shadow-md mt-2"
                            >
                                {loading ? 'יוצר חשבון...' : 'סיום והרשמה'}
                            </button>
                        </form>
                        <button onClick={() => setStep(1)} className="text-slate-400 text-sm hover:text-slate-600 block text-center w-full">חזרה לשלב הקודם</button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN PAGE COMPONENT ---
const ChatInterface = () => {
    // STATE
    const [userProfile, setUserProfile] = useState({
        businessName: '', businessHp: '', businessAddress: '', businessPhone: '', businessEmail: '',
        brandColor: '#334155', logo: null, signature: null
    });
    const [chats, setChats] = useState([]);
    const [documents, setDocuments] = useState([]);

    // Auth State
    const [user, setUser] = useState(null);
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);

    // Auto-show setup if name missing (will check after fetch)
    const [showSetup, setShowSetup] = useState(false);

    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const headerMenuRef = useRef(null);
    const [userName, setUserName] = useState('');
    const messagesEndRef = useRef(null);

    // Invoicing Logic State
    const [isInvoicing, setIsInvoicing] = useState(false);
    const [invoiceData, setInvoiceData] = useState({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        clientId: '',
        clientDbId: null,
        clientReferenceId: null, // Unified reference ID
        service: '',
        price: ''
    });

    const [isSaved, setIsSaved] = useState(false);
    const [savingDoc, setSavingDoc] = useState(false);
    const [invoiceStep, setInvoiceStep] = useState(0);

    // Client Management State
    const [clients, setClients] = useState([]);
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [contactStep, setContactStep] = useState(0);
    const [newContactData, setNewContactData] = useState({
        name: '',
        email: '',
        phone: '',
        taxId: ''
    });

    // ROUTING HOOKS
    const navigate = useNavigate();
    const location = useLocation();
    const { chatId } = useParams();

    // --- ONBOARDING SYNC (From Landing Page) ---
    useEffect(() => {
        const syncRegistrationData = async () => {
            const tempProfileStr = localStorage.getItem('temp_registration_profile');
            if (tempProfileStr) {
                try {
                    const tempProfile = JSON.parse(tempProfileStr);
                    const { data: { user: authUser } } = await supabase.auth.getUser();
                    const user_id = 'b75849f3-1399-4846-84b5-9dadb5b851b4';
                    if (!authUser) return;

                    let logoUrl = null;
                    let signatureUrl = null;

                    // Helper to convert base64 to blob
                    const base64ToBlob = async (base64) => {
                        const res = await fetch(base64);
                        return await res.blob();
                    };

                    // Upload Logo
                    if (tempProfile.logo) {
                        const blob = await base64ToBlob(tempProfile.logo);
                        const fileName = `${user.id}/logo_${Date.now()}`;
                        const { error } = await supabase.storage.from('branding').upload(fileName, blob);
                        if (!error) {
                            const { data } = supabase.storage.from('branding').getPublicUrl(fileName);
                            logoUrl = data.publicUrl;
                        }
                    }

                    // Upload Signature
                    if (tempProfile.signature) {
                        const blob = await base64ToBlob(tempProfile.signature);
                        const fileName = `${user.id}/signature_${Date.now()}`;
                        const { error } = await supabase.storage.from('branding').upload(fileName, blob);
                        if (!error) {
                            const { data } = supabase.storage.from('branding').getPublicUrl(fileName);
                            signatureUrl = data.publicUrl;
                        }
                    }

                    // Upsert Profile
                    await supabase.from('profiles').upsert({
                        user_id: user.id,
                        business_name: tempProfile.businessName,
                        business_hp: tempProfile.businessHp,
                        business_phone: tempProfile.businessPhone,
                        business_address: tempProfile.businessAddress,
                        business_email: tempProfile.businessEmail,
                        logo_url: logoUrl,
                        signature_url: signatureUrl,
                        updated_at: new Date()
                    });

                    // Clear Temp Data
                    localStorage.removeItem('temp_registration_profile');

                    // Refresh Data
                    fetchData();
                    // Assuming toast is imported elsewhere, if not, this will error.
                    // toast.success('החשבון הוגדר בהצלחה!'); 

                } catch (e) {
                    console.error("Sync failed", e);
                }
            }
        };

        syncRegistrationData();
    }, []);

    // --- DATA FETCHING (SUPABASE) ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (!user) {
                // Guest Mode: Clean state, maybe load demo chats if we want, but for now just return
                return;
            }

            // 1. Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (profile) {
                setUserProfile({
                    businessName: profile.business_name || '',
                    businessHp: profile.business_hp || '',
                    businessAddress: profile.business_address || '',
                    businessPhone: profile.business_phone || '',
                    businessEmail: profile.business_email || user.email,
                    brandColor: profile.brand_color || '#334155',
                    logo: profile.logo_url,
                    signature: profile.signature_url
                });
                setUserName(profile.business_name || user.email);
            } else {
                setUserName(user.email);
                // Only show setup if NOT syncing (handled above)
                // But sync removes the item, so if we are here and no profile exists, maybe show setup?
                // Actually, fetchData is called AFTER sync.
                if (!localStorage.getItem('temp_registration_profile')) {
                    setShowSetup(true);
                }
            }

            // 2. Chats (Archive - Order by created_at)
            const { data: chatsData, error: chatsError } = await supabase
                .from('chats')
                .select('*')
                .eq('user_id', 'b75849f3-1399-4846-84b5-9dadb5b851b4')
                .order('created_at', { ascending: false });

            if (chatsError) {
                console.dir(chatsError);
                console.error('Error fetching chats:', chatsError);
            } else if (chatsData) {
                setChats(chatsData);
            }

            // 3. Invoices (Sidebar Archive - Order by created_at)
            const { data: invData, error: invError } = await supabase
                .from('invoices')
                .select('*')
                .eq('user_id', 'b75849f3-1399-4846-84b5-9dadb5b851b4')
                .order('created_at', { ascending: false });

            if (invError) {
                console.dir(invError);
                console.error('Error fetching invoices:', invError);
            } else if (invData) {
                setDocuments(invData.map(d => ({
                    id: d.id,
                    title: d.client_name || 'מסמך חדש',
                    date: new Date(d.created_at).toLocaleDateString('he-IL'),
                    type: d.document_type || 'חשבונית מס',
                    data: d
                })));
            }

            // 4. Clients
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', 'b75849f3-1399-4846-84b5-9dadb5b851b4')
                .order('full_name', { ascending: true });

            if (clientsError) {
                console.error('Error fetching clients:', clientsError);
            } else if (clientsData) {
                setClients(clientsData);
            }
        } catch (error) {
            console.error('Critical error in fetchData:', error);
            if (error.message?.includes('Failed to fetch')) {
                console.warn('Network error: Could not reach Supabase. Working in offline mode.');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- PERSISTENCE & ROUTING EFFECTS ---

    // 1. URL SYNC: Update view based on URL
    useEffect(() => {
        setMessages([]); // Clear immediately to prevent ghosting
        if (chatId) {
            fetchMessages(chatId);
        } else {
            setLoading(false);
        }
    }, [chatId]);

    const fetchMessages = async (id) => {
        try {
            setLoading(true);
            const { data: msgs, error } = await supabase
                .from('messages')
                .select('id, role, content, created_at')
                .eq('chat_id', id)
                .order('created_at', { ascending: true });

            if (error) {
                console.dir(error);
                console.error("Error fetching messages:", error);
                console.warn("Fetch messages error (non-blocking):", error);
            } else if (msgs) {
                setMessages(msgs.map(m => ({ id: m.id, role: m.role, content: m.content })));
            }
        } catch (error) {
            console.error("Critical error in fetchMessages:", error);
            console.warn("Network error fetching messages (non-blocking):", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. DRAFT RESTORE: Load draft from Session Storage on mount
    useEffect(() => {
        const savedDraft = sessionStorage.getItem('busni_draft_input');
        if (savedDraft) setInput(savedDraft);
    }, []);

    // 3. DRAFT SAVE: Save input to Session Storage on change
    useEffect(() => {
        sessionStorage.setItem('busni_draft_input', input);
    }, [input]);


    // EFFECTS
    useEffect(() => {
        const handleOpenLogin = () => setShowLogin(true);
        const handleOpenRegister = () => setShowRegister(true);
        const handleOpenProfile = () => setShowProfileModal(true);

        window.addEventListener('open-login', handleOpenLogin);
        window.addEventListener('open-register', handleOpenRegister);
        window.addEventListener('open-profile', handleOpenProfile);

        const handleClickOutside = (event) => {
            if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
                setShowHeaderMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('open-login', handleOpenLogin);
            window.removeEventListener('open-register', handleOpenRegister);
            window.removeEventListener('open-profile', handleOpenProfile);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);


    const handleGenerateInvoice = async () => {
        try {
            const client_name = invoiceData.clientName;
            // Strict numeric sanitization
            const rawPrice = String(invoiceData.price).replace(/[^\d.-]/g, '');
            const total_amount = Number(parseFloat(rawPrice)) || 0;

            const amount_before_vat = Number(parseFloat((total_amount / 1.17).toFixed(2)));
            const vat_amount = Number(parseFloat((total_amount - amount_before_vat).toFixed(2)));

            const user_id = 'b75849f3-1399-4846-84b5-9dadb5b851b4';
            const document_type = "חשבונית מס";

            // Robust CSV stringification
            const csvString = `Date,Client,Subtotal,VAT,Total\n${new Date().toLocaleDateString()},"${client_name}",${amount_before_vat},${vat_amount},${total_amount}`;

            setSavingDoc(true);

            const { data, error } = await supabase
                .from('invoices')
                .insert([{
                    client_name: client_name,
                    client_id: invoiceData.clientId,
                    service_description: invoiceData.service,
                    total_amount: total_amount,
                    document_type: document_type,
                    status: "sent",
                    csv_data: csvString,
                    user_id: user_id
                }])
                .select();

            if (error) {
                console.error("Supabase Save Error (400 Diagnosis):", error);
                if (error.message?.includes('Failed to fetch')) {
                    window.alert("שגיאת רשת: לא ניתן להתחבר לשרת. בדוק את חיבור האינטרנט.");
                } else {
                    window.alert("שגיאה בשמירת המסמך: " + (error.message || "שגיאה לא ידועה"));
                }
            } else {
                console.log("Invoice integrated successfully:", data);
                setIsSaved(true);
                window.dispatchEvent(new CustomEvent('sidebar-refresh'));
                if (typeof fetchData === 'function') fetchData();
            }
        } catch (err) {
            console.error("Critical System Failure in handleGenerateInvoice:", err);
            window.alert("תקלה מערכתית קריטית. הפעולה בוטלה.");
        } finally {
            setSavingDoc(false);
        }
    };

    const handleAction = (action) => {
        if (action.type === 'SELECT_CLIENT') {
            if (action.value === 'NEW') {
                setIsAddingContact(true);
                setContactStep(1);
                const aiMsg = { id: 'ai-' + Date.now(), role: 'model', content: 'מה השם המלא של הלקוח או החברה?' };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                const client = action.value;
                setInvoiceData(prev => ({
                    ...prev,
                    clientName: client.full_name,
                    clientEmail: client.email || '',
                    clientPhone: client.phone || '',
                    clientId: client.tax_id,
                    clientReferenceId: client.id
                }));
                setInvoiceStep(5); // Skip to Service
                const aiMsg = { id: 'ai-' + Date.now(), role: 'model', content: `עבור איזה שירות המסמך?` };
                setMessages(prev => [...prev, aiMsg]);
            }
        }
    };

    const handleSend = async (text = input) => {
        if (!text.trim()) return;

        try {

            // --- CONTACT MANAGEMENT TRIGGERS ---
            if (text === 'תוסיף לקוח') {
                const userMsg = { id: Date.now().toString(), role: 'user', content: text };
                setMessages(prev => [...prev, userMsg]);
                setInput('');
                setIsAddingContact(true);
                setContactStep(1);
                setNewContactData({ name: '', email: '', phone: '', taxId: '' });
                const aiMsg = { id: 'ai-' + Date.now(), role: 'model', content: 'מה השם המלא של הלקוח או החברה?' };
                setMessages(prev => [...prev, aiMsg]);
                return;
            }

            // --- INVOICING/QUOTE TRIGGERS ---
            if (!isInvoicing && (text.toLowerCase().includes('invoice') || text.includes('חשבונית') || text.includes('הצעת מחיר') || text.toLowerCase().includes('quote'))) {
                const userMsg = { id: Date.now().toString(), role: 'user', content: text };
                setMessages(prev => [...prev, userMsg]);
                setInput('');
                setIsInvoicing(true);
                setInvoiceStep(1);
                setInvoiceData({ clientName: '', clientId: '', service: '', price: '' });

                const clientActions = [
                    ...clients.map(c => ({ label: c.full_name, type: 'SELECT_CLIENT', value: c })),
                    { label: '+ הוסף לקוח חדש', type: 'SELECT_CLIENT', value: 'NEW' }
                ];

                const aiMsg = {
                    id: 'ai-' + Date.now(),
                    role: 'model',
                    content: 'בשמחה. בוא נתחיל - בחר לקוח מהרשימה או הוסף לקוח חדש:',
                    actions: clientActions
                };
                setMessages(prev => [...prev, aiMsg]);
                return;
            }

            // --- ADD CONTACT FLOW ---
            if (isAddingContact) {
                const userMsg = { id: Date.now().toString(), role: 'user', content: text };
                setMessages(prev => [...prev, userMsg]);
                setInput('');

                if (contactStep === 1) {
                    setNewContactData(prev => ({ ...prev, name: text }));
                    setContactStep(2);
                    const aiMsg = { id: 'ai-' + Date.now(), role: 'model', content: 'מה האימייל?' };
                    setMessages(prev => [...prev, aiMsg]);
                } else if (contactStep === 2) {
                    setNewContactData(prev => ({ ...prev, email: text }));
                    setContactStep(3);
                    const aiMsg = { id: 'ai-' + Date.now(), role: 'model', content: 'מה מספר הטלפון?' };
                    setMessages(prev => [...prev, aiMsg]);
                } else if (contactStep === 3) {
                    const finalContact = { ...newContactData, phone: text };
                    setNewContactData(finalContact);

                    try {
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;
                        const { data: newClient, error } = await supabase.from('clients').insert([{
                            user_id: user.id,
                            full_name: finalContact.name,
                            email: finalContact.email,
                            phone: finalContact.phone,
                            tax_id: finalContact.taxId || null
                        }]).select().single();
                        if (error) throw error;

                        setClients(prev => [...prev, newClient]);

                        if (isInvoicing) {
                            setInvoiceData(prev => ({
                                ...prev,
                                clientName: finalContact.name,
                                clientEmail: finalContact.email,
                                clientPhone: finalContact.phone,
                                clientId: finalContact.taxId || '',
                                clientReferenceId: newClient.id
                            }));
                            setInvoiceStep(5);
                            const aiMsg = { id: 'ai-' + Date.now(), role: 'model', content: `הלקוח נשמר בהצלחה. עכשיו, עבור איזה **שירות** המסמך?` };
                            setMessages(prev => [...prev, aiMsg]);
                        } else {
                            const aiMsg = { id: 'ai-' + Date.now(), role: 'model', content: 'הלקוח נשמר בהצלחה.' };
                            setMessages(prev => [...prev, aiMsg]);
                        }
                    } catch (e) {
                        console.error(e);
                        const aiMsg = { id: 'ai-' + Date.now(), role: 'model', content: 'שגיאה בשמירת הלקוח. נסה שוב.' };
                        setMessages(prev => [...prev, aiMsg]);
                    }
                    setIsAddingContact(false);
                    setContactStep(0);
                }
                return;
            }

            // --- INVOICING FLOW (POST-CLIENT SELECT) ---
            if (isInvoicing) {
                const userMsg = { id: Date.now().toString(), role: 'user', content: text };
                setMessages(prev => [...prev, userMsg]);
                setInput('');

                let nextContent = '';
                if (invoiceStep === 5) {
                    setInvoiceData(prev => ({ ...prev, service: text }));
                    setInvoiceStep(6);
                    nextContent = 'שאלה אחרונה - מהו **המחיר** (לפני מע"מ)?';
                } else if (invoiceStep === 6) {
                    setInvoiceData(prev => ({ ...prev, price: text }));
                    setInvoiceStep(7);
                    nextContent = 'המסמך מוכן! תוכל לראות את התצוגה המקדימה במסמך ה-A4 שנפתח.';
                } else {
                    setIsInvoicing(false);
                    setInvoiceStep(0);
                    return;
                }

                const aiMsg = { id: 'ai-' + Date.now(), role: 'model', content: nextContent };
                setMessages(prev => [...prev, aiMsg]);
                return;
            }

            // --- NORMAL AI FLOW ---
            const userMsg = { id: Date.now().toString(), role: 'user', content: text };
            setMessages(prev => [...prev, userMsg]);
            setInput('');
            setLoading(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // Create Chat if needed (first message)
            let currentChatId = chatId;
            if (!currentChatId) {
                const { data: newChat, error: chatError } = await supabase
                    .from('chats')
                    .insert([{
                        user_id: 'b75849f3-1399-4846-84b5-9dadb5b851b4',
                        title: text.substring(0, 30) + '...' // Simple title generation
                    }])
                    .select('chat_id')
                    .single();

                if (chatError) throw chatError;
                currentChatId = newChat.chat_id;

                // Update URL without full refresh/nav if possible, or just push to history
                // effectively we are now "in" this chat
                // window.history.pushState({}, '', `/chat/${currentChatId}`); 
                // Better to navigate to ensure URL param syncs correctly with router
                navigate(`/chat/${currentChatId}`, { replace: true });

                // Update Sidebar List
                setChats(prev => [newChat, ...prev]);
                window.dispatchEvent(new CustomEvent('sidebar-refresh'));
            }

            // Save User Message
            await supabase.from('messages').insert({
                chat_id: currentChatId,
                user_id: 'b75849f3-1399-4846-84b5-9dadb5b851b4',
                content: text,
                role: 'user'
            });

            const assetContext = `
            [SYSTEM: User Environment]
            - Has Logo: ${userProfile.logo ? 'YES' : 'NO'}
            - Has Signature: ${userProfile.signature ? 'YES' : 'NO'}
            - Brand Color: ${userProfile.brandColor}
            - Current Date: ${new Date().toLocaleDateString('he-IL')}
    
            Instruction: If the user asks for a formal document, assume A4 layout and use their details.
            `;
            const fullPrompt = `${assetContext}\n\nUser Query: ${text}`;

            const aiResponseText = await runBusniAI(fullPrompt, userProfile);
            setMessages(prev => [...prev, { id: 'ai-' + Date.now().toString(), role: 'model', content: aiResponseText }]);

            // Save AI Message
            await supabase.from('messages').insert({
                chat_id: currentChatId,
                user_id: 'b75849f3-1399-4846-84b5-9dadb5b851b4',
                content: aiResponseText,
                role: 'model'
            });

            // Integration: Check for Proposal JSON and add to Archive
            const jsonMatch = aiResponseText.match(/```json_proposal([\s\S]*?)```/);
            if (jsonMatch) {
                try {
                    const data = JSON.parse(jsonMatch[1]);
                    const docType = 'הצעות מחיר'; // Should infer from content or AI flag

                    const { data: newDoc, error: docError } = await supabase
                        .from('invoices')
                        .insert({
                            user_id: 'b75849f3-1399-4846-84b5-9dadb5b851b4',
                            client_name: data.customerDetails?.name,
                            total_amount: data.customerDetails?.totalPrice || data.totalPrice || 0,
                            document_type: docType,
                            status: "sent",
                            csv_data: `Date,Client,Total\n${new Date().toLocaleDateString()},"${data.customerDetails?.name}",${data.customerDetails?.totalPrice || 0}`
                        })
                        .select()
                        .single();

                    if (!docError && newDoc) {
                        setDocuments(prev => [{
                            id: newDoc.id,
                            title: newDoc.full_name || 'מסמך חדש',
                            date: new Date(newDoc.created_at).toLocaleDateString('he-IL'),
                            type: newDoc.document_type,
                            data: newDoc
                        }, ...prev]);
                    }
                } catch (e) { console.error("Failed to parse/save proposal", e); }
            }
        } catch (error) {
            console.error("Critical Chat Error:", error);
            console.warn("Chat send error (non-blocking):", error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const handleModalUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${field}_${Date.now()}.${fileExt}`;
            const bucket = 'branding';

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            // Update State
            setUserProfile(prev => ({ ...prev, [field]: publicUrl }));

            // Update DB immediately
            await supabase.from('profiles').upsert({
                user_id: user.id,
                [field === 'logo' ? 'logo_url' : 'signature_url']: publicUrl
            });

        } catch (error) {
            console.error('Upload failed:', error);
            alert('שגיאה בהעלאת קובץ');
        }
    };

    const getInitials = () => (userProfile.businessName || userName || 'B').substring(0, 2).toUpperCase();

    // CENTERING LOGIC
    // If we have a chatId (loading or loaded), we shouldn't center the input even if messages are empty initially.
    const isCentered = !chatId && messages.length === 0; // Updated: Replaced existing line

    return (
        <div className="flex h-screen w-full bg-white font-sans text-slate-800 overflow-hidden relative" dir="rtl">

            {isInvoicing && (
                <div className="relative h-full">
                    <InvoiceA4Preview
                        data={{
                            clientName: invoiceData.clientName,
                            price: invoiceData.price,
                            service: invoiceData.service,
                            clientId: invoiceData.clientId
                        }}
                        logoUrl={userProfile.logo}
                        signatureUrl={userProfile.signature}
                        businessDetails={{
                            name: userProfile.businessName,
                            hp: userProfile.businessHp,
                            address: userProfile.businessAddress
                        }}
                        onGenerate={handleGenerateInvoice}
                    />

                    {savingDoc && (
                        <div className="absolute inset-0 z-[110] bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
                            <div className="w-12 h-12 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin mb-4" />
                            <p className="text-xl font-bold text-slate-900">שומר מסמך...</p>
                        </div>
                    )}

                    {isSaved && (
                        <div className="absolute inset-0 z-[110] bg-white/98 backdrop-blur-2xl flex flex-col items-center justify-center animate-in zoom-in duration-500 overflow-hidden">
                            {/* Texture Overlay */}
                            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />

                            <div className="w-24 h-24 rounded-full bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-center mb-8 animate-bounce">
                                <FileCheck size={48} className="text-slate-800" />
                            </div>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-4 z-10">המסמך נשמר בארכיון!</h2>
                            <p className="text-slate-400 font-bold mb-10 text-xl z-10">הכל מסונכרן ומוכן ב-MyFiles.</p>

                            <div className="flex flex-col items-center gap-6 z-10">
                                <button
                                    onClick={() => {
                                        setIsInvoicing(false);
                                        setIsSaved(false);
                                        navigate('/my-files');
                                    }}
                                    className="px-10 py-5 bg-white text-slate-800 border border-slate-100 rounded-full font-black text-lg shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.08)] transition-all flex items-center gap-4 hover:scale-105 active:scale-95"
                                >
                                    צפה במסמך ב-MyFiles
                                    <ArrowLeft size={24} />
                                </button>

                                <button
                                    onClick={() => {
                                        setIsInvoicing(false);
                                        setIsSaved(false);
                                        setMessages(prev => [...prev, { role: 'model', content: 'המסמך נשמר. איך עוד אוכל לעזור?' }]);
                                    }}
                                    className="text-slate-400 font-bold hover:text-slate-600 transition-colors uppercase tracking-widest text-sm"
                                >
                                    חזור לצ׳אט
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {showSetup && (
                <SetupOverlay
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                    onComplete={() => setShowSetup(false)}
                />
            )}

            {/* CONTENT CANVAS */}
            <main className="flex-1 h-full overflow-hidden flex flex-col relative bg-white">
                <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth pt-16">
                    <div className="max-w-[800px] mx-auto px-6 py-12 pt-12 min-h-screen flex flex-col">
                        {isCentered ? (
                            <div className="flex-1 w-full" /> // Placeholder for Mega-Capsule
                        ) : (
                            <div className="space-y-6 pb-40 animate-in fade-in slide-in-from-bottom-8 duration-700">
                                {messages.map((msg, i) => (
                                    <ChatMessage key={msg.id || i} msg={msg} userProfile={userProfile} onAction={handleAction} />
                                ))}
                                {loading && (
                                    <div className="flex items-center gap-3 text-slate-500 text-sm animate-pulse mr-4">
                                        <BusniSparkle size={14} />
                                        <span>טוען שיחה...</span>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>
                </div>

                {/* MEGA-CAPSULE (Integrated Unit) */}
                <div className={`
                    absolute left-0 right-0 px-4 z-50 flex flex-col items-center transition-all duration-700 ease-in-out
                    ${isCentered ? 'top-1/2 -translate-y-1/2' : 'bottom-8'}
                `}>
                    <div className={`
                        w-full max-w-[850px] transition-all duration-700 ease-in-out flex flex-col items-center gap-12
                        bg-transparent p-0
                    `}>

                        {isCentered && (
                            <div className="w-full text-center space-y-4 animate-in fade-in zoom-in duration-1000">
                                <h1 className="text-5xl font-black text-slate-800 tracking-tight">
                                    איך נוכל לעזור היום?
                                </h1>
                                <p className="text-2xl text-slate-400 font-medium tracking-wide">
                                    Busni • כלי העבודה העסקי החכם שלך
                                </p>
                            </div>
                        )}

                        <div className="w-full relative">
                            <InputCapsule
                                input={input}
                                setInput={setInput}
                                handleSend={() => handleSend()}
                                loading={loading}
                                onPlusClick={() => { }}
                            />
                        </div>

                        {isCentered && (
                            <div className="w-full text-center animate-in fade-in zoom-in duration-1000">
                                {/* Integrated Action Chips */}
                                <div className="flex flex-row-reverse flex-wrap items-center justify-center gap-4">
                                    <button
                                        onClick={() => setInput('הצעת מחיר')}
                                        className="px-8 py-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all text-[15px] font-bold text-slate-600 flex items-center gap-3 shadow-sm hover:shadow-md"
                                    >
                                        <FileText size={20} className="text-slate-400" />
                                        הצעת מחיר
                                    </button>
                                    <button
                                        onClick={() => setInput('חשבונית ירוקה')}
                                        className="px-8 py-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all text-[15px] font-bold text-slate-600 flex items-center gap-3 shadow-sm hover:shadow-md"
                                    >
                                        <TrendingUp size={20} className="text-slate-400" />
                                        חשבונית ירוקה
                                    </button>
                                    <button
                                        onClick={() => setInput('מסמך חדש')}
                                        className="px-8 py-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all text-[15px] font-bold text-slate-600 flex items-center gap-3 shadow-sm hover:shadow-md"
                                    >
                                        <Plus size={20} className="text-slate-400" />
                                        מסמך חדש
                                    </button>
                                    <button
                                        onClick={() => setInput('סיכום')}
                                        className="px-8 py-4 rounded-full border border-slate-200 bg-white hover:bg-slate-50 transition-all text-[15px] font-bold text-slate-600 flex items-center gap-3 shadow-sm hover:shadow-md"
                                    >
                                        <MessageSquare size={20} className="text-slate-400" />
                                        סיכום
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Footer Text (Inside pill when centered) */}
                        {isCentered && (
                            <div className="mt-4 text-[12px] text-slate-400 font-bold uppercase tracking-[0.2em] opacity-50">
                                Busni Intelligence System • חוויית בינה עסקית מתקדמת
                            </div>
                        )}
                    </div>
                </div>


            </main>

            {/* MODALS */}
            {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
            {showRegister && <RegistrationModal onClose={() => setShowRegister(false)} />}

            {showProfileModal && (
                <div className="fixed inset-0 z-[60] bg-slate-100/20 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                            <h2 className="text-xl font-bold text-[#334155]">פרופיל עסקי</h2>
                            <button onClick={() => setShowProfileModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-400" /></button>
                        </div>
                        <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar px-2">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">לוגו העסק</label>
                                    <label className="cursor-pointer h-24 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors relative overflow-hidden group">
                                        {userProfile.logo ? <img src={userProfile.logo} className="w-full h-full object-cover" /> : <Upload size={20} className="text-slate-400 group-hover:scale-110 transition-transform" />}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleModalUpload(e, 'logo')} />
                                    </label>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">חתימה דיגיטלית</label>
                                    <label className="cursor-pointer h-24 rounded-lg bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center hover:bg-slate-100 transition-colors relative overflow-hidden group">
                                        {userProfile.signature ? <img src={userProfile.signature} className="w-full h-full object-contain" /> : <Upload size={20} className="text-slate-400 group-hover:scale-110 transition-transform" />}
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleModalUpload(e, 'signature')} />
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">שם העסק</label>
                                <input value={userProfile.businessName} onChange={e => setUserProfile({ ...userProfile, businessName: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-right focus:ring-1 focus:ring-slate-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">מספר ח"פ / עוסק</label>
                                <input value={userProfile.businessHp} onChange={e => setUserProfile({ ...userProfile, businessHp: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-right focus:ring-1 focus:ring-slate-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">כתובת</label>
                                <input value={userProfile.businessAddress} onChange={e => setUserProfile({ ...userProfile, businessAddress: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-right focus:ring-1 focus:ring-slate-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">טלפון</label>
                                <input value={userProfile.businessPhone} onChange={e => setUserProfile({ ...userProfile, businessPhone: e.target.value })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-right focus:ring-1 focus:ring-slate-400 outline-none transition-all" />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setShowProfileModal(false)} className="flex-1 py-3 bg-[#334155] text-white rounded-xl font-medium hover:bg-slate-900 transition-all shadow-md">שמור שינויים</button>
                                <button onClick={handleLogout} className="px-4 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition-all flex items-center justify-center gap-2" title="התנתק">
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
