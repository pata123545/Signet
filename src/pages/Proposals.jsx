import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    FileText,
    Trash2,
    Eye,
    Loader2
} from "lucide-react";

const Proposals = () => {
    const navigate = useNavigate();
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

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
            const { data, error } = await supabase
                .from('proposals')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log("History Data:", data);

            const mapped = data.map(doc => {
                // הבדיקה הזו מבטיחה שאם יש לינק לחתימה, הסטטוס יוצג כ"חתום" גם אם ב-DB רשום משהו אחר
                const isSigned = doc.customer_signature_url || doc.status === 'signed' || doc.proposal_data?.status === 'signed';

                return {
                    id: doc.id,
                    client_name: doc.client_name || doc.proposal_data?.clientName || 'לקוח ללא שם',
                    proposal_number: doc.proposal_number || doc.proposal_data?.proposalNumber || '---',
                    created_at: doc.created_at,
                    items: doc.proposal_data?.items || [],
                    total_amount: doc.total_amount || doc.proposal_data?.total || calculateTotal(doc.proposal_data?.items),
                    // מחזיר את הסטטוס הסופי באותיות קטנות לביטחון
                    status: isSigned ? 'signed' : 'sent',
                    // מוסיף את הלינק לחתימה כדי שנוכל להציג אותה בתצוגה
                    customer_signature_url: doc.customer_signature_url
                };
            });

            setProposals(mapped);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProposals();
    }, []);

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('האם אתה בטוח שברצונך למחוק הצעה זו?')) {
            try {
                const { error } = await supabase
                    .from('proposals')
                    .delete()
                    .eq('id', id);

                if (error) throw error;

                setProposals(prev => prev.filter(p => p.id !== id));
            } catch (error) {
                console.error("Error deleting proposal:", error);
                alert('שגיאה במחיקה');
            }
        }
    };

    const filteredProposals = proposals.filter(p =>
        p.client_name?.includes(searchTerm) ||
        p.proposal_number?.includes(searchTerm)
    );

    return (
        <div className="p-12 min-h-screen bg-[#FAFAFA]" dir="rtl">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">הצעות מחיר</h1>
                        <p className="text-sm text-gray-500 mt-2 font-medium">ניהול היסטוריית ההצעות שנשלחו</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
                            <input
                                placeholder="חיפוש לפי שם או מספר..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-black focus:ring-1 focus:ring-black w-64 shadow-sm transition-all"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 hover:text-black transition-all shadow-sm">
                            <Filter size={16} />
                            סינון
                        </button>
                    </div>
                </div>

                {/* TABLE LIST */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center flex justify-center">
                            <Loader2 className="animate-spin text-gray-900" />
                        </div>
                    ) : (
                        <>
                            {proposals.length === 0 ? (
                                <div className="p-20 text-center flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                        <FileText size={24} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">לא נמצאו הצעות מחיר ב-Supabase</h3>
                                    <p className="text-gray-500 text-sm mt-1">צור הצעה חדשה כדי לראות אותה כאן</p>
                                    <div className="mt-8 pt-8 border-t border-gray-100 w-32">
                                        <p className="text-[9px] text-gray-400 font-bold tracking-[0.2em] uppercase">Powered by Signet</p>
                                    </div>
                                </div>
                            ) : (
                                <table className="w-full text-right">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">מספר</th>
                                            <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">לקוח</th>
                                            <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">תאריך</th>
                                            <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">סכום</th>
                                            <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest w-32">סטטוס</th>
                                            <th className="py-4 px-6 text-[10px] font-black text-gray-400 uppercase tracking-widest w-24">פעולות</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredProposals.map((item) => (
                                            <tr
                                                key={item.id}
                                                onClick={() => navigate(`/proposal/${item.id}`)}
                                                className="group hover:bg-black/5 transition-colors cursor-pointer"
                                            >
                                                {console.log("Current Proposal Status:", item.client_name, item.status)}
                                                <td className="py-4 px-6 font-mono text-xs font-bold text-gray-500 group-hover:text-black transition-colors">{item.proposal_number || '---'}</td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:border-black group-hover:text-black transition-colors">
                                                            {item.client_name?.charAt(0) || '?'}
                                                        </div>
                                                        <span className="font-bold text-gray-900 text-sm group-hover:text-black transition-colors">{item.client_name || 'ללא שם'}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-gray-500">{new Date(item.created_at).toLocaleDateString('he-IL')}</td>
                                                <td className="py-4 px-6 text-sm font-bold text-gray-900">{formatCurrency(item.total_amount)}</td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 ${item.status === 'signed'
                                                        ? 'bg-black text-[#FDFDFD] border-black shadow-md'
                                                        : 'bg-black/5 text-gray-500 border-transparent'
                                                        }`}>
                                                        {item.status === 'signed' ? 'חתום' : 'נשלח'}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Link
                                                            to={`/proposal/${item.id}`}
                                                            className="p-1.5 bg-white rounded-md text-gray-400 hover:text-black hover:shadow-sm transition-all border border-gray-100 hover:border-black"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Eye size={16} />
                                                        </Link>
                                                        <button
                                                            onClick={(e) => handleDelete(e, item.id)}
                                                            className="p-1.5 bg-white rounded-md text-gray-400 hover:text-red-600 hover:shadow-sm transition-all border border-gray-100 hover:border-red-200"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Proposals;
