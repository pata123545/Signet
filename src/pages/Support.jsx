import React from 'react';
import AppNavbar from '../components/AppNavbar';

const Support = () => {
    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans rtl" dir="rtl">
            <AppNavbar />
            <div className="container mx-auto px-6 pt-32 pb-20">
                <h1 className="text-4xl font-bold text-gray-900 mb-6">מרכז התמיכה</h1>
                <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                    זקוק לעזרה? מצא מדריכים, שאלות נפוצות וטיפים לשימוש במערכת.
                </p>
            </div>
        </div>
    );
};

export default Support;
