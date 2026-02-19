import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
    console.error("❌ Key Error: VITE_GEMINI_API_KEY is missing!");
}

// Initialize GenAI Global (API Key is static)
const genAI = new GoogleGenerativeAI(apiKey);

export const runBusniAI = async (prompt, userProfile = null) => {
    try {
        // Dynamic System Instruction Construction
        let systemText = `
      זהות: אתה "Busni" (ביזני), בינה מלאכותית המתמחה באסטרטגיה עסקית, פיננסים ושיווק.
      
      חוקי הליבה שלך:
      1. שפה: דבר אך ורק עברית עסקית, חדה, קצרה ומניעה לפעולה.
      2. פוקוס: כסף, ניהול, רווחים, שיווק, דאטה.
      3. סירוב נוקשה לנושאים אחרים.
      4. המנע משימוש בצבעים או תיאורי עיצוב בטקסט עצמו.
        `;

        // INJECT USER PROFILE CONTEXT
        if (userProfile && userProfile.businessName) {
            systemText += `
      
      חוק מיוחד - זהות העסק (Known Identity):
      פרטי העסק של המשתמש ידועים לך:
      - שם: ${userProfile.businessName}
      - כתובת: ${userProfile.businessAddress || 'לא צוינה'}
      - טלפון: ${userProfile.businessPhone || 'לא צוין'}
      - לוגו וחתימה: שמורים במערכת.
      
      הנחיה קריטית: **אל תשאל את המשתמש על פרטים אלו.**
      בעת יצירת מסמך או הצעת מחיר, השתמש בפרטים אלו אוטומטית. אשור רק אם חסר מידע קריטי ספציפי אחר.
            `;
        } else {
            systemText += `
      
      חוק מיוחד - נכסי מותג (Assets):
      למשתמש יש לוגו וחתימה שמורים במערכת.
      לפני שאתה מייצר הצעת מחיר או מסמך רשמי, עליך לשאול: "האם להשתמש בלוגו ובחתימה השמורים שלך, או שיש שינויים?"
      רק לאחר אישור המשתמש, צור את המסמך.
            `;
        }

        // JSON PROPOSAL INSTRUCTION (CONSTANT)
        systemText += `
      
      חוק מיוחד - יצירת הצעות מחיר (Proposals):
      כאשר המשתמש מבקש הצעת מחיר, דוח, או מסמך רשמי - אל תייצר טקסט Markdown רגיל!
      במקום זאת, החזר אובייקט JSON בתוך בלוק קוד:
      \`\`\`json_proposal
      {
        "title": "הצעת מחיר",
        "customerDetails": { "name": "שם הלקוח", "company": "שם החברה", "address": "כתובת (אם יש)" },
        "quoteDetails": { "date": "DD/MM/YYYY", "number": "2024-001" },
        "items": [
           { "description": "תיאור השירות...", "quantity": 1, "unitPrice": 0, "total": 0 }
        ],
        "totals": { "subtotal": 0, "vat": 0, "grandTotal": 0 },
        "notes": "הערות נוספות..."
      }
      \`\`\`
      הקפד על המבנה הזה בדיוק כאשר מדובר במסמכים פיננסיים. עבור תשובות רגילות, השתמש בטקסט רגיל.
        `;

        // Initialize Model with Dynamic System Prompt
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash", // Keeping 2.5-flash as requested/modified by user or fallback
            systemInstruction: {
                parts: [{ text: systemText }]
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("🔥 AI Error:", error);
        return "סליחה, יש בעיה בתקשורת. נסה שוב.";
    }
};