import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Phone, MapPin, Globe, CreditCard, Calendar, FileText, CheckCircle, Lock } from 'lucide-react';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS' }).format(amount || 0);
};

const formatProposalId = (num) => {
    if (!num) return '#0000';
    return `#${String(num).padStart(4, '0')}`;
};

const ProposalTemplate = ({ data, design = {}, items = [], previewMode = false }) => {
    // State for Signed URLs
    const [validSignatureUrl, setValidSignatureUrl] = useState(null);
    const [validClientSignatureUrl, setValidClientSignatureUrl] = useState(null);

    // Fetch Signed URLs for Signatures (Security)
    useEffect(() => {
        const fetchSignatures = async () => {
            // Helper: Extract clean path
            const getCleanPath = (urlOrPath) => {
                if (!urlOrPath) return null;
                // If blob or base64, return as is (don't sign)
                if (urlOrPath.startsWith('blob:') || urlOrPath.includes('base64')) return null;

                // Strip full Supabase URL if present
                if (urlOrPath.startsWith('http')) {
                    if (urlOrPath.includes('/signatures/')) {
                        return urlOrPath.split('/signatures/')[1];
                    }
                    // Fallback for other buckets if needed
                    const url = new URL(urlOrPath);
                    const pathParts = url.pathname.split('/');
                    // assuming structure /storage/v1/object/public/bucket/folder/file
                    // we want folder/file. 
                    // Simplest: just take last 2 parts if we know it's folder/file
                    return pathParts.slice(-2).join('/');
                }
                // Already a path? clean query params
                return urlOrPath.split('?')[0];
            };

            // 1. Provider Signature
            if (data?.signature) {
                if (data.signature.startsWith('blob:') || data.signature.includes('base64')) {
                    setValidSignatureUrl(data.signature);
                } else {
                    const path = getCleanPath(data.signature);
                    if (path) {
                        const { data: signedData } = await supabase.storage
                            .from('signatures')
                            .createSignedUrl(path, 60);
                        if (signedData?.signedUrl) setValidSignatureUrl(signedData.signedUrl);
                        else setValidSignatureUrl(data.signature); // Fallback
                    } else {
                        setValidSignatureUrl(data.signature);
                    }
                }
            } else {
                setValidSignatureUrl(null);
            }

            // 2. Client Signature
            if (data?.clientSignature) {
                if (data.clientSignature.startsWith('blob:') || data.clientSignature.includes('base64')) {
                    setValidClientSignatureUrl(data.clientSignature);
                } else {
                    const path = getCleanPath(data.clientSignature);
                    if (path) {
                        const { data: signedData } = await supabase.storage
                            .from('signatures')
                            .createSignedUrl(path, 60);
                        if (signedData?.signedUrl) setValidClientSignatureUrl(signedData.signedUrl);
                        else setValidClientSignatureUrl(data.clientSignature);
                    } else {
                        setValidClientSignatureUrl(data.clientSignature);
                    }
                }
            } else {
                setValidClientSignatureUrl(null);
            }
        };

        fetchSignatures();
    }, [data.signature, data.clientSignature]);

    // CALCULATIONS
    const subtotal = items.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0);
    const taxRate = 0.17;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // DYNAMIC STYLES - STRICT NO GOLD POLICY
    const containerStyle = {
        fontFamily: design.fontFamily || 'Heebo',
        backgroundColor: design.paperColor || '#FDFDFD',
        color: '#1A1A1A', // Force Black/Dark Gray
    };

    const accentColor = '#000000'; // STRICTLY BLACK
    const textColor = '#1A1A1A';

    return (
        <div
            id="proposal-canvas"
            className="w-[794px] min-h-[1123px] shadow-2xl mx-auto flex flex-col relative overflow-hidden bg-white"
            style={containerStyle}
            dir="rtl"
        >
            {/* DECORATIVE TOP STRIP - Minimal Black */}
            <div className="h-2 w-full bg-black"></div>

            <div className="flex-1 p-16 flex flex-col">

                {/* --- LETTERHEAD --- */}
                {(!design.layoutType || design.layoutType === 'classic') && (
                    <div className="flex justify-between items-start mb-12">
                        <div>
                            {data.logo ? (
                                <img src={data.logo} alt="Logo" className="h-16 object-contain mb-4" />
                            ) : (
                                <div className="h-16 w-32 bg-gray-50 flex items-center justify-center text-xs text-gray-300 font-bold tracking-widest border border-dashed border-gray-200">לוגו עסק</div>
                            )}
                            <h2 className="font-black text-2xl tracking-tight text-black">
                                {data.businessName || 'שם העסק שלך'}
                            </h2>
                            <div className="text-sm opacity-60 mt-1 font-medium space-y-0.5 text-black">
                                <p>{data.businessAddress || 'כתובת העסק'}</p>
                                <p>{(data.businessEmail || data.businessPhone) ? `${data.businessEmail} • ${data.businessPhone}` : 'אימייל • טלפון'}</p>
                            </div>
                        </div>

                        <div className="text-left">
                            <h1 className="text-5xl font-black uppercase tracking-tighter text-gray-100">PROPOSAL</h1>
                            <div className="mt-2 text-right">
                                <p className="text-xs font-bold opacity-40 uppercase tracking-wider text-black">לכבוד:</p>
                                <h3 className="font-bold text-xl text-black">
                                    {data.clientName || 'שם הלקוח'}
                                </h3>
                                <p className="text-sm opacity-50 text-black">{data.clientEmail || 'אימייל לקוח'}</p>
                            </div>
                            <div className="mt-6 text-right">
                                <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-end">
                                    <div>
                                        <div className="h-16 mb-2 flex items-end">
                                            {validSignatureUrl ? (
                                                <img src={validSignatureUrl} alt="Signature" className="h-12 object-contain" />
                                            ) : (
                                                /* Loading or Missing */
                                                data.signature ? (
                                                    <div className="h-12 flex items-center gap-2 text-[#D4AF37] opacity-50 animate-pulse">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">טוען חתימה...</span>
                                                    </div>
                                                ) : (
                                                    <div className="h-12 flex items-center gap-2 text-[#D4AF37] opacity-50">
                                                        <span className="text-xs font-bold uppercase tracking-wider">נחתם דיגיטלית</span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-gray-400">חתימת העסק</p>
                                    </div>
                                    <div className="text-left">
                                        <div className="h-16 mb-2 flex items-end justify-end">
                                            {validClientSignatureUrl ? (
                                                <img src={validClientSignatureUrl} alt="Client Signature" className="h-12 object-contain" />
                                            ) : (
                                                /* Locked/Missing/Loading */
                                                data.clientSignature ? (
                                                    <div className="h-12 flex items-center gap-2 text-[#D4AF37] bg-[#D4AF37]/5 px-3 py-1 rounded-lg border border-[#D4AF37]/20 animate-pulse">
                                                        <Lock className="w-4 h-4" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">מאמת חתימה...</span>
                                                    </div>
                                                ) : (
                                                    <div className="h-12 flex items-center gap-2 text-[#D4AF37] bg-[#D4AF37]/5 px-3 py-1 rounded-lg border border-[#D4AF37]/20">
                                                        <Lock className="w-4 h-4" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">חתימה מאובטחת</span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                        <p className="text-xs font-bold text-gray-400">חתימת הלקוח</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-6 text-sm">
                                    <div>
                                        <span className="block text-[10px] font-bold opacity-40 uppercase text-black">תאריך</span>
                                        <span className="font-bold text-black">{data.date ? new Date(data.date).toLocaleDateString('he-IL') : '-'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-[10px] font-bold opacity-40 uppercase text-black">מס' הצעה</span>
                                        <span className="font-bold font-mono text-[#D4AF37] text-xl tracking-wider">
                                            {formatProposalId(data.serialNumber)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {design.layoutType === 'centered' && (
                    <div className="flex flex-col items-center text-center mb-16">
                        {data.logo ? (
                            <img src={data.logo} alt="Logo" className="h-20 object-contain mb-6" />
                        ) : (
                            <div className="h-16 w-32 bg-gray-50 flex items-center justify-center text-xs text-gray-300 font-bold tracking-widest border border-dashed border-gray-200 mb-6">לוגו עסק</div>
                        )}
                        <h1 className="text-4xl font-black uppercase tracking-widest mb-2 text-black">PROPOSAL</h1>
                        <h2 className="text-xl font-bold opacity-80 mb-6 text-black">
                            {data.businessName || 'שם העסק שלך'}
                        </h2>

                        <div className="w-24 h-1 bg-gray-100 rounded-full mb-8"></div>

                        <div className="bg-gray-50 px-10 py-6 rounded-2xl border border-gray-100">
                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-2 text-black">מוגש עבור</p>
                            <h3 className="font-black text-2xl mb-1 text-black">{data.clientName || 'שם הלקוח'}</h3>
                            <p className="opacity-60 text-sm text-black">{data.clientEmail}</p>

                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <span className="font-bold font-mono text-[#D4AF37]">
                                    {data.serialNumber ? `#${String(data.serialNumber).padStart(4, '0')}` : (data.proposalNumber || '---')}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {design.layoutType === 'modern' && (
                    <div className="grid grid-cols-12 gap-8 mb-16">
                        <div className="col-span-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            {data.logo ? (
                                <img src={data.logo} alt="Logo" className="h-12 object-contain mb-4" />
                            ) : (
                                <div className="h-12 w-24 bg-white flex items-center justify-center text-[10px] text-gray-300 font-bold tracking-widest border border-dashed border-gray-200 mb-4">לוגו</div>
                            )}
                            <h3 className="font-bold text-lg mb-4 text-black">{data.businessName || 'העסק שלך'}</h3>
                            <div className="text-xs opacity-70 space-y-2 text-black">
                                <p>{data.businessAddress}</p>
                                <p>{data.businessEmail}</p>
                                <p>{data.businessPhone}</p>
                            </div>
                        </div>

                        <div className="col-span-8 flex flex-col justify-center">
                            <h1 className="text-6xl font-black opacity-10 uppercase tracking-tighter mb-4 text-black">PROPOSAL</h1>
                            <div>
                                <h2 className="text-3xl font-black mb-2 text-black">{data.clientName || 'לכבוד הלקוח'}</h2>
                                <p className="text-lg opacity-60 text-black">
                                    {data.serialNumber ? (
                                        <span className="text-[#D4AF37] font-bold">הצעה #{String(data.serialNumber).padStart(4, '0')}</span>
                                    ) : (
                                        data.proposalNumber ? `הצעה מספר #${data.proposalNumber}` : 'הצעת מחיר'
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- EXECUTIVE SUMMARY --- */}
                <div className="mb-12">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4 border-b border-black/10 pb-2 text-black">תקציר מנהלים</h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap opacity-80 text-black">
                        {data.terms || 'הזן תקציר או תנאים כלליים להצעה זו...'}
                    </p>
                </div>

                {/* --- LINE ITEMS TABLE --- */}
                <div className="mb-8 flex-1">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-4 border-b border-black/10 pb-2 text-black">פירוט השירותים</h3>

                    <table className="w-full text-right">
                        <thead>
                            <tr className="border-b-2 border-black/5 text-black/60">
                                <th className="py-3 font-black text-xs uppercase w-12 text-black">#</th>
                                <th className="py-3 font-black text-xs uppercase text-black">תיאור השירות</th>
                                <th className="py-3 font-black text-xs uppercase text-center w-20 text-black">כמות</th>
                                <th className="py-3 font-black text-xs uppercase text-left w-32 text-black">מחיר יח'</th>
                                <th className="py-3 font-black text-xs uppercase text-left w-32 text-black">סה"כ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {items.map((item, index) => (
                                <tr key={item.id} className="border-b border-black/5">
                                    <td className="py-4 text-xs font-bold opacity-40 text-black">{index + 1}</td>
                                    <td className="py-4 text-sm font-bold text-black">
                                        {item.description || 'תיאור פריט...'}
                                    </td>
                                    <td className="py-4 text-sm font-medium text-center opacity-70 text-black">{item.quantity}</td>
                                    <td className="py-4 text-sm font-medium text-left opacity-70 text-black">{formatCurrency(item.price)}</td>
                                    <td className="py-4 text-sm font-black text-left text-black">{formatCurrency((item.price || 0) * (item.quantity || 0))}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- FINANCIAL SUMMARY --- */}
                <div className="flex justify-end mb-16">
                    <div className="w-72 rounded-xl p-6 border border-black/5 bg-gray-50/50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold opacity-50 text-black">סיכום ביניים</span>
                            <span className="text-sm font-bold text-black">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-black/10">
                            <span className="text-xs font-bold opacity-50 text-black">מע"מ (17%)</span>
                            <span className="text-sm font-bold text-black">{formatCurrency(tax)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-black uppercase text-black">סה"כ לתשלום</span>
                            <span className="text-xl font-black text-black">{formatCurrency(total)}</span>
                        </div>
                    </div>
                </div>

                {/* --- SIGNATURES --- */}
                <div className="mt-auto grid grid-cols-2 gap-20 items-end">
                    <div>
                        {/* RIGHT SIDE (First in RTL): ISSUER SIGNATURE */}
                        <div className="h-24 border-b border-black/20 flex items-end pb-2 mb-2 relative">
                            {data.signature ? (
                                <img src={data.signature} alt="Provider Signature" className="h-20 object-contain absolute bottom-0 right-1/2 translate-x-1/2" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-medium opacity-20 text-black">חתימת עסק</div>
                            )}
                        </div>
                        <p className="text-xs font-bold opacity-40 uppercase tracking-widest text-center text-black">חתימת המגיש</p>
                    </div>
                    <div>
                        {/* LEFT SIDE (Second in RTL): CLIENT PLACEHOLDER */}
                        <div className="h-24 border-b border-black/20 flex items-end pb-2 mb-2 relative">
                            {(data.customer_signature_url || data.clientSignature) ? (
                                <img
                                    src={data.customer_signature_url || data.clientSignature}
                                    alt="Client Signature"
                                    className="max-h-full max-w-full object-contain mx-auto"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-medium opacity-20 text-black">המקום לחתימה</div>
                            )}
                        </div>
                        <p className="text-xs font-bold opacity-40 uppercase tracking-widest text-center text-black">חתימת הלקוח</p>
                    </div>
                </div>

            </div>

            {/* FOOTER CREDIT - SIMPLIFIED */}
            <div className="mt-auto pt-6 pb-2 w-full text-center">
                <p className="text-[9px] text-gray-300 tracking-[0.3em] font-sans font-medium uppercase">Thank you for your business</p>
            </div>

            {/* DECORATIVE BOTTOM STRIP */}
            <div className="h-2 w-full bg-black"></div>
        </div>
    );
};

export default ProposalTemplate;