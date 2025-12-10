import React, { useState } from 'react';
import { supabase, type Member } from '../lib/supabase';
import { Search, Loader2, User, BookOpen, AlertTriangle, KeyRound, Check, XCircle, Clock, DollarSign, AlertCircle, TrendingUp, Award } from 'lucide-react';
import Header from './Header';
import { motion } from 'framer-motion';

interface HistoryItem {
    id: string;
    issue_date: string;
    due_date: string;
    return_date?: string;
    status: 'issued' | 'returned' | 'overdue' | 'lost';
    fine_amount: number;
    fine_status?: string;
    books: {
        title: string;
        author: string;
    } | null;
}

const MemberLookupPage: React.FC = () => {
    const [registerNumber, setRegisterNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [member, setMember] = useState<Member | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);

    const [searchResults, setSearchResults] = useState<Member[]>([]);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!registerNumber.trim()) return;

        setLoading(true);
        setError(null);
        setMember(null);
        setHistory([]);
        setSearchResults([]);

        try {
            const searchTerm = registerNumber.trim();

            // Try to find by register number first (exact match)
            let { data: memberData } = await supabase
                .from('members')
                .select('*')
                .eq('register_number', searchTerm)
                .single();

            if (!memberData) {
                // If not found, try to find by name (ilike)
                const { data: nameData } = await supabase
                    .from('members')
                    .select('*')
                    .ilike('name', `%${searchTerm}%`);

                if (nameData && nameData.length > 0) {
                    if (nameData.length === 1) {
                        memberData = nameData[0];
                    } else {
                        setSearchResults(nameData);
                        setLoading(false);
                        return;
                    }
                }
            }

            if (!memberData) {
                setError('No member found with this Register Number or Name.');
                setLoading(false);
                return;
            }

            selectMember(memberData);

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            setLoading(false);
        }
    };

    const selectMember = async (selectedMember: Member) => {
        setMember(selectedMember);
        setSearchResults([]);
        setLoading(true);

        try {
            // Fetch COMPLETE history
            const { data: historyData, error: historyError } = await supabase
                .from('circulation')
                .select('id, issue_date, due_date, return_date, status, fine_amount, fine_status, books(title, author)')
                .eq('member_id', selectedMember.id)
                .order('issue_date', { ascending: false });

            if (historyError) throw historyError;

            // Transform data to match HistoryItem interface
            const formattedHistory: HistoryItem[] = (historyData as any[]).map(item => ({
                ...item,
                books: Array.isArray(item.books) ? item.books[0] : item.books
            }));

            setHistory(formattedHistory);
        } catch (err: any) {
            setError(err.message || 'Error fetching history.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100">
            <Header />
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Search Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-primary to-primary-dark rounded-3xl shadow-2xl p-8 sm:p-12 mb-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-32 -mb-32" />

                    <div className="relative z-10">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                                <Award className="text-white" size={20} />
                                <span className="text-white font-semibold text-sm">Member Portal</span>
                            </div>
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-3">Check Your Status</h1>
                            <p className="text-lg text-white/90 max-w-2xl mx-auto">
                                Enter your Register Number or Name to view your complete borrowing history and status
                            </p>
                        </div>

                        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                            <div className="relative">
                                <KeyRound className="absolute left-5 top-1/2 transform -translate-y-1/2 text-white/60" size={24} />
                                <input
                                    type="text"
                                    value={registerNumber}
                                    onChange={(e) => setRegisterNumber(e.target.value)}
                                    placeholder="Enter your Register Number (e.g., LIB-0001) or Name"
                                    className="w-full pl-14 pr-32 py-5 bg-white/95 backdrop-blur-sm border-2 border-white/20 rounded-2xl focus:ring-4 focus:ring-white/30 focus:border-white shadow-xl text-lg font-medium placeholder:text-neutral-400 outline-none transition-all"
                                />
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-primary px-6 py-3 rounded-xl font-bold hover:bg-neutral-100 transition-all disabled:opacity-50 shadow-lg flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
                                    <span className="hidden sm:inline">Search</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 text-red-800 px-6 py-4 rounded-2xl flex items-center gap-4 shadow-lg mb-6"
                    >
                        <div className="bg-red-500 p-2 rounded-full">
                            <AlertTriangle size={24} className="text-white" />
                        </div>
                        <span className="font-semibold">{error}</span>
                    </motion.div>
                )}

                {searchResults.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-xl border-2 border-neutral-200 overflow-hidden mb-6"
                    >
                        <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-neutral-200">
                            <h3 className="font-bold text-xl text-neutral-800 flex items-center gap-2">
                                <User className="text-primary" size={24} />
                                Select Member
                            </h3>
                            <p className="text-sm text-neutral-600 mt-1">Multiple members found matching your search</p>
                        </div>
                        <ul className="divide-y divide-neutral-200">
                            {searchResults.map(result => (
                                <li key={result.id} className="hover:bg-neutral-50 transition-colors">
                                    <button onClick={() => selectMember(result)} className="w-full text-left p-6 flex justify-between items-center group">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                                                <User className="text-primary" size={24} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg text-neutral-900">{result.name}</p>
                                                <p className="text-sm text-neutral-600 flex items-center gap-2">
                                                    <span className="bg-neutral-100 px-2 py-1 rounded-md font-medium">{result.class || 'N/A'}</span>
                                                    <span>•</span>
                                                    <span className="font-mono">{result.register_number}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-primary font-bold text-sm group-hover:translate-x-1 transition-transform">
                                            View Status →
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}

                {member && (() => {
                    // Calculate penalty totals
                    const pendingFines = history.filter(h => h.fine_amount > 0 && h.fine_status === 'unpaid');
                    const paidFines = history.filter(h => h.fine_amount > 0 && h.fine_status === 'paid');
                    const totalPending = pendingFines.reduce((sum, h) => sum + h.fine_amount, 0);
                    const totalPaid = paidFines.reduce((sum, h) => sum + h.fine_amount, 0);
                    const currentlyBorrowed = history.filter(h => h.status === 'issued').length;
                    const totalBorrowed = history.length;

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Member Details Card */}
                            <div className="bg-white rounded-2xl shadow-xl border-2 border-neutral-200 overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-neutral-200">
                                    <h2 className="text-2xl font-bold text-neutral-800 flex items-center gap-3">
                                        <div className="bg-primary p-2 rounded-xl">
                                            <User className="text-white" size={24} />
                                        </div>
                                        Member Details
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-200">
                                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">Name</p>
                                            <p className="text-xl font-bold text-blue-900">{member.name}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border-2 border-purple-200">
                                            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-1">Register No</p>
                                            <p className="text-xl font-bold text-purple-900 font-mono">{member.register_number}</p>
                                        </div>
                                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-xl border-2 border-amber-200">
                                            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Class</p>
                                            <p className="text-xl font-bold text-amber-900">{member.class || 'N/A'}</p>
                                        </div>
                                        <div className={`bg-gradient-to-br p-4 rounded-xl border-2 ${member.status === 'active'
                                                ? 'from-green-50 to-green-100 border-green-200'
                                                : 'from-red-50 to-red-100 border-red-200'
                                            }`}>
                                            <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${member.status === 'active' ? 'text-green-600' : 'text-red-600'
                                                }`}>Status</p>
                                            <p className={`text-xl font-bold ${member.status === 'active' ? 'text-green-900' : 'text-red-900'
                                                }`}>{member.status.toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Statistics Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl text-white">
                                    <div className="flex items-center justify-between mb-3">
                                        <BookOpen size={32} className="opacity-80" />
                                        <TrendingUp size={20} className="opacity-60" />
                                    </div>
                                    <p className="text-sm font-semibold opacity-90 mb-1">Currently Borrowed</p>
                                    <p className="text-4xl font-extrabold">{currentlyBorrowed}</p>
                                </div>

                                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-xl text-white">
                                    <div className="flex items-center justify-between mb-3">
                                        <Clock size={32} className="opacity-80" />
                                        <TrendingUp size={20} className="opacity-60" />
                                    </div>
                                    <p className="text-sm font-semibold opacity-90 mb-1">Total Borrowed</p>
                                    <p className="text-4xl font-extrabold">{totalBorrowed}</p>
                                </div>

                                {totalPending > 0 && (
                                    <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-xl text-white">
                                        <div className="flex items-center justify-between mb-3">
                                            <AlertCircle size={32} className="opacity-80" />
                                            <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">UNPAID</span>
                                        </div>
                                        <p className="text-sm font-semibold opacity-90 mb-1">Pending Penalties</p>
                                        <p className="text-4xl font-extrabold">₹{totalPending.toFixed(2)}</p>
                                        <p className="text-xs opacity-75 mt-1">{pendingFines.length} fine{pendingFines.length !== 1 ? 's' : ''}</p>
                                    </div>
                                )}

                                {totalPaid > 0 && (
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-xl text-white">
                                        <div className="flex items-center justify-between mb-3">
                                            <DollarSign size={32} className="opacity-80" />
                                            <Check size={20} className="opacity-60" />
                                        </div>
                                        <p className="text-sm font-semibold opacity-90 mb-1">Paid Penalties</p>
                                        <p className="text-4xl font-extrabold">₹{totalPaid.toFixed(2)}</p>
                                        <p className="text-xs opacity-75 mt-1">{paidFines.length} fine{paidFines.length !== 1 ? 's' : ''}</p>
                                    </div>
                                )}
                            </div>

                            {/* Borrowing History */}
                            <div className="bg-white rounded-2xl shadow-xl border-2 border-neutral-200 overflow-hidden">
                                <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-b-2 border-neutral-200">
                                    <h2 className="text-2xl font-bold text-neutral-800 flex items-center gap-3">
                                        <div className="bg-primary p-2 rounded-xl">
                                            <Clock className="text-white" size={24} />
                                        </div>
                                        Borrowing History
                                        <span className="ml-auto bg-primary text-white px-4 py-1 rounded-full text-sm font-bold">
                                            {history.length} {history.length === 1 ? 'Record' : 'Records'}
                                        </span>
                                    </h2>
                                </div>
                                <div className="p-6">
                                    {history.length > 0 ? (
                                        <div className="overflow-x-auto -mx-6 px-6">
                                            <table className="min-w-full">
                                                <thead>
                                                    <tr className="border-b-2 border-neutral-200">
                                                        <th className="px-4 py-4 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Book</th>
                                                        <th className="px-4 py-4 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Issue Date</th>
                                                        <th className="px-4 py-4 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Due Date</th>
                                                        <th className="px-4 py-4 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Return Date</th>
                                                        <th className="px-4 py-4 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Status</th>
                                                        <th className="px-4 py-4 text-left text-xs font-bold text-neutral-600 uppercase tracking-wider">Penalty</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-neutral-200">
                                                    {history.map((item) => {
                                                        const isOverdue = item.status === 'issued' && new Date(item.due_date) < new Date();
                                                        const hasFine = item.fine_amount > 0;
                                                        return (
                                                            <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                                                                <td className="px-4 py-4">
                                                                    <div className="font-bold text-neutral-900">{item.books?.title}</div>
                                                                    <div className="text-xs text-neutral-500">{item.books?.author}</div>
                                                                </td>
                                                                <td className="px-4 py-4 text-sm text-neutral-600 font-medium">{new Date(item.issue_date).toLocaleDateString()}</td>
                                                                <td className="px-4 py-4 text-sm text-neutral-600 font-medium">{new Date(item.due_date).toLocaleDateString()}</td>
                                                                <td className="px-4 py-4 text-sm text-neutral-600 font-medium">{item.return_date ? new Date(item.return_date).toLocaleDateString() : '-'}</td>
                                                                <td className="px-4 py-4">
                                                                    {item.status === 'returned' ? (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border-2 border-green-200">
                                                                            <Check size={14} /> Returned
                                                                        </span>
                                                                    ) : isOverdue ? (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border-2 border-red-200 animate-pulse">
                                                                            <XCircle size={14} /> Overdue
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border-2 border-blue-200">
                                                                            <BookOpen size={14} /> Issued
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-4">
                                                                    {hasFine ? (
                                                                        <div className="flex flex-col">
                                                                            <span className="font-bold text-red-600 text-lg">₹{item.fine_amount}</span>
                                                                            <span className={`text-[10px] font-bold uppercase ${item.fine_status === 'paid' ? 'text-green-600' : 'text-red-600'
                                                                                }`}>{item.fine_status}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-neutral-400 font-medium">-</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-16 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                                            <div className="bg-neutral-200 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                                                <BookOpen className="text-neutral-400" size={40} />
                                            </div>
                                            <p className="text-lg font-bold text-neutral-600 mb-1">No borrowing history found</p>
                                            <p className="text-sm text-neutral-500">You haven't borrowed any books yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })()}
            </main>
        </div>
    );
};

export default MemberLookupPage;
