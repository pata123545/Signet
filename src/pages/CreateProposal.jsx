import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
   Palette,
   Save,
   Type,
   FileText,
   ChevronRight,
   LayoutTemplate,
   Grid,
   Plus,
   Trash2,
   Loader2,
   ArrowRight
} from 'lucide-react';
import ProposalTemplate from '../components/ProposalTemplate';
import FileUploader from '../components/FileUploader';
import { supabase } from '../supabaseClient';
import toast from 'react-hot-toast';

const CreateProposal = () => {
   const navigate = useNavigate();
   const { id } = useParams();
   const [loading, setLoading] = useState(false);
   const [autoFillLoading, setAutoFillLoading] = useState(!id); // Start loading if new proposal

   useEffect(() => {
      if (!id) return;

      const fetchProposal = async () => {
         setLoading(true);
         try {
            const { data, error } = await supabase
               .from('proposals')
               .select('*, serial_number')
               .eq('id', id)
               .single();

            if (error) throw error;

            if (data && data.proposal_data) {
               const pData = data.proposal_data;
               setData({
                  serialNumber: data.serial_number, // Fetch Auto-Increment ID
                  proposalNumber: data.proposal_number || pData.proposalNumber || '',
                  date: data.created_at || pData.date || new Date().toISOString(),
                  businessName: data.business_name || pData.businessName || '',
                  businessEmail: pData.businessEmail || '',
                  businessAddress: pData.businessAddress || '',
                  businessPhone: pData.businessPhone || '',
                  logo: pData.logo || null,
                  clientName: data.client_name || pData.clientName || '',
                  clientEmail: pData.clientEmail || '',
                  items: pData.items || [{ id: 1, description: '', quantity: 1, price: 0 }],
                  terms: pData.terms || '',
                  signature: pData.signature || null,
                  clientSignature: data.customer_signature_url || pData.clientSignature || null
               });

               if (pData.design) {
                  setDesign(pData.design);
               }
            }
         } catch (err) {
            console.error("Error fetching proposal:", err);
         } finally {
            setLoading(false);
         }
      };

      fetchProposal();
   }, [id]);

   // --- AUTO-FILL PROFILE (NEW PROPOSALS) ---
   useEffect(() => {
      // Only run for NEW proposals
      if (id) return;

      const fetchProfile = async () => {
         let hadError = false;
         try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile, error } = await supabase
               .from('profiles')
               .select('*')
               .eq('id', user.id)
               .single();

            if (error) throw error;

            if (profile) {
               console.log("Auto-filling profile:", profile);

               // Populate Business Data
               setData(prev => ({
                  ...prev,
                  businessName: profile.business_name || '',
                  businessAddress: profile.address || '',
                  businessPhone: profile.phone || '',
                  businessEmail: profile.email || '',
                  logo: profile.logo_url || null,
                  signature: profile.signature_url || null
               }));

               // Populate Design Settings (if they exist in profile)
               if (profile.theme_color || profile.font_family) {
                  setDesign(prev => ({
                     ...prev,
                     accentColor: profile.theme_color || prev.accentColor,
                     fontFamily: profile.font_family || prev.fontFamily,
                     // Assuming profile might store other design prefs, otherwise keep defaults
                  }));
               }
            }
         } catch (error) {
            console.error("Error auto-filling profile:", error);
            hadError = true;
         } finally {
            setAutoFillLoading(false);
            if (!hadError) {
               setShowToast(true);
               setTimeout(() => setShowToast(false), 3000);
            }
         }
      };

      fetchProfile();
   }, [id]);

   // --- STATE: UI FEEDBACK ---
   const [showToast, setShowToast] = useState(false);

   // --- STATE: DESIGN & LAYOUT ---
   const [design, setDesign] = useState({
      templateId: 'classic',
      fontFamily: 'Heebo',
      accentColor: '#1A1A1A',
      paperColor: '#FDFDFD',
      textColor: '#1A1A1A',
      layoutType: 'classic'
   });

   // --- STATE: CONTENT DATA ---
   const [data, setData] = useState({
      proposalNumber: '',
      date: new Date().toISOString(),
      businessName: '',
      businessEmail: '',
      businessAddress: '',
      businessPhone: '',
      logo: null,
      clientName: '',
      clientEmail: '',
      items: [{ id: 1, description: '', quantity: 1, price: 0 }],
      terms: '',
      signature: null,
      clientSignature: null
   });



   // --- TEMPLATE PRESETS ---
   const applyTemplate = (id) => {
      const templates = {
         classic: {
            fontFamily: 'Heebo',
            accentColor: '#1A1A1A',
            paperColor: '#FDFDFD',
            textColor: '#1A1A1A'
         },
         modern: {
            fontFamily: 'Assistant',
            accentColor: '#000000',
            paperColor: '#FFFFFF',
            textColor: '#222222'
         },
         royal: {
            fontFamily: 'David Libre',
            accentColor: '#2C2C2C',
            paperColor: '#FAFAF9',
            textColor: '#0F172A'
         }
      };
      setDesign({ templateId: id, ...templates[id] });
   };

   // --- HANDLERS ---
   const updateDesign = (key, val) => setDesign(prev => ({ ...prev, [key]: val }));
   const updateData = (key, val) => setData(prev => ({ ...prev, [key]: val }));

   // Items
   const addItem = () => setData(prev => ({
      ...prev,
      items: [...prev.items, { id: Date.now(), description: '', quantity: 1, price: 0 }]
   }));

   const updateItem = (id, field, val) => {
      setData(prev => ({
         ...prev,
         items: prev.items.map(item => item.id === id ? { ...item, [field]: val } : item)
      }));
   };

   const deleteItem = (id) => setData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));

   // --- SAVE LOGIC (SUPABASE) ---
   const handleSave = async () => {
      console.log("Save initiated...");
      if (!data.clientName) {
         return alert('אנא הזן שם לקוח');
      }
      if (!data.clientEmail) {
         return alert('אנא הזן כתובת אימייל ללקוח (חובה לצורך אבטחה)');
      }
      setLoading(true);

      try {
         // 1. Get User
         const { data: { user } } = await supabase.auth.getUser();
         if (!user) throw new Error("משתמש לא מחובר");

         let logoUrl = data.logo;
         let signaturePath = data.signature; // This will store the PATH for private bucket

         // 2. Upload Logo (if needed) - PUBLIC BUCKET
         if (data.logo && data.logo.startsWith('data:')) {
            try {
               const response = await fetch(data.logo);
               const blob = await response.blob();
               const fileName = `logo_${Date.now()}.png`;

               const { error: uploadError } = await supabase.storage
                  .from('logos') // Public bucket
                  .upload(fileName, blob, { contentType: 'image/png', upsert: true });

               if (uploadError) throw uploadError;

               // STORE RELATIVE PATH: "logos/filename.png"
               // This allows the ProposalTemplate to decide whether to use public URL or sign it
               logoUrl = `logos/${fileName}`;
            } catch (err) {
               console.error("Logo upload failed:", err);
            }
         }

         // 3. Upload Signature (STRICT LOGIC REQUESTED) - PRIVATE BUCKET
         // Store PATH only, e.g. "signatures/filename.png"
         if (data.signature && data.signature.startsWith('data:')) {
            try {
               const response = await fetch(data.signature);
               const blob = await response.blob();
               const fileName = `sig_${Date.now()}.png`; // Simple filename

               // Upload to 'signatures' bucket
               const { error: uploadError } = await supabase.storage
                  .from('signatures')
                  .upload(fileName, blob, { contentType: 'image/png', upsert: true });

               if (uploadError) throw uploadError;

               // STORE PATH: "signatures/filename.png"
               // This matches the logic in ProposalTemplate/PublicView that expects 'signatures/' prefix
               signaturePath = `signatures/${fileName}`;

            } catch (err) {
               console.error("Signature upload failed:", err);
               throw new Error("שגיאה בהעלאת חתימה: " + err.message);
            }
         }

         // 4. Insert to DB (Explicit Fields)
         // EXCLUDE SYSTEM FIELDS (no React State variables!)
         // 4. Insert to DB (Explicit Fields)
         const proposalData = {
            clientName: data.clientName,
            proposalNumber: data.proposalNumber,
            date: data.date,
            businessName: data.businessName,
            businessEmail: data.businessEmail,
            businessAddress: data.businessAddress,
            businessPhone: data.businessPhone,
            clientEmail: data.clientEmail,
            items: data.items,
            terms: data.terms,
            logo: logoUrl || null,
            signature: signaturePath || null,
            design
         };

         // Calculate total amount safely
         const calculatedTotal = data.items.reduce((sum, i) => sum + (Number(i.price) * Number(i.quantity)), 0) * 1.17;
         const totalAmount = Number(calculatedTotal.toFixed(2)); // Ensure strictly numeric with 2 decimals

         // 4. Construct Payload (Valid Columns Only)
         const safeSerialNumber = data.serialNumber ? parseInt(String(data.serialNumber).replace(/\D/g, ''), 10) : Math.floor(Math.random() * 900000) + 100000;
         const safeProposalNumber = data.proposalNumber || `PROP-${Date.now()}`;

         const commonPayload = {
            user_id: user.id,
            client_name: data.clientName,
            client_email: data.clientEmail,
            total_amount: totalAmount,
            proposal_data: proposalData,
            signature_url: signaturePath || null,
            proposal_number: safeProposalNumber,
            serial_number: safeSerialNumber,
         };

         console.log('Payload:', commonPayload);

         let resultData, resultError;

         if (id) {
            // --- UPDATE MODE ---
            console.log("Updating existing proposal:", id);
            // Verify we don't overwrite serial_number with a new generated one if it exists in state
            // The state `data.serialNumber` should have been loaded from DB in useEffect.
            const { data: updated, error: updateError } = await supabase
               .from('proposals')
               .update({
                  ...commonPayload,
                  // Make sure we keep the original created_at or let DB handle it (usually we don't update created_at)
               })
               .eq('id', id)
               .select()
               .single();

            resultData = updated;
            resultError = updateError;
         } else {
            // --- CREATE MODE ---
            console.log("Creating new proposal");
            const { data: inserted, error: insertError } = await supabase
               .from('proposals')
               .insert({
                  ...commonPayload,
                  created_at: new Date().toISOString()
               })
               .select()
               .single();

            resultData = inserted;
            resultError = insertError;
         }

         if (resultError) {
            console.error('Supabase Error Details:', resultError.message, resultError.details, resultError.hint);
            throw resultError;
         }

         // 5. Success UI
         console.log("Save successful! ID:", resultData.id);
         toast.success('ההצעה נשמרה בהצלחה!', {
            icon: '🖋️',
            style: {
               border: '1px solid #D4AF37',
               padding: '16px',
               color: '#D4AF37',
               background: '#1A1A1A',
            },
            iconTheme: {
               primary: '#D4AF37',
               secondary: '#FFFAEE',
            },
         });

         // Optional: Use the new ID for something if needed, e.g. navigate to view
         setTimeout(() => {
            navigate('/app');
         }, 1500);

      } catch (error) {
         console.error("Save failed:", error);
         console.dir(error);
         toast.error(error.message || "שגיאה בשמירה");
      } finally {
         setLoading(false);
      }
   };

   return (
      <div className="flex h-screen bg-[#F3F3F3] font-sans overflow-hidden text-gray-900" dir="rtl">

         {/* --- RIGHT SIDEBAR: CONTENT --- */}
         <aside className="w-[360px] bg-white border-l border-gray-200 flex flex-col z-20 shadow-xl shrink-0">

            {/* HEADER */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-white">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">עורך תוכן</span>

               <div className="flex items-center gap-3">
                  {/* BACK BUTTON */}
                  <button
                     onClick={() => navigate('/app')}
                     className="h-[40px] flex items-center gap-2 px-5 bg-[#FDFDFD] text-black border border-black/10 rounded-full font-bold text-xs hover:bg-gray-50 transition-colors"
                  >
                     <ArrowRight size={14} />
                     חזרה ללוח
                  </button>

                  {/* SAVE BUTTON */}
                  <button
                     onClick={handleSave}
                     disabled={loading}
                     className="h-[40px] flex items-center gap-2 px-5 bg-black text-white rounded-full font-bold text-xs hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 disabled:opacity-50"
                  >
                     {loading ? <Loader2 size={14} className="animate-spin text-[#D4AF37]" /> : <Save size={14} />}
                     שמור
                  </button>
               </div>
            </div>

            <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-[#FAFAFA] transition-opacity duration-700 ${autoFillLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>

               {/* BUSINESS INFO */}
               <Section title="העסק שלך" icon={FileText}>
                  <FileUploader
                     label="לוגו העסק"
                     currentImage={data.logo}
                     onUpload={(url) => updateData('logo', url)}
                  />
                  <Input label="שם העסק" value={data.businessName} onChange={e => updateData('businessName', e.target.value)} />
                  <div className="grid grid-cols-2 gap-3">
                     <Input label="טלפון" value={data.businessPhone} onChange={e => updateData('businessPhone', e.target.value)} />
                     <Input label="אימייל" value={data.businessEmail} onChange={e => updateData('businessEmail', e.target.value)} />
                  </div>
                  <Input label="כתובת" value={data.businessAddress} onChange={e => updateData('businessAddress', e.target.value)} />
               </Section>

               {/* CLIENT INFO */}
               <Section title="פרטי הלקוח" icon={FileText}>
                  <div className="mb-4">
                     <label className="block text-xs font-bold text-gray-400 mb-1">מספר הצעה (מזהה ייחודי)</label>
                     <input
                        type="text"
                        value={data.serialNumber || ''}
                        onChange={(e) => updateData('serialNumber', e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-white border-2 border-[#D4AF37] text-gray-900 text-sm rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50 transition-all font-mono font-bold tracking-wider"
                        placeholder="0000"
                     />
                     <p className="text-[10px] text-gray-400 mt-1">מספר זה יופיע כ- #0000 בראש המסמך</p>
                  </div>
                  <Input label="שם הלקוח" value={data.clientName} onChange={e => updateData('clientName', e.target.value)} />
                  <Input label="אימייל" value={data.clientEmail} onChange={e => updateData('clientEmail', e.target.value)} />
               </Section>

               {/* ITEMS TABLE */}
               <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                     <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Grid size={14} className="text-black" /> טבלת מחירים
                     </h3>
                     <button onClick={addItem} className="text-black hover:bg-gray-100 rounded p-1 transition-colors"><Plus size={16} /></button>
                  </div>
                  <div className="space-y-3">
                     {data.items.map((item) => (
                        <div key={item.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 group hover:border-black transition-colors relative">
                           <button onClick={() => deleteItem(item.id)} className="absolute top-2 left-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={12} /></button>
                           <div className="mb-2">
                              <label className="text-[10px] text-gray-400 mb-1 block">תיאור</label>
                              <input
                                 value={item.description}
                                 onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                 className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-black transition-colors"
                              />
                           </div>
                           <div className="flex gap-2">
                              <div className="flex-1">
                                 <label className="text-[10px] text-gray-400 mb-1 block">מחיר</label>
                                 <input type="number" value={item.price} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-black transition-colors" />
                              </div>
                              <div className="w-16">
                                 <label className="text-[10px] text-gray-400 mb-1 block">כמות</label>
                                 <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} className="w-full bg-white border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-black text-center transition-colors" />
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               <Section title="טקסט חופשי" icon={FileText}>
                  <textarea
                     value={data.terms}
                     onChange={e => updateData('terms', e.target.value)}
                     className="w-full h-32 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-800 outline-none focus:border-black resize-none leading-relaxed transition-colors"
                     placeholder="הזינו כאן טקסט חופשי..."
                  />
               </Section>

               <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                  <FileUploader label="חתימה דיגיטלית" currentImage={data.signature} onUpload={(url) => updateData('signature', url)} />
               </div>
            </div>
         </aside>

         {/* --- CENTER: STUDIO CANVAS --- */}
         <main className="flex-1 bg-[#F3F3F3] relative flex flex-col items-center justify-center p-8 overflow-hidden z-0">

            {/* TOAST NOTIFICATION */}
            {showToast && (
               <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full shadow-xl flex items-center gap-2 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-bold">הפרטים העסקיים נטענו בהצלחה</span>
               </div>
            )}

            {/* ZOOM CONTROLS */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-white rounded-full px-6 py-2 flex items-center gap-6 shadow-xl border border-gray-100 z-50">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest pointer-events-none">A4 PAPER</span>
               <div className="w-px h-4 bg-gray-200"></div>
               <span className="text-xs font-mono text-gray-500">100%</span>
            </div>

            <div className="w-full h-full overflow-y-auto custom-scrollbar flex justify-center py-12 px-4">
               <div className="scale-[0.65] md:scale-[0.75] xl:scale-[0.85] 2xl:scale-100 origin-top h-fit transition-all duration-300">
                  <div className="shadow-2xl ring-1 ring-black/5">
                     <ProposalTemplate data={data} design={design} />
                  </div>
               </div>
            </div>
         </main>

         {/* --- LEFT SIDEBAR: DESIGN --- */}
         <aside className="w-80 bg-white border-r border-gray-200 flex flex-col z-20 shadow-xl overflow-hidden shrink-0">
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">עיצוב וסגנון</span>
            </div>

            <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">

               {/* TEMPLATES */}
               <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <LayoutTemplate size={14} className="text-black" /> תבניות
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                     <TemplateBtn id="classic" name="Classic Gold" active={design.templateId === 'classic'} onClick={() => applyTemplate('classic')} />
                     <TemplateBtn id="modern" name="Modern Minimal" active={design.templateId === 'modern'} onClick={() => applyTemplate('modern')} />
                     <TemplateBtn id="royal" name="Royal Serif" active={design.templateId === 'royal'} onClick={() => applyTemplate('royal')} />
                  </div>
               </div>

               {/* FONTS */}
               <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Type size={14} className="text-black" /> גופנים
                  </h3>
                  <div className="space-y-2">
                     {['Heebo', 'Assistant', 'Rubik', 'David Libre'].map(font => (
                        <button
                           key={font}
                           onClick={() => updateDesign('fontFamily', font)}
                           className={`w-full text-right px-4 py-3 rounded-lg border text-sm transition-all ${design.fontFamily === font ? 'border-black/20 bg-black/20 text-black font-bold ring-1 ring-black/5' : 'border-gray-100 text-gray-500 hover:bg-black/20 hover:text-black hover:border-black/10'}`}
                           style={{ fontFamily: font }}
                        >
                           {font}
                        </button>
                     ))}
                  </div>
               </div>

               {/* COLORS */}
               <div>
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Palette size={14} className="text-black" /> צבעים
                  </h3>

                  {/* Paper Color */}
                  <div className="mb-6">
                     <label className="text-[10px] font-bold text-gray-400 mb-2 block">צבע רקע דף</label>
                     <div className="flex gap-2">
                        {['#FFFFFF', '#FDFDFD', '#FFFDF5', '#F5F5F5'].map(color => (
                           <button
                              key={color}
                              onClick={() => updateDesign('paperColor', color)}
                              className={`w-8 h-8 rounded-full border shadow-sm transition-transform ${design.paperColor === color ? 'ring-2 ring-black scale-110' : 'border-gray-200 hover:scale-105'}`}
                              style={{ backgroundColor: color }}
                           />
                        ))}
                     </div>
                  </div>

                  {/* Text Color */}
                  <div>
                     <label className="text-[10px] font-bold text-gray-400 mb-2 block">צבע טקסט ראשי</label>
                     <div className="flex gap-2">
                        {['#1A1A1A', '#4A4A4A', '#000000'].map(color => (
                           <button
                              key={color}
                              onClick={() => updateDesign('textColor', color)}
                              className={`w-8 h-8 rounded-full border shadow-sm transition-transform ${design.textColor === color ? 'ring-2 ring-black scale-110' : 'border-gray-200 hover:scale-105'}`}
                              style={{ backgroundColor: color }}
                           />
                        ))}
                     </div>
                  </div>

                  {/* LAYOUT */}
                  <div className="mt-8 border-t border-gray-100 pt-6">
                     <h3 className="text-xs font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2">
                        <LayoutTemplate size={14} className="text-black" /> מבנה דף
                     </h3>
                     <div className="grid grid-cols-3 gap-2">
                        {['classic', 'centered', 'modern'].map(layout => (
                           <button
                              key={layout}
                              onClick={() => updateDesign('layoutType', layout)}
                              className={`h-10 text-xs rounded-lg border transition-all ${design.layoutType === layout ? 'border-black/20 bg-black/20 text-black font-bold ring-1 ring-black/5' : 'border-gray-100 text-gray-500 hover:bg-black/20 hover:text-black hover:border-black/10'}`}
                           >
                              {layout === 'classic' ? 'רגיל' : layout === 'centered' ? 'מרוכז' : 'מודרני'}
                           </button>
                        ))}
                     </div>
                  </div>

               </div>
            </div>
         </aside>

      </div>
   );
};

const Section = ({ title, icon: Icon, children }) => (
   <div className="space-y-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
         <Icon size={14} className="text-black" /> {title}
      </h3>
      <div className="space-y-3">{children}</div>
   </div>
);

const TemplateBtn = ({ id, name, active, onClick }) => (
   <button
      onClick={onClick}
      className={`w-full text-right px-4 py-3 rounded-lg border text-sm transition-all flex items-center justify-between ${active ? 'border-black/20 bg-black/20 text-black font-bold ring-1 ring-black/5' : 'border-gray-100 text-gray-500 hover:bg-black/20 hover:text-black hover:border-black/10'}`}
   >
      <span>{name}</span>
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-black' : 'bg-gray-200'}`} />
   </button>
);

const Input = ({ label, value, onChange }) => (
   <div>
      <label className="text-[10px] text-gray-400 font-bold mb-1.5 block">{label}</label>
      <input value={value} onChange={onChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-900 outline-none focus:border-black transition-colors" />
   </div>
);

export default CreateProposal;