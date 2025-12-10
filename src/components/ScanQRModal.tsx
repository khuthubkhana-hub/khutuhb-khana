import React, { useState, useEffect, useRef } from 'react';
import { X, Type, AlertTriangle, CheckCircle, Loader2, Zap, Camera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase, type Book } from '../lib/supabase';
import SearchableSelect from './SearchableSelect';
import { useDebounce } from '../hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';

interface ScanQRModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type ScanMode = 'scan' | 'manual';
type ActionType = 'issue' | 'return';

const ScanQRModal: React.FC<ScanQRModalProps> = ({ onClose, onSuccess }) => {
  const [scanMode, setScanMode] = useState<ScanMode>('scan');
  const [actionType, setActionType] = useState<ActionType>('issue');
  const [scannedBook, setScannedBook] = useState<Book | null>(null);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [manualIdentifier, setManualIdentifier] = useState('');
  const debouncedManualIdentifier = useDebounce(manualIdentifier, 300);
  const [message, setMessage] = useState<{ type: 'info' | 'error' | 'success'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerRegionId = "qr-scanner-region";
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (scanMode === 'scan') {
      scannerRef.current = new Html5Qrcode(scannerRegionId, { verbose: false });
    }

    return () => {
      isMounted.current = false;
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(err => {
          console.warn("Scanner stop on unmount failed:", err);
        });
      }
    };
  }, [scanMode]);

  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner || scanMode !== 'scan') return;

    const start = async () => {
      if (scanner.isScanning) return;
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 30, // Increased FPS for faster scanning
            qrbox: { width: 280, height: 280 },
            aspectRatio: 1.0
          },
          handleScanSuccess,
          handleScanError
        );
      } catch (err) {
        if (isMounted.current) {
          setMessage({ type: 'error', text: 'Could not start QR scanner. Check camera permissions.' });
        }
      }
    };

    const stop = async () => {
      if (scanner.isScanning) {
        try {
          await scanner.stop();
        } catch (err) {
          console.warn("Scanner stop failed, may already be stopping.", err);
        }
      }
    };

    if (!scannedBook) {
      start();
    } else {
      stop();
    }

  }, [scanMode, scannedBook]);

  const processScannedText = async (text: string) => {
    let book: Book | null = null;
    let error: any = null;
    const urlPrefix = `${window.location.origin}/book/`;

    if (text.startsWith(urlPrefix)) {
      const bookId = text.substring(urlPrefix.length);
      if (bookId) {
        const { data, error: queryError } = await supabase.from('books').select('*').eq('id', bookId).single();
        book = data;
        error = queryError;
      }
    } else {
      const { data, error: queryError } = await supabase
        .from('books')
        .select('*')
        .or(`ddc_number.eq.${text},id.eq.${text}`)
        .limit(1);

      if (data && data.length > 0) {
        book = data[0];
      }
      error = queryError;
    }

    if (!isMounted.current) return;

    if (error || !book) {
      setMessage({ type: 'error', text: 'Book not found. Please try again.' });
      setScannedBook(null);
      setTimeout(() => {
        if (isMounted.current) setMessage(null);
      }, 3000);
    } else {
      setScannedBook(book);

      const { data: circData } = await supabase
        .from('circulation')
        .select('*, members(name, class, register_number)')
        .eq('book_id', book.id)
        .eq('status', 'issued')
        .single();

      if (circData && circData.members) {
        setMessage({ type: 'info', text: `Book found: ${book.title}. Borrowed by: ${circData.members.name} (${circData.members.class || 'N/A'})` });
        setActionType('return');
      } else {
        setMessage({ type: 'info', text: `Book found: ${book.title}` });
        setActionType('issue');
      }
    }
  };

  useEffect(() => {
    if (debouncedManualIdentifier && scanMode === 'manual' && !scannedBook) {
      setLoading(true);
      setMessage({ type: 'info', text: 'Searching for book...' });
      processScannedText(debouncedManualIdentifier).finally(() => {
        if (isMounted.current) setLoading(false);
      });
    }
  }, [debouncedManualIdentifier, scanMode]);

  const handleScanSuccess = (decodedText: string) => {
    if (loading) return;
    setLoading(true);
    setMessage({ type: 'info', text: 'QR code detected. Verifying book...' });

    processScannedText(decodedText).finally(() => {
      if (isMounted.current) setLoading(false);
    });
  };

  const handleScanError = () => {
    // Keep quiet for scan errors
  };

  const handleFinalAction = async () => {
    if (!scannedBook) return;
    setLoading(true);
    setMessage(null);

    if (actionType === 'issue') {
      if (!selectedMember) {
        setMessage({ type: 'error', text: 'Please select a member to issue the book.' });
        setLoading(false);
        return;
      }
      const { error } = await supabase.rpc('issue_book', {
        p_book_id: scannedBook.id,
        p_member_id: selectedMember.value,
        p_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: `Successfully issued "${scannedBook.title}" to ${selectedMember.label}.` });
        setTimeout(() => { onSuccess(); onClose(); }, 2000);
      }
    } else {
      const { error } = await supabase.rpc('return_book_by_id', { p_book_id: scannedBook.id });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: `Successfully returned "${scannedBook.title}".` });
        setTimeout(() => { onSuccess(); onClose(); }, 2000);
      }
    }
    setLoading(false);
  };

  const resetState = () => {
    setScannedBook(null);
    setSelectedMember(null);
    setManualIdentifier('');
    setMessage(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-gradient-to-br from-white to-neutral-50 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200"
      >
        <div className="flex justify-between items-center p-6 border-b border-neutral-200 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-2 rounded-xl">
              <Zap className="text-primary" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Quick Scan</h2>
              <p className="text-xs text-neutral-500">Fast book circulation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-600 hover:text-neutral-900"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {!scannedBook ? (
              <motion.div
                key="scanning"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="flex items-center justify-center gap-2 bg-neutral-100 rounded-xl p-1.5 mb-6">
                  <button
                    onClick={() => setScanMode('scan')}
                    className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${scanMode === 'scan' ? 'bg-white shadow-md text-primary' : 'text-neutral-600 hover:text-neutral-900'}`}
                  >
                    <Camera size={18} /> Scan QR
                  </button>
                  <button
                    onClick={() => setScanMode('manual')}
                    className={`flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${scanMode === 'manual' ? 'bg-white shadow-md text-primary' : 'text-neutral-600 hover:text-neutral-900'}`}
                  >
                    <Type size={18} /> Manual
                  </button>
                </div>

                {scanMode === 'scan' ? (
                  <div className="relative">
                    <div id={scannerRegionId} className="w-full h-72 border-2 border-dashed border-primary/30 rounded-xl bg-neutral-900 overflow-hidden"></div>
                    <div className="absolute top-4 left-4 bg-primary/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Scanning...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Enter Book DDC or ID</label>
                      <input
                        type="text"
                        value={manualIdentifier}
                        onChange={e => setManualIdentifier(e.target.value)}
                        placeholder="e.g., 813.6 or book ID"
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                        disabled={loading}
                      />
                    </div>
                    <div className="relative flex items-center">
                      <div className="flex-grow border-t border-neutral-300"></div>
                      <span className="flex-shrink mx-4 text-neutral-500 text-sm font-medium">OR</span>
                      <div className="flex-grow border-t border-neutral-300"></div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">Search and Select Book</label>
                      <SearchableSelect
                        value={null}
                        onChange={(option: any) => {
                          if (option) {
                            setManualIdentifier('');
                            setScannedBook(option.data);
                            setMessage({ type: 'info', text: `Book found: ${option.label}` });
                          }
                        }}
                        placeholder="Type to search by title, author, DDC..."
                        tableName="books"
                        labelField="title"
                        searchFields={['title', 'author', 'ddc_number']}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="book-found"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="space-y-4"
              >
                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                  <h3 className="font-bold text-green-900 text-lg">{scannedBook.title}</h3>
                  <p className="text-sm text-green-700 mt-1">by {scannedBook.author}</p>
                </div>

                <div className="flex items-center gap-2 bg-neutral-100 rounded-xl p-1.5">
                  <button
                    onClick={() => setActionType('issue')}
                    className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${actionType === 'issue' ? 'bg-white shadow-md text-primary' : 'text-neutral-600'}`}
                  >
                    Issue Book
                  </button>
                  <button
                    onClick={() => setActionType('return')}
                    className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${actionType === 'return' ? 'bg-white shadow-md text-primary' : 'text-neutral-600'}`}
                  >
                    Return Book
                  </button>
                </div>

                {actionType === 'issue' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <label className="block text-sm font-semibold text-neutral-700 mb-2">Select Member *</label>
                    <SearchableSelect
                      value={selectedMember}
                      onChange={setSelectedMember}
                      placeholder="Search for a member..."
                      tableName="members"
                      labelField="name"
                      searchFields={['name', 'email', 'register_number']}
                      required
                    />
                  </motion.div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetState}
                    className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-xl font-semibold text-neutral-700 transition-colors"
                  >
                    Scan Another
                  </button>
                  <button
                    onClick={handleFinalAction}
                    disabled={loading}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : (actionType === 'issue' ? 'Issue Book' : 'Confirm Return')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mt-4 p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
                  message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
                    'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
              >
                {message.type === 'error' && <AlertTriangle size={18} />}
                {message.type === 'success' && <CheckCircle size={18} />}
                {loading && message.type === 'info' && <Loader2 className="animate-spin" size={18} />}
                <span>{message.text}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default ScanQRModal;
