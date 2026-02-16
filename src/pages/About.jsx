import React from 'react';
import AppNavbar from '../components/AppNavbar';

const About = () => {
    return (
        <div className="min-h-screen bg-[#FDFDFD] font-sans rtl" dir="rtl">
            <AppNavbar />
            <div className="container mx-auto px-6 pt-32 pb-20">
                <h1 className="text-4xl font-bold text-gray-900 mb-6">אודות Signet</h1>
                <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                    Signet הוקמה במטרה לשנות את הדרך שבה בעלי עסקים מציגים את עצמם.
                    אנו מאמינים שהצעת מחיר היא לא רק מסמך טכני, אלא כרטיס הביקור החשוב ביותר שלך בזמן סגירת העסקה.
                    המסמכים שלנו מעוצבים בקפידה כדי לשדר יוקרה, מקצועיות ואמינות.
                </p>
            </div>
        </div>
    );
};

export default About;
