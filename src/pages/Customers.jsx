import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    Search,
    UserPlus,
    Phone,
    Mail,
    MapPin,
    MoreVertical,
    Trash2,
    X,
    Loader2
} from "lucide-react";

const Customers = () => {
    const [customers, setCustomers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [newCustomer, setNewCustomer] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        address: ''
    });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        try {
            const { data, error } = await supabase
                .from('customers')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            console.error("Error fetching customers:", error);
        }
    };

    const handleAddCustomer = async () => {
        if (!newCustomer.name) return alert('נא להזין שם לקוח');
        setLoading(true);
        try {
            const { error } = await supabase
                .from('customers')
                .insert([{
                    name: newCustomer.name,
                    company: newCustomer.company,
                    email: newCustomer.email,
                    phone: newCustomer.phone,
                    address: newCustomer.address,
                    created_at: new Date()
                }]);

            if (error) throw error;

            setIsModalOpen(false);
            setNewCustomer({ name: '', company: '', email: '', phone: '', address: '' });
            fetchCustomers();
        } catch (error) {
            console.error("Error adding customer:", error);
            alert('שגיאה בהוספת לקוח');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('למחוק את הלקוח?')) {
            try {
                const { error } = await supabase
                    .from('customers')
                    .delete()
                    .eq('id', id);

                if (error) throw error;
                setCustomers(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                console.error("Error deleting:", error);
                alert('שגיאה במחיקת לקוח');
            }
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-12 min-h-screen bg-[#FAFAFA]" dir="rtl">
            <div className="max-w-6xl mx-auto">

                {/* HEADER */}
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">לקוחות</h1>
                        <p className="text-sm text-gray-500 mt-2">ניהול מאגר הלקוחות שלך</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative">
                            <Search className="absolute right-3 top-2.5 text-gray-400" size={16} />
                            <input
                                placeholder="חיפוש לקוח..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-[#D4AF37] w-64 shadow-sm"
                            />
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#111] text-white rounded-lg text-sm font-bold hover:bg-black shadow-lg shadow-black/5"
                        >
                            <UserPlus size={18} />
                            הוסף לקוח
                        </button>
                    </div>
                </div>

                {/* CUSTOMERS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCustomers.map((customer) => (
                        <div key={customer.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group relative">
                            <button
                                onClick={() => handleDelete(customer.id)}
                                className="absolute top-4 left-4 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5F5F5] to-[#E5E5E5] border border-white shadow-inner flex items-center justify-center text-lg font-black text-gray-400">
                                    {customer.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{customer.name}</h3>
                                    <p className="text-xs text-gray-400 font-bold">{customer.company || 'לקוח פרטי'}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Mail size={14} className="text-[#D4AF37]" />
                                    <span>{customer.email || '-'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Phone size={14} className="text-[#D4AF37]" />
                                    <span>{customer.phone || '-'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <MapPin size={14} className="text-[#D4AF37]" />
                                    <span>{customer.address || '-'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* EMPTY STATE */}
                {filteredCustomers.length === 0 && (
                    <div className="p-20 text-center bg-white rounded-3xl border border-gray-100">
                        <UserPlus size={48} className="mx-auto text-gray-200 mb-6" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">אין עדיין לקוחות</h3>
                        <p className="text-sm text-gray-500">הוסף את הלקוח הראשון שלך כדי להתחיל לעבוד</p>
                    </div>
                )}
            </div>

            {/* ADD CUSTOMER MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 left-4 text-gray-400 hover:text-gray-900"
                        >
                            <X size={20} />
                        </button>

                        <h2 className="text-xl font-black text-gray-900 mb-8">הוספת לקוח חדש</h2>

                        <div className="space-y-4">
                            <Input label="שם מלא" value={newCustomer.name} onChange={e => setNewCustomer({ ...newCustomer, name: e.target.value })} />
                            <Input label="חברה" value={newCustomer.company} onChange={e => setNewCustomer({ ...newCustomer, company: e.target.value })} />
                            <Input label="אימייל" value={newCustomer.email} onChange={e => setNewCustomer({ ...newCustomer, email: e.target.value })} />
                            <Input label="טלפון" value={newCustomer.phone} onChange={e => setNewCustomer({ ...newCustomer, phone: e.target.value })} />
                            <Input label="כתובת" value={newCustomer.address} onChange={e => setNewCustomer({ ...newCustomer, address: e.target.value })} />
                        </div>

                        <button
                            onClick={handleAddCustomer}
                            disabled={loading}
                            className="w-full mt-8 py-3 bg-[#D4AF37] text-white rounded-xl font-bold hover:bg-[#b8860b] transition-colors shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 size={16} className="animate-spin" />}
                            שמור לקוח
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const Input = ({ label, value, onChange }) => (
    <div>
        <label className="text-xs font-bold text-gray-500 mb-1.5 block">{label}</label>
        <input
            value={value}
            onChange={onChange}
            className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#D4AF37] focus:bg-white transition-all"
        />
    </div>
);

export default Customers;
