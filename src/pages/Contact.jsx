import React from 'react';
import AppNavbar from '../components/AppNavbar';

const Contact = () => {
    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans rtl" dir="rtl">
            <AppNavbar />
            <div className="container mx-auto px-6 pt-32 pb-20">
                <h1 className="text-4xl font-bold text-gray-900 mb-6">צור קשר</h1>
                <p className="text-lg text-gray-600 max-w-2xl leading-relaxed mb-8">
                    אנחנו כאן לכל שאלה. שלח לנו הודעה ונחזור אליך בהקדם.
                </p>
                <form className="max-w-lg space-y-4">
                    <input type="text" placeholder="שם מלא" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-[#D4AF37]" />
                    <input type="email" placeholder="אימייל" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-[#D4AF37]" />
                    <textarea placeholder="ההודעה שלך" className="w-full p-4 bg-gray-50 rounded-xl border border-gray-100 outline-none focus:border-[#D4AF37] min-h-[150px]"></textarea>
                    <button className="w-full py-4 bg-[#D4AF37] text-white font-bold rounded-xl shadow-lg shadow-[#D4AF37]/20">שלח הודעה</button>
                </form>
            </div>
        </div>
    );
};

export default Contact;
