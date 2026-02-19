import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, FileText, Printer, Share, X, ArrowRight, ArrowLeft, MoreHorizontal, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- INVOICE A4 PREVIEW (Local Helper) ---
const InvoiceA4Preview = ({ data, businessDetails, logoUrl, signatureUrl, onClose }) => {
    const price = parseFloat(data.amount) || 0;
    const vat = parseFloat(data.vat) || 0;
    const total = parseFloat(data.total_amount) || 0;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0">
            <div className="bg-white w-full max-w-[800px] h-[90vh] overflow-y-auto custom-scrollbar relative shadow-2xl animate-in zoom-in duration-300 print:h-auto print:shadow-none print:static" dir="rtl">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all z-[110] print:hidden"
                >
                    <X size={24} />
                </button>

                {/* Print Button */}
                <div className="absolute top-6 left-6 flex gap-3 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="w-12 h-12 bg-black text-white rounded-full shadow-lg hover:bg-slate-800 transition-all flex items-center justify-center"
                        title="הדפס חשבונית"
                    >
                        <Printer size={24} />
                    </button>
                </div>

                <div className="p-12 font-sans bg-white min-h-full">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-12 pb-8 border-b border-slate-100">
                        <div>
                            <h2 className="text-3xl font-bold text-black mb-1">{businessDetails?.name || "חשבונית מס / קבלה"}</h2>
                            <p className="text-sm text-slate-500 font-medium">ח.פ: {businessDetails?.hp}</p>
                            <p className="text-sm text-slate-500">{businessDetails?.address}</p>
                        </div>
                        {logoUrl && <img src={logoUrl} className="h-16 object-contain" alt="Logo" />}
                    </div>

                    <h1 className="text-5xl font-black text-slate-50 mb-12 tracking-widest text-left">INVOICE</h1>

                    {/* Client Info */}
                    <div className="mb-12">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">לכבוד:</div>
                        <p className="text-2xl font-bold text-black">{data.client_name || "..."}</p>
                        <p className="text-base text-slate-500 mt-1">ח.פ / ת.ז: {data.client_id || "..."}</p>
                    </div>

                    {/* Table */}
                    <table className="w-full text-right mb-12">
                        <thead>
                            <tr className="border-b-2 border-black text-[11px] uppercase tracking-[0.2em] text-black">
                                <th className="py-4 font-black">תיאור השירות</th>
                                <th className="py-4 font-black text-left">סה"כ</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100">
                                <td className="py-8 text-lg font-medium text-slate-800">{data.service_description || "..."}</td>
                                <td className="py-8 text-lg font-bold text-black text-left">{price.toLocaleString()} ₪</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="mr-auto w-64 space-y-4 mb-16 pt-6">
                        <div className="flex justify-between text-base text-slate-500 font-medium">
                            <span>סה"כ לפני מע"מ:</span>
                            <span>{price.toLocaleString()} ₪</span>
                        </div>
                        <div className="flex justify-between text-base text-slate-500 font-medium">
                            <span>מע"מ (17%):</span>
                            <span>{vat.toLocaleString()} ₪</span>
                        </div>
                        <div className="border-t-2 border-black pt-4 flex justify-between text-2xl font-black text-black">
                            <span>סה"כ לתשלום:</span>
                            <span>{total.toLocaleString()} ₪</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-auto pt-16 border-t border-slate-100 flex justify-between items-end">
                        <div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-6">חתימת העסק</p>
                            {signatureUrl ? (
                                <img src={signatureUrl} className="h-14 object-contain" />
                            ) : (
                                <div className="h-14 w-32 border-b-2 border-slate-200"></div>
                            )}
                        </div>
                        <p className="text-[11px] text-slate-300 font-mono tracking-widest">ORIGINAL • {new Date(data.created_at).toLocaleDateString('he-IL')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyFiles = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [userProfile, setUserProfile] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    navigate('/');
                    return;
                }

                // 1. Fetch Profile for A4 preview
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (profile) {
                    setUserProfile({
                        name: profile.business_name,
                        hp: profile.business_hp,
                        address: profile.business_address,
                        logo: profile.logo_url,
                        signature: profile.signature_url
                    });
                }

                // 2. Fetch Invoices from the unified table (Order by created_at)
                const { data: invoicesData, error: invoiceError } = await supabase
                    .from('invoices')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (invoiceError) {
                    console.dir(invoiceError);
                    console.error("Supabase error fetching invoices:", invoiceError);
                }

                if (invoicesData) {
                    console.log("Fetched Invoices:", invoicesData);
                    setInvoices(invoicesData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const filteredInvoices = invoices.filter(inv =>
        inv.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-screen w-full bg-[#FBFBF9] font-sans overflow-hidden" dir="rtl">
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Site Header Maintained */}
                <header className="h-20 flex items-center justify-between px-10 border-b border-slate-100 flex-shrink-0 bg-white z-40">
                    <div className="flex items-center gap-6">
                        <button onClick={() => navigate('/')} className="flex items-center gap-2 mr-16 text-slate-400 hover:text-slate-800 transition-colors group px-4 py-2 rounded-xl hover:bg-slate-50">
                            <ArrowRight size={25} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-bold text-md tracking-tight text-left">חזרה</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xl font-black text-slate-800 tracking-tighter"></span>
                        <div>

                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#FBFBF9] px-10 py-12">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">ארכיון מסמכים</h1>
                                <p className="text-lg text-slate-400 font-medium">צפייה, ניהול והדפסה של כל החשבוניות שהפקת</p>
                            </div>

                            {/* Search bar */}
                            <div className="relative w-full md:w-80 group">
                                <input
                                    type="text"
                                    placeholder="חיפוש לפי שם לקוח..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-4 pr-12 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-slate-800 focus:ring-4 focus:ring-slate-100 transition-all shadow-sm text-right placeholder:text-slate-400"
                                />
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-800 transition-colors" size={20} />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-slate-800 animate-spin mb-4" />
                                <span className="text-slate-400 font-bold tracking-widest text-xs">טוען ארכיון...</span>
                            </div>
                        ) : filteredInvoices.length > 0 ? (
                            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">תאריך</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">סוג מסמך</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">שם לקוח</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">סכום סופי</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">סטטוס</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-left">פעולות</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredInvoices.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-8 py-6 text-sm font-bold text-slate-600">
                                                    {new Date(inv.created_at).toLocaleDateString('he-IL')}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-3 py-1 bg-slate-100 text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                                        {inv.document_type || 'חשבונית'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-base font-bold text-slate-800">
                                                    {inv.client_name}
                                                </td>
                                                <td className="px-8 py-6 text-base font-black text-black">
                                                    {inv.total_amount?.toLocaleString() || "0"} ₪
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                                                        <span className="text-xs font-bold text-slate-800 tracking-tight">מקורי</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-left">
                                                    <button
                                                        onClick={() => setSelectedInvoice(inv)}
                                                        className="px-5 py-2.5 bg-black text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2 mr-auto"
                                                    >
                                                        <Eye size={14} />
                                                        צפייה
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-32 bg-white rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center animate-in fade-in zoom-in duration-500">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                                    <FileText size={40} className="text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">לא נמצאו מסמכים</h3>
                                <p className="text-slate-400 font-medium mb-8">לא מצאנו מסמכים התואמים לחיפוש שלך.</p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-8 py-4 bg-black text-white rounded-2xl text-sm font-bold shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all"
                                >
                                    חזרה לצ'אט ליצירת מסמך
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div >

            {/* A4 Overlay Modal */}
            {
                selectedInvoice && (
                    <InvoiceA4Preview
                        data={selectedInvoice}
                        businessDetails={userProfile}
                        logoUrl={userProfile.logo}
                        signatureUrl={userProfile.signature}
                        onClose={() => setSelectedInvoice(null)}
                    />
                )
            }
        </div >
    );
};

export default MyFiles;
