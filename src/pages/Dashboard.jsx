import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Loader2, FileText, Copy, Printer, Check } from "lucide-react";
import { Link } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits: 0 }).format(amount || 0);
    };

    const calculateTotal = (items) => {
        if (!items || !Array.isArray(items)) return 0;
        const sub = items.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 0)), 0);
        return sub * 1.17;
    };

    const fetchProposals = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Silent return if loading or not auth

            const { data, error } = await supabase
                .from('proposals')
                .select('*')
                .eq('user_id', user.id) // Strict RLS
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log("Raw Proposals:", data);

            const mapped = data.map(doc => {
                // הבדיקה הזו מבטיחה שאם יש לינק לחתימה, הסטטוס יוצג כ"חתום" גם אם ב-DB רשום משהו אחר
                const isSigned = doc.customer_signature_url || doc.status === 'signed' || doc.proposal_data?.status === 'signed';

                return {
                    id: doc.id,
                    // פרטי לקוח ועסק
                    client_name: doc.client_name || doc.proposal_data?.clientName || 'לקוח ללא שם',
                    business_name: doc.business_name || doc.proposal_data?.businessName || 'העסק שלך',
                    proposal_number: doc.proposal_number || doc.proposal_data?.proposalNumber || '---',

                    // תאריכים
                    created_at: doc.created_at,
                    signed_at: doc.signed_at || doc.proposal_data?.signedAt,

                    // נתונים כספיים (משיכה ישירה או חישוב מה-Items)
                    items: doc.proposal_data?.items || [],
                    total_amount: doc.total_amount || doc.proposal_data?.total || calculateTotal(doc.proposal_data?.items || []),

                    // מדיה (לוגו וחתימות)
                    // שים לב: אנחנו מושכים קודם מהעמודה ואז מה-JSON למקרה של גיבוי
                    logo_url: doc.logo_url || doc.proposal_data?.logo || doc.proposal_data?.logo_url,
                    signature_url: doc.signature_url || doc.proposal_data?.signature || doc.proposal_data?.signature_url,
                    customer_signature_url: doc.customer_signature_url || doc.proposal_data?.clientSignature || doc.proposal_data?.customer_signature_url,

                    // סטטוס סופי
                    status: isSigned ? 'signed' : 'sent'
                };
            });
            // Verify signed proposals have signature URL
            const signedProposals = mapped.filter(p => p.status === 'signed');
            if (signedProposals.length > 0) {
                console.log("Signed Proposals Verification:", signedProposals.map(p => ({
                    id: p.id,
                    status: p.status,
                    signature: p.customer_signature_url
                })));
            }

            setProposals(mapped);
        } catch (error) {
            console.error("Error fetching proposals:", error);
            // Optionally set an error state to show in UI
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProposals();

        const subscription = supabase
            .channel('public:proposals')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, (payload) => {
                fetchProposals();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const deleteProposal = async (e, id) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm('האם אתה בטוח שברצונך למחוק מסמך זה?')) return;

        try {
            const { error } = await supabase
                .from('proposals')
                .delete()
                .eq('id', id);

            if (error) throw error;

            fetchProposals();
        } catch (error) {
            console.error("Error deleting proposal:", error);
            alert('שגיאה במחיקה');
        }
    };

    return (
        <div className="p-12 min-h-screen bg-[#FAFAFA]" dir="rtl">
            <div className="max-w-7xl mx-auto">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">הגלריה שלי</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">כל מסמכי הפרימיום במקום אחד</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="animate-spin text-gray-900 w-8 h-8" />
                    </div>
                ) : (
                    <>
                        {proposals.length === 0 ? (
                            <div className="text-center py-32 flex flex-col items-center justify-center">
                                <div className="w-20 h-20 bg-white border border-[#D4AF37]/20 rounded-full flex items-center justify-center mb-6 shadow-[0_10px_40px_-10px_rgba(212,175,55,0.2)]">
                                    <FileText size={32} className="text-[#D4AF37]" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-2">אין עדיין מסמכים</h2>
                                <p className="text-gray-500 text-sm mb-8 max-w-sm mx-auto">
                                    זה הזמן ליצור את הצעת המחיר הראשונה שלך ולהרשים את הלקוחות עם עיצוב פרימיום.
                                </p>

                                <button
                                    onClick={() => navigate('/create')}
                                    className="flex items-center gap-2 px-8 py-4 bg-[#1A1A1A] text-[#D4AF37] rounded-full font-bold text-sm hover:bg-black hover:scale-105 transition-all shadow-xl shadow-[#D4AF37]/10"
                                >
                                    <Plus size={18} />
                                    <span>צור מסמך חדש</span>
                                </button>

                                <div className="mt-12 pt-8 border-t border-gray-100 w-48">
                                    <p className="text-[10px] text-[#D4AF37] font-bold tracking-[0.3em] uppercase opacity-70">Powered by Signet</p>
                                </div>
                            </div>
                        ) : (
                            /* GALLERY GRID */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-10">

                                {/* CREATE NEW GHOST CARD */}
                                <div className="group cursor-pointer select-none" onClick={() => navigate('/create')}>
                                    <div className="aspect-[1/1.41] bg-white border-2 border-dashed border-gray-200 rounded-2xl group-hover:border-black group-hover:bg-black/5 transition-all duration-300 flex items-center justify-center relative">
                                        <Plus size={32} className="text-gray-300 group-hover:text-black transition-colors" />
                                    </div>
                                    <div className="mt-4 text-center">
                                        <h3 className="text-xs font-bold text-gray-400 group-hover:text-black transition-colors">צור מסמך חדש</h3>
                                    </div>
                                </div>

                                {/* REAL PROPOSALS */}
                                {proposals.map((item) => (
                                    <Link to={`/proposal/${item.id}`} key={item.id} className="group cursor-pointer block relative select-none">
                                        <div className="aspect-[1/1.41] bg-white rounded-2xl shadow-sm border border-gray-100 group-hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] group-hover:border-black/5 group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col">

                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"></div>

                                            {/* Top Bar Accent */}
                                            <div className="h-1.5 w-full bg-gray-50 group-hover:bg-black transition-colors"></div>

                                            <div className="flex-1 p-8 flex flex-col gap-4 relative z-10">
                                                {/* Status Badge */}
                                                <div className="absolute top-4 left-4 z-20">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'signed'
                                                        ? 'bg-black text-[#FDFDFD] border border-black'
                                                        : 'bg-black/5 text-gray-500'
                                                        }`}>
                                                        {item.status === 'signed' ? 'חתום' : 'נשלח'}
                                                    </span>
                                                </div>

                                                {/* Initial Circle */}
                                                <div className={`w-16 h-16 rounded-full border flex items-center justify-center text-xl font-black mx-auto mb-4 transition-all
                                                    ${item.status === 'signed'
                                                        ? 'bg-gray-50 border-black text-black'
                                                        : 'bg-gray-50 border-gray-100 text-gray-300 group-hover:border-black group-hover:text-black group-hover:bg-white'
                                                    }
                                                `}>
                                                    {item.status === 'signed' ? <Check size={24} /> : (item.client_name?.charAt(0) || '?')}
                                                </div>

                                                {/* Layout Preview lines */}
                                                <div className="space-y-2 opacity-30">
                                                    <div className="h-2 bg-gray-200 rounded w-full"></div>
                                                    <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                                                    <div className="h-2 bg-gray-100 rounded w-full"></div>
                                                </div>

                                                {/* Edit Button (Visible on Hover via CSS parent group) */}
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-30">
                                                    <span className="px-5 py-2 bg-black text-white text-[11px] font-bold rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                                        {item.status === 'signed' ? 'צפה בחתימה' : 'ערוך מסמך'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-4 border-t border-gray-50 bg-white z-10 relative">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h3 className="font-bold text-gray-900 text-xs line-clamp-1">{item.client_name || 'ללא שם'}</h3>
                                                    <div className="flex items-center gap-1">
                                                        {item.status === 'signed' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    window.open(`${window.location.origin}/share/${item.id}`, '_blank');
                                                                }}
                                                                className="text-gray-300 hover:text-black transition-colors bg-transparent p-1.5 rounded hover:bg-gray-100 z-40 relative"
                                                                title="הדפס מסמך חתום"
                                                            >
                                                                <Printer size={14} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                const url = `${window.location.origin}/share/${item.id}`;
                                                                navigator.clipboard.writeText(url);
                                                                alert('הקישור הועתק ללוח!');
                                                            }}
                                                            className="text-gray-300 hover:text-black transition-colors bg-transparent p-1.5 rounded hover:bg-gray-100 z-40 relative"
                                                            title="העתק קישור לשיתוף"
                                                        >
                                                            <Copy size={14} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => deleteProposal(e, item.id)}
                                                            className="text-gray-300 hover:text-red-500 transition-colors bg-transparent p-1.5 rounded hover:bg-red-50 z-40 relative"
                                                            title="מחק מסמך"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] text-gray-400">{item.created_at ? new Date(item.created_at).toLocaleDateString('he-IL') : '-'}</span>
                                                    <span className="text-[10px] font-bold text-gray-900">{formatCurrency(item.total_amount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}

                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;