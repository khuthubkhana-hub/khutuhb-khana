import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, User } from 'lucide-react';
import { type Member } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';

interface PrintMemberCardModalProps {
    members: Member[];
    onClose: () => void;
}

const PrintMemberCardModal: React.FC<PrintMemberCardModalProps> = ({ members, onClose }) => {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = printRef.current;
        if (!printContent) return;

        const originalContents = document.body.innerHTML;
        const printContents = printContent.innerHTML;

        document.body.innerHTML = printContents;
        window.print();
        document.body.innerHTML = originalContents;
        window.location.reload(); // Reload to restore event listeners
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
                >
                    <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
                        <div>
                            <h2 className="text-2xl font-bold text-neutral-900">Print Member Cards</h2>
                            <p className="text-neutral-500">Generating {members.length} ID cards</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
                            >
                                <Printer size={20} /> Print Cards
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2.5 hover:bg-neutral-200 rounded-xl transition-colors text-neutral-500"
                            >
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 bg-neutral-100">
                        <div ref={printRef} className="grid grid-cols-1 md:grid-cols-2 gap-8 print:grid-cols-2 print:gap-4">
                            <style>
                                {`
                  @media print {
                    @page { margin: 0.5cm; }
                    body { -webkit-print-color-adjust: exact; }
                    .print-break-inside-avoid { break-inside: avoid; }
                  }
                `}
                            </style>
                            {members.map((member) => (
                                <div key={member.id} className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col w-full max-w-[400px] mx-auto print-break-inside-avoid print:border-2 print:shadow-none">
                                    {/* Card Header */}
                                    <div className="bg-primary p-4 text-white flex items-center gap-3">
                                        <div className="bg-white/20 p-2 rounded-lg">
                                            <User size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg leading-tight">Muhimmath Library</h3>
                                            <p className="text-xs text-white/80 uppercase tracking-wider">Member Identity Card</p>
                                        </div>
                                    </div>

                                    {/* Card Body */}
                                    <div className="p-6 flex gap-6">
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <p className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Name</p>
                                                <p className="font-bold text-neutral-900 text-lg leading-tight">{member.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Register No</p>
                                                <p className="font-mono font-bold text-neutral-900">{member.register_number}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase text-neutral-400 font-bold tracking-wider">Class/Designation</p>
                                                <p className="font-bold text-neutral-900">{member.class || 'N/A'}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="bg-white p-2 rounded-lg border-2 border-neutral-100">
                                                <QRCodeCanvas value={member.register_number || ''} size={80} level="M" />
                                            </div>
                                            <p className="text-[10px] text-neutral-400 font-mono text-center">Scan for Details</p>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="bg-neutral-50 p-3 border-t border-neutral-100 flex justify-between items-center">
                                        <p className="text-[10px] text-neutral-400">www.muhimmath.com</p>
                                        <div className="h-1 w-16 bg-primary rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PrintMemberCardModal;
