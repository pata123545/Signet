import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon } from 'lucide-react';

const FileUploader = ({ label, onUpload, currentImage }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const handleFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                onUpload(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="w-full">
            <label className="block text-xs font-bold text-gray-700 mb-2">{label}</label>

            {currentImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                    <img src={currentImage} alt="Preview" className="w-full h-32 object-contain bg-gray-50 pattern-grid-lg" />
                    <button
                        onClick={() => onUpload(null)}
                        className="absolute top-2 right-2 p-1.5 bg-white shadow-md rounded-full text-gray-500 hover:text-red-500 transition-colors border border-gray-100"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <div
                    className={`
            relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white
            ${isDragging ? 'border-[#D4AF37] bg-amber-50' : 'border-gray-200 hover:border-[#D4AF37] hover:bg-gray-50'}
          `}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-[#D4AF37]">
                        <UploadCloud size={20} />
                    </div>
                    <p className="text-xs font-bold text-gray-700 mb-1">העלה תמונה</p>
                    <p className="text-[10px] text-gray-400">PNG, JPG (עד 2MB)</p>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleFile(e.target.files[0])}
                    />
                </div>
            )}
        </div>
    );
};

export default FileUploader;
