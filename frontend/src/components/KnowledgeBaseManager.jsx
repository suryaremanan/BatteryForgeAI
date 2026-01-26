import React, { useState, useEffect } from 'react';
import { Upload, FileText, Book, CheckCircle, XCircle, Loader, Info } from 'lucide-react';
import { uploadManual, listDocuments } from '../api';

const KnowledgeBaseManager = () => {
    const [documents, setDocuments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const data = await listDocuments();
            setDocuments(data.documents || []);
        } catch (error) {
            console.error('Failed to load documents:', error);
        }
    };

    const handleFile = async (file) => {
        if (!file || file.type !== 'application/pdf') {
            setUploadResult({ success: false, error: 'Please select a PDF file' });
            return;
        }

        setUploading(true);
        setUploadResult(null);

        try {
            const result = await uploadManual(file);
            setUploadResult(result);

            if (result.success) {
                // Reload documents list
                await loadDocuments();
            }
        } catch (error) {
            setUploadResult({ success: false, error: error.message });
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Upload Zone */}
            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-600/20 rounded-lg">
                        <Upload className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white">Upload Battery Manual</h3>
                        <p className="text-xs text-slate-400">PDF datasheets, technical docs, or safety standards</p>
                    </div>
                </div>

                {/* Drag & Drop Zone */}
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${dragActive
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader className="w-8 h-8 text-indigo-400 animate-spin" />
                            <p className="text-sm text-slate-300">Processing PDF...</p>
                            <p className="text-xs text-slate-500">Extracting text, generating metadata, indexing...</p>
                        </div>
                    ) : (
                        <>
                            <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                            <p className="text-slate-300 mb-2">Drag and drop PDF here or</p>
                            <label className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer transition-colors">
                                Browse Files
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                                    className="hidden"
                                />
                            </label>
                            <p className="text-xs text-slate-500 mt-3">Supports: Battery specs, BMS manuals, safety standards</p>
                        </>
                    )}
                </div>

                {/* Upload Result */}
                {uploadResult && (
                    <div className={`mt-4 p-4 rounded-lg border ${uploadResult.success
                            ? 'bg-emerald-900/20 border-emerald-500/30'
                            : 'bg-red-900/20 border-red-500/30'
                        }`}>
                        <div className="flex items-start gap-3">
                            {uploadResult.success ? (
                                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                                {uploadResult.success ? (
                                    <>
                                        <p className="text-sm font-semibold text-emerald-300 mb-2">
                                            ✓ {uploadResult.filename} ingested successfully
                                        </p>
                                        <div className="text-xs text-slate-300 space-y-1">
                                            <p>• {uploadResult.chunks_created} chunks created</p>
                                            <p>• {uploadResult.total_characters.toLocaleString()} characters extracted</p>
                                            {uploadResult.metadata && (
                                                <>
                                                    <p>• Type: {uploadResult.metadata.document_type}</p>
                                                    <p>• Chemistry: {uploadResult.metadata.battery_chemistry}</p>
                                                </>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-sm text-red-300">{uploadResult.error}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-200">
                        Uploaded documents are automatically indexed using Gemini embeddings.
                        Ask questions in the chat and the AI will search the knowledge base for relevant information.
                    </p>
                </div>
            </div>

            {/* Document List */}
            <div className="bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-600/20 rounded-lg">
                            <Book className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">Knowledge Base</h3>
                            <p className="text-xs text-slate-400">{documents.length} documents indexed</p>
                        </div>
                    </div>
                </div>

                {documents.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <Book className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No documents uploaded yet</p>
                        <p className="text-xs mt-1">Upload battery manuals to enable intelligent Q&A</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                        {documents.map((doc, idx) => (
                            <div
                                key={idx}
                                className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm text-white truncate mb-1">
                                            {doc.title}
                                        </h4>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                            <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded">
                                                {doc.document_type}
                                            </span>
                                            {doc.battery_chemistry !== 'Unknown' && (
                                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                                                    {doc.battery_chemistry}
                                                </span>
                                            )}
                                            {doc.manufacturer !== 'Unknown' && (
                                                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                                                    {doc.manufacturer}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-400">{doc.chunks} chunks</p>
                                        <p className="text-[10px] text-slate-500">{doc.upload_date}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBaseManager;
