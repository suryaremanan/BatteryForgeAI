import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { analyzeDefect } from '../api';

const UploadZone = ({ onResult, onImageUpload }) => {
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Create preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Convert to Base64 for Agent
        const reader = new FileReader();
        reader.onloadend = () => {
            if (onImageUpload) onImageUpload(reader.result);
        };
        reader.readAsDataURL(file);

        setLoading(true);
        try {
            const result = await analyzeDefect(file);
            onResult(result);
        } catch (error) {
            console.error(error);
            alert("Failed to analyze image");
        } finally {
            setLoading(false);
        }
    };

    const clearImage = (e) => {
        e.stopPropagation();
        setPreview(null);
        fileInputRef.current.value = "";
        onResult(null);
    };

    return (
        <div className="relative group">
            <div
                onClick={() => fileInputRef.current.click()}
                className={`
          flex flex-col items-center justify-center w-full h-64 
          border-2 border-dashed rounded-xl cursor-pointer 
          transition-all duration-300 ease-out
          ${preview ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-slate-600 hover:border-indigo-400 hover:bg-slate-800/50'}
        `}
            >
                {preview ? (
                    <img
                        src={preview}
                        alt="Upload preview"
                        className="w-full h-full object-contain rounded-lg opacity-80"
                    />
                ) : (
                    <div className="flex flex-col items-center pt-5 pb-6 text-slate-400 group-hover:text-indigo-300">
                        <Camera className="w-12 h-12 mb-4 opacity-80" />
                        <p className="mb-2 text-sm"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-slate-500">SVG, PNG, JPG (MAX. 800x400px)</p>
                    </div>
                )}
            </div>

            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
            />

            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
            )}

            {preview && !loading && (
                <button
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-600 rounded-full text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default UploadZone;
