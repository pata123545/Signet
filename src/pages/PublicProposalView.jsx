import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Loader2, Check, PenTool, Lock, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import ProposalTemplate from '../components/ProposalTemplate';
import toast from 'react-hot-toast';

const PublicProposalView = () => {
    const { id } = useParams();
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(false);

    // Security State
    const [step, setStep] = useState('email'); // 'email', 'code', 'view'
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');

    // Signing State
    const [signing, setSigning] = useState(false);
    const [signed, setSigned] = useState(false);
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);

    // --- HELPER: Get Signed URL ---
    const getSignedLink = async (pathOrUrl) => {
        if (!pathOrUrl) return null;
        try {
            let path = pathOrUrl;
            // Extract path if it's a full URL (legacy or public ref)
            if (pathOrUrl.startsWith('http')) {
                if (pathOrUrl.includes('/signatures/')) {
                    path = pathOrUrl.split('/signatures/')[1];
                } else if (pathOrUrl.includes('/logos/')) {
                    // Logos are likely public, return as is
                    return pathOrUrl;
                }
            }

            // If it's just a filename (new logic), use it directly
            // Clean path
            path = path.split('?')[0];

            console.log("Generating signed link for:", path);
            const { data, error } = await supabase.storage
                .from('signatures')
                .createSignedUrl(path, 60); // 60 seconds validity

            if (error) {
                console.warn("Error signing url for", path, error);
                return null; // Return null to trigger fallback
            }
            return data.signedUrl;
        } catch (err) {
            console.error("Helper error:", err);
            return null;
        }
    };

    // --- STEP 1: REQUEST CODE ---
    const handleSendCode = async () => {
        if (!email) return toast.error('אנא הזן כתובת אימייל');
        setLoading(true);

        try {
            // 1. Generate Code (DB)
            const { data: rpcData, error: rpcError } = await supabase
                .rpc('request_proposal_code', {
                    p_id: id,
                    input_email: email.trim()
                });

            if (rpcError) throw rpcError;

            if (rpcData && rpcData.success && rpcData.code) {
                // --- DEV MODE BYPASS (For Localhost/Testing) ---
                console.log("Final OTP to enter:", rpcData.code); // Exact string requested
                window.alert(`Dev Mode: Your code is ${rpcData.code}`); // Visual backup
                // -----------------------------------------------

                // 2. Send Email (Supabase Edge Function)
                // This avoids CORS issues by running on the server
                const { data: funcData, error: funcError } = await supabase.functions.invoke('send-otp', {
                    body: {
                        email: email.trim(),
                        otp: rpcData.code,
                        proposalId: id
                    }
                });

                if (funcError) {
                    console.error("Edge Function Error:", funcError);
                    toast.error('שגיאה בשליחת המייל. נסה שוב מאוחר יותר.');
                } else {
                    console.log("Email Sent Successfully:", funcData);
                    toast.success('קוד הגישה נשלח לתיבת המייל שלך!', {
                        icon: '✉️',
                        style: {
                            borderRadius: '10px',
                            background: '#333',
                            color: '#D4AF37',
                            border: '1px solid #D4AF37'
                        },
                    });
                }

                // Move to code step regardless of email success (so they can use debug code)
                setStep('code');
            } else {
                toast.error(rpcData?.message || 'אימייל לא נמצא במערכת');
            }
        } catch (error) {
            console.error("Error flow:", error);
            toast.error('שגיאה בשליחת הקוד. נסה שוב מאוחר יותר.');
        } finally {
            setLoading(false);
        }
    };



    // --- STEP 2: VERIFY CODE ---
    const handleVerify = async () => {
        if (!code || code.length < 6) return toast.error('אנא הזן קוד תקין (6 ספרות)');
        setLoading(true);

        try {
            const { data, error } = await supabase
                .rpc('verify_proposal_code', {
                    proposal_id: id,
                    email_input: email,
                    code_input: code
                });

            if (error) throw error;

            if (data) {
                // SUCCESS! 
                // TRANSFORM SIGNATURES TO SIGNED URLS
                const rawProposalData = data.proposal_data || {};

                // 1. Provider Signature
                let signedProviderSig = rawProposalData.signature;
                if (signedProviderSig) {
                    signedProviderSig = await getSignedLink(signedProviderSig);
                }

                // 2. Client Signature
                let signedClientSig = rawProposalData.clientSignature || data.customer_signature_url;
                if (signedClientSig) {
                    signedClientSig = await getSignedLink(signedClientSig);
                }

                const mergedData = {
                    ...rawProposalData,
                    signature: signedProviderSig,
                    clientSignature: signedClientSig,
                    serialNumber: data.serial_number,
                    clientName: data.client_name || rawProposalData.clientName,
                    proposalNumber: data.proposal_number || rawProposalData.proposalNumber,
                    date: data.created_at || rawProposalData.createdAt
                };

                setProposal(mergedData);
                if (data.status === 'signed' || rawProposalData.clientSignature) {
                    setSigned(true);
                }
                setStep('view');
                toast.success('אימות הצליח! המסמך נפתח.');
            } else {
                toast.error('קוד שגוי או פג תוקף');
            }
        } catch (error) {
            console.error("Error verifying code:", error);
            toast.error('שגיאה באימות הקוד');
        } finally {
            setLoading(false);
        }
    };

    // --- EXISTING SIGNATURE LOGIC ---
    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);
    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleApprove = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Simple blank check (approximate)
        const blank = document.createElement('canvas');
        blank.width = canvas.width;
        blank.height = canvas.height;
        if (canvas.toDataURL() === blank.toDataURL()) {
            return toast.error('אנא חתום על המסמך לפני האישור');
        }

        setLoading(true);
        try {
            const signatureBlob = await new Promise(resolve => canvas.toBlob(resolve));
            const fileName = `client_${id}_${Date.now()}.png`; // Filename for signatures bucket

            // Upload to PRIVATE 'signatures' bucket
            const { error: uploadError } = await supabase.storage
                .from('signatures')
                .upload(fileName, signatureBlob);

            if (uploadError) throw uploadError;

            // Generate Signed URL for immediate display (60s)
            const { data: signedData, error: signError } = await supabase.storage
                .from('signatures')
                .createSignedUrl(fileName, 60);

            if (signError) throw signError;
            const signedUrl = signedData.signedUrl;

            // Update DB with the PATH (fileName) so we can generate signed URLs later
            // Or full path 'signatures/fileName' if we want consistency
            const dbPath = `signatures/${fileName}`; // Storing path logic is safer for private buckets

            // We need to fetch current data first to append signature to JSON
            const { data: currentData } = await supabase.from('proposals').select('proposal_data').eq('id', id).single();

            const updatedProposalData = {
                ...currentData.proposal_data,
                clientSignature: signedUrl, // For UI state (temporary)
                clientSignaturePath: fileName, // Persist Path
                status: 'signed',
                signedAt: new Date().toISOString()
            };

            const { error: updateError } = await supabase
                .from('proposals')
                .update({
                    proposal_data: updatedProposalData,
                    status: 'signed',
                    customer_signature_url: dbPath, // Saving path/url reference
                    signed_at: new Date().toISOString()
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Update Local State for Display
            setProposal(prev => ({
                ...prev,
                clientSignature: signedUrl
            }));

            setSigned(true);
            setSigning(false);
            toast.success('המסמך נחתם ואושר בהצלחה!');

        } catch (error) {
            console.error("Error signing:", error);
            toast.error('שגיאה בשמירה, נסה שוב');
        } finally {
            setLoading(false);
        }
    };

    // --- LOCK SCREEN UI ---
    if (step !== 'view') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFD] p-6 text-center" dir="rtl">

                {/* Branding */}
                <div className="mb-8 animate-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-[#FDFDFD] rounded-2xl shadow-xl shadow-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-6">
                        <Lock className="text-[#D4AF37]" size={32} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 mb-2">מסמך מאובטח</h1>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">
                        לצורך צפייה בהצעת המחיר, אנא אמת את זהותך באמצעות כתובת האימייל המורשית.
                    </p>
                </div>

                {/* Step 1: Email */}
                {step === 'email' && (
                    <div className="w-full max-w-sm space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                        <div className="relative">
                            <Mail className="absolute right-4 top-3.5 text-gray-400" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="הכנס את כתובת האימייל שלך"
                                className="w-full bg-white border border-gray-200 rounded-xl py-3 pr-12 pl-4 text-gray-900 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-sm"
                            />
                        </div>
                        <button
                            onClick={handleSendCode}
                            disabled={loading}
                            className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin text-[#D4AF37]" size={18} /> : 'שלח קוד אימות'}
                        </button>
                    </div>
                )}

                {/* Step 2: Code */}
                {step === 'code' && (
                    <div className="w-full max-w-sm space-y-4 animate-in slide-in-from-bottom-5 duration-300">
                        <div className="relative">
                            <ShieldCheck className="absolute right-4 top-3.5 text-[#D4AF37]" size={18} />
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="הזן את הקוד (6 ספרות)"
                                className="w-full bg-white border-2 border-[#D4AF37] rounded-xl py-3 pr-12 pl-4 text-gray-900 font-mono text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/10 transition-all"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={handleVerify}
                            disabled={loading}
                            className="w-full py-3 bg-[#D4AF37] text-white rounded-xl font-bold text-sm shadow-lg hover:bg-[#B5952F] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : 'אמת וכנס'}
                        </button>
                        <button
                            onClick={() => setStep('email')}
                            className="text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1 mx-auto"
                        >
                            <ArrowLeft size={12} />
                            חזרה לאימייל
                        </button>
                    </div>
                )}

                <p className="mt-12 text-[10px] text-gray-300 font-bold tracking-widest uppercase">Secured by Signet</p>
            </div>
        );
    }

    // --- MAIN VIEW (Identical to previous, just wrapped) ---
    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-20 relative text-right" dir="rtl">
            {/* Header / Actions */}
            {!signed ? (
                <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 flex justify-between items-center shadow-sm">
                    <div className="text-xs font-bold text-gray-400">צפייה בהצעת מחיר</div>
                    <button
                        onClick={() => setSigning(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-full font-bold text-sm shadow-lg hover:scale-105 transition-all"
                    >
                        <PenTool size={16} />
                        אשר וחתום
                    </button>
                </div>
            ) : (
                <div className="sticky top-0 z-50 bg-green-50/90 backdrop-blur-md border-b border-green-100 p-4 flex justify-center items-center gap-2 text-green-700 font-bold text-sm shadow-sm">
                    <Check size={18} />
                    מסמך זה נחתם ואושר
                </div>
            )}

            {/* Document Render */}
            <div className="max-w-[210mm] mx-auto my-8 shadow-2xl shadow-black/5">
                <ProposalTemplate
                    data={proposal}
                    design={proposal.design || {}}
                    items={proposal.items || []}
                    previewMode={false} // It's a real view, not editor preview
                />
            </div>

            {/* Signature Modal */}
            {signing && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                        <div className="p-6 text-center border-b border-gray-50">
                            <h3 className="text-lg font-black text-gray-900">חתימה ואישור</h3>
                            <p className="text-gray-500 text-xs mt-1">אנא חתום בתיבה למטה כדי לאשר את ההצעה</p>
                        </div>

                        <div className="p-6 bg-gray-50">
                            <div className="bg-white rounded-xl border border-gray-200 shadow-inner overflow-hidden relative">
                                <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={200}
                                    className="w-full touch-none cursor-crosshair block"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                    onTouchStart={startDrawing}
                                    onTouchMove={draw}
                                    onTouchEnd={stopDrawing}
                                />
                                <div className="absolute top-2 right-2 text-[10px] text-gray-300 pointer-events-none select-none">
                                    חתום כאן
                                </div>
                            </div>
                            <button onClick={clearSignature} className="text-[10px] text-red-400 font-bold mt-2 hover:underline">
                                נקה חתימה
                            </button>
                        </div>

                        <div className="p-4 flex gap-3 border-t border-gray-50">
                            <button
                                onClick={() => setSigning(false)}
                                className="flex-1 py-3 rounded-lg font-bold text-sm text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                ביטול
                            </button>
                            <button
                                onClick={handleApprove}
                                className="flex-[2] py-3 bg-black text-white rounded-lg font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
                            >
                                אשר מסמך
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Branding Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-2 text-center pointer-events-none">
                <span className="text-[9px] font-bold text-gray-300 tracking-[0.2em] uppercase bg-white/80 px-2 py-1 rounded-full backdrop-blur-sm">
                    Powered by Signet
                </span>
            </div>
        </div>
    );
};

export default PublicProposalView;
