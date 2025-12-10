import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Search, Plus, BookOpen, QrCode, Printer, Users, DollarSign, X, BookHeart, FileText, MessageSquare, RefreshCw, Edit, Trash2, Folder, Download, Star, CheckCircle2, Calendar, AlertTriangle, User, Award, Hash, TrendingUp } from 'lucide-react';
import { supabase, type Book, type Circulation, type Member, type Feedback, type Category } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import MemberModal from './MemberModal';
import IssueBookModal from './IssueBookModal';
import AddBookForm from './AddBookForm';
import CategoryManager from './CategoryManager';
import ScanQRModal from './ScanQRModal';
import BookQRCodeModal from './BookQRCodeModal';
import BulkQRDownloadModal from './BulkQRDownloadModal';
import BookModal from './BookModal';
import PrintMemberCardModal from './PrintMemberCardModal';
import Pagination from './Pagination';
import ConfirmationModal from './ConfirmationModal';
import { useNotification } from '../contexts/NotificationContext';
import Spinner from './Spinner';

// Lazy load heavy components for better performance
const ReadWithUsManager = lazy(() => import('./ReadWithUsManager'));
const ReportsPage = lazy(() => import('./ReportsPage'));
const FinesPage = lazy(() => import('./FinesPage'));
const PrintMembersModal = lazy(() => import('./PrintMembersModal'));

// Debounce hook for search optimization
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

type TabType = 'Circulation' | 'Book Collection' | 'Members' | 'Penalty' | 'Feedback' | 'Reports' | 'Read With Us';
type BookStatusFilter = 'Available' | 'Issued' | 'Overdue';

interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => Promise<void>;
}

const AddBookModal = ({ categories, onSave, onClose }: { categories: Category[], onSave: () => void, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center p-5 border-b border-neutral-200">
        <h2 className="text-xl font-bold text-neutral-800">Add New Book</h2>
        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 transition-colors">
          <X size={24} />
        </button>
      </div>
      <div className="flex-grow overflow-y-auto p-6">
        <AddBookForm categories={categories} onSave={() => { onSave(); onClose(); }} />
      </div>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<TabType>('Circulation');
  const [activeFilter, setActiveFilter] = useState<BookStatusFilter>('Available');

  const [books, setBooks] = useState<Book[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [circulation, setCirculation] = useState<Circulation[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ available: 0, issued: 0, overdue: 0 });

  // Modal states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [showBookModal, setShowBookModal] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [showAddBookModal, setShowAddBookModal] = useState(false);

  const [showIssueBookModal, setShowIssueBookModal] = useState(false);

  const [showScanModal, setShowScanModal] = useState(false);
  const [showBookQRModal, setShowBookQRModal] = useState(false);
  const [selectedBookForQR, setSelectedBookForQR] = useState<Book | null>(null);
  const [showBulkQRModal, setShowBulkQRModal] = useState(false);

  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showPrintMembersModal, setShowPrintMembersModal] = useState(false);
  const [showPrintCardModal, setShowPrintCardModal] = useState(false);

  // Search and Filter states
  const [circulationSearch, setCirculationSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<'all' | 'book_review' | 'suggestion'>('all');
  const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Debounced search values for performance
  const debouncedCirculationSearch = useDebounce(circulationSearch, 300);
  const debouncedBookSearch = useDebounce(bookSearch, 300);
  const debouncedMemberSearch = useDebounce(memberSearch, 300);
  const debouncedFeedbackSearch = useDebounce(feedbackSearch, 300);

  // Pagination
  const [bookCurrentPage, setBookCurrentPage] = useState(1);
  const [bookRowsPerPage, setBookRowsPerPage] = useState(50);

  // Confirmation Modal State
  const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, title: '', message: '', onConfirm: async () => { } });
  const [isConfirming, setIsConfirming] = useState(false);

  const tabs: { id: TabType, icon: React.ElementType }[] = [
    { id: 'Circulation', icon: RefreshCw },
    { id: 'Book Collection', icon: BookOpen },
    { id: 'Members', icon: Users },
    { id: 'Penalty', icon: DollarSign },
    { id: 'Feedback', icon: MessageSquare },
    { id: 'Reports', icon: FileText },
    { id: 'Read With Us', icon: BookHeart }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: booksData, error: booksError },
        { data: membersData, error: membersError },
        { data: circulationData, error: circError },
        { data: feedbackData, error: feedbackError },
        { data: categoriesData, error: catError },
      ] = await Promise.all([
        supabase.from('books').select('*, categories(name)').order('created_at', { ascending: false }).limit(10000),
        supabase.from('members').select('*').order('register_number', { ascending: true }),
        supabase.from('circulation').select('*, books(*), members(*)').order('updated_at', { ascending: false }),
        supabase.from('feedback').select('*, members(name), books(title)').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name'),
      ]);

      if (booksError || membersError || circError || feedbackError || catError) {
        throw new Error('Failed to fetch initial data. Please check your connection and permissions.');
      }

      const allCirculation = circulationData || [];
      const finesData = allCirculation.filter(c => c.status === 'issued' && new Date(c.due_date) < new Date());

      setBooks(booksData || []);
      setMembers(membersData || []);
      setCirculation(allCirculation);
      setFeedback(feedbackData || []);
      setCategories(categoriesData || []);

      const availableCount = booksData?.reduce((sum, book) => sum + book.available_copies, 0) || 0;
      const issuedCount = allCirculation.filter(c => c.status === 'issued').length || 0;
      const overdueCount = finesData.length;

      setCounts({ available: availableCount, issued: issuedCount, overdue: overdueCount });
    } catch (error: any) {
      addNotification(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('db-changes').on('postgres_changes', { event: '*', schema: 'public' }, fetchData).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  useEffect(() => { setBookCurrentPage(1); }, [bookSearch, bookRowsPerPage]);

  const confirmAction = (title: string, message: string, onConfirm: () => Promise<void>) => {
    setConfirmation({ isOpen: true, title, message, onConfirm });
  };

  const handleConfirmation = async () => {
    setIsConfirming(true);
    await confirmation.onConfirm();
    setIsConfirming(false);
    setConfirmation({ isOpen: false, title: '', message: '', onConfirm: async () => { } });
  };

  const handleDeleteMember = (memberId: string) => {
    confirmAction(
      'Delete Member?',
      'Are you sure? This will delete the member and all associated records. This action cannot be undone.',
      async () => {
        const { error } = await supabase.from('members').delete().eq('id', memberId);
        if (error) addNotification(`Error deleting member: ${error.message} `, 'error');
        else addNotification('Member deleted successfully.', 'success');
      }
    );
  };

  const handleDeleteBook = (bookId: string) => {
    confirmAction(
      'Delete Book?',
      'Are you sure you want to delete this book? This action cannot be undone.',
      async () => {
        const { error } = await supabase.from('books').delete().eq('id', bookId);
        if (error) addNotification(`Error deleting book: ${error.message} `, 'error');
        else addNotification('Book deleted successfully.', 'success');
      }
    );
  };

  const handleShowQR = (book: Book) => { setSelectedBookForQR(book); setShowBookQRModal(true); };

  const handleReturnBook = async (circulationId: string) => {
    const { error } = await supabase.rpc('return_book', { p_circulation_id: circulationId });
    if (error) addNotification('Error returning book.', 'error');
    else addNotification('Book returned successfully.', 'success');
  };

  const handleRenewBook = (circulationId: string) => {
    confirmAction(
      'Renew Book?',
      'Are you sure you want to renew this book for 14 more days?',
      async () => {
        const newDueDate = new Date();
        newDueDate.setDate(newDueDate.getDate() + 14);
        const { error } = await supabase.from('circulation').update({ due_date: newDueDate.toISOString() }).eq('id', circulationId);
        if (error) addNotification(`Error renewing book: ${error.message} `, 'error');
        else addNotification('Book renewed successfully!', 'success');
      }
    );
  };

  const updateFeedbackStatus = async (id: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
    if (error) addNotification(`Failed to update feedback: ${error.message} `, 'error');
    else addNotification('Feedback status updated.', 'success');
  };

  const handlePrintBooks = () => {
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write('<html><head><title>Book Collection Report</title>');
      printWindow.document.write(`
  <style>
              body { font - family: sans - serif; padding: 2rem; }
              h1 { font - size: 24px; margin - bottom: 1rem; text - align: center; }
              table { width: 100 %; border - collapse: collapse; font - size: 12px; }
th, td { border: 1px solid #d1d5db; padding: 8px; text - align: left; }
              th { background - color: #f3f4f6; }
            </style >
  `);
      printWindow.document.write('</head><body><h1>Book Collection Report</h1>');

      const table = document.getElementById('book-collection-table')?.cloneNode(true) as HTMLElement;
      // Remove actions column
      table.querySelectorAll('.no-print-in-popup').forEach(el => el.remove());

      printWindow.document.write(table.outerHTML);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const circulationData = useMemo(() => {
    let data: (Book | Circulation)[] = [];
    switch (activeFilter) {
      case 'Available': data = books.filter(b => b.available_copies > 0); break;
      case 'Issued': data = circulation.filter(c => c.status === 'issued' && new Date(c.due_date) >= new Date()); break;
      case 'Overdue': data = circulation.filter(c => c.status === 'issued' && new Date(c.due_date) < new Date()); break;
    }
    if (!debouncedCirculationSearch) return data;
    const lowerSearch = debouncedCirculationSearch.toLowerCase();
    return data.filter(item =>
      ('title' in item && (item.title.toLowerCase().includes(lowerSearch) || item.author.toLowerCase().includes(lowerSearch) || item.ddc_number?.toLowerCase().includes(lowerSearch))) ||
      ('book_id' in item && (item.books?.title.toLowerCase().includes(lowerSearch) || item.members?.name.toLowerCase().includes(lowerSearch) || item.books?.ddc_number?.toLowerCase().includes(lowerSearch)))
    );
  }, [activeFilter, books, circulation, debouncedCirculationSearch]);

  const filteredBooks = useMemo(() => books.filter(book => {
    const lowerSearch = debouncedBookSearch.toLowerCase();
    return book.title.toLowerCase().includes(lowerSearch) ||
      book.author.toLowerCase().includes(lowerSearch) ||
      book.categories?.name?.toLowerCase().includes(lowerSearch) ||
      book.ddc_number?.toLowerCase().includes(lowerSearch);
  }), [books, debouncedBookSearch]);

  const paginatedBooks = useMemo(() => {
    const startIndex = (bookCurrentPage - 1) * bookRowsPerPage;
    return filteredBooks.slice(startIndex, startIndex + bookRowsPerPage);
  }, [filteredBooks, bookCurrentPage, bookRowsPerPage]);

  const filteredMembers = useMemo(() => members.filter(member =>
    !debouncedMemberSearch || (member.name.toLowerCase().includes(debouncedMemberSearch.toLowerCase()) || member.email.toLowerCase().includes(debouncedMemberSearch.toLowerCase()) || member.register_number?.toLowerCase().includes(debouncedMemberSearch.toLowerCase()) || member.class?.toLowerCase().includes(debouncedMemberSearch.toLowerCase()))
  ), [members, debouncedMemberSearch]);

  const filteredFeedback = useMemo(() => feedback.filter(item => {
    const matchesSearch = !debouncedFeedbackSearch ||
      item.members?.name?.toLowerCase().includes(debouncedFeedbackSearch.toLowerCase()) ||
      item.books?.title?.toLowerCase().includes(debouncedFeedbackSearch.toLowerCase()) ||
      item.suggestion_title?.toLowerCase().includes(debouncedFeedbackSearch.toLowerCase()) ||
      item.review?.toLowerCase().includes(debouncedFeedbackSearch.toLowerCase()) ||
      item.suggestion_reason?.toLowerCase().includes(debouncedFeedbackSearch.toLowerCase());

    const matchesType = feedbackTypeFilter === 'all' || item.feedback_type === feedbackTypeFilter;
    const matchesStatus = feedbackStatusFilter === 'all' || item.status === feedbackStatusFilter;

    return matchesSearch && matchesType && matchesStatus;
  }), [feedback, debouncedFeedbackSearch, feedbackTypeFilter, feedbackStatusFilter]);

  const renderCirculationItem = (item: Book | Circulation) => {
    if (activeFilter === 'Available') {
      const book = item as Book;
      return (
        <motion.div
          key={book.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="group bg-gradient-to-br from-white via-green-50/30 to-emerald-50/40 border-2 border-green-200 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-shadow will-change-transform"
        >
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4">
            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-white shadow-lg flex-shrink-0">
                <BookOpen size={24} className="sm:hidden" />
                <BookOpen size={28} className="hidden sm:block" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base sm:text-xl text-neutral-900 mb-1 sm:mb-2 line-clamp-2">{book.title}</h3>
                <p className="text-xs sm:text-sm text-neutral-600 mb-2 sm:mb-3 truncate">by <span className="font-semibold text-neutral-800">{book.author}</span></p>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                  <span className="bg-white border border-neutral-200 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full font-bold text-neutral-700 flex items-center gap-1 sm:gap-1.5">
                    <Hash size={12} className="text-primary sm:w-3.5 sm:h-3.5" />
                    <span className="hidden xs:inline">DDC: </span>{book.ddc_number || 'N/A'}
                  </span>
                  <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full font-bold flex items-center gap-1 sm:gap-1.5 shadow-md">
                    <CheckCircle2 size={14} className="sm:w-4 sm:h-4" />
                    {book.available_copies} Available
                  </span>
                  {book.categories?.name && (
                    <span className="bg-primary/10 text-primary px-2 py-1 sm:px-3 sm:py-1.5 rounded-full font-bold hidden sm:inline-block">
                      {book.categories.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    const circ = item as Circulation;
    const isOverdue = new Date(circ.due_date) < new Date();
    const memberClass = circ.members?.class;

    return (
      <motion.div
        key={circ.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className={`group bg-gradient-to-br ${isOverdue ? 'from-white via-red-50/30 to-rose-50/40 border-red-300' : 'from-white via-blue-50/30 to-indigo-50/40 border-blue-300'} border-2 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-md hover:shadow-xl transition-shadow will-change-transform`}
      >
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <div className={`bg-gradient-to-br ${isOverdue ? 'from-red-500 to-rose-600' : 'from-blue-500 to-indigo-600'} p-3 sm:p-4 rounded-xl sm:rounded-2xl text-white shadow-lg flex-shrink-0`}>
              <BookOpen size={24} className="sm:hidden" />
              <BookOpen size={28} className="hidden sm:block" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base sm:text-xl text-neutral-900 mb-1 sm:mb-2 line-clamp-2">{circ.books?.title}</h3>
              <div className="space-y-1.5 sm:space-y-2 mb-2 sm:mb-3">
                <p className="text-xs sm:text-sm text-neutral-600 flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <User size={12} className="text-primary flex-shrink-0 sm:w-3.5 sm:h-3.5" />
                  <span className="font-bold text-neutral-800 truncate">{circ.members?.name}</span>
                  {memberClass && (
                    <>
                      <span className="hidden sm:inline text-neutral-400">•</span>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap">
                        {memberClass}
                      </span>
                    </>
                  )}
                </p>
                {circ.members?.register_number && (
                  <p className="text-xs text-neutral-500 flex items-center gap-1.5 sm:gap-2">
                    <Award size={10} className="text-neutral-400 flex-shrink-0 sm:w-3 sm:h-3" />
                    <span className="font-mono font-semibold truncate">{circ.members.register_number}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <span className="bg-white border border-neutral-200 px-2 py-1 sm:px-3 sm:py-1.5 rounded-full font-bold text-neutral-700 flex items-center gap-1 sm:gap-1.5">
                  <Hash size={12} className="text-primary sm:w-3.5 sm:h-3.5" />
                  <span className="hidden xs:inline">DDC: </span>{circ.books?.ddc_number || 'N/A'}
                </span>
                <span className={`px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full font-bold flex items-center gap-1 sm:gap-1.5 shadow-md ${isOverdue ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'}`}>
                  <Calendar size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Due: </span>{new Date(circ.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                {isOverdue && (
                  <span className="bg-red-600 text-white px-2.5 py-1 sm:px-4 sm:py-1.5 rounded-full font-bold text-xs flex items-center gap-1 sm:gap-1.5 animate-pulse shadow-lg">
                    <AlertTriangle size={12} className="sm:w-3.5 sm:h-3.5" />
                    OVERDUE
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-neutral-200">
            <button
              onClick={() => handleRenewBook(circ.id)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <RefreshCw size={14} className="sm:w-4 sm:h-4" /> Renew
            </button>
            <button
              onClick={() => handleReturnBook(circ.id)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <CheckCircle2 size={14} className="sm:w-4 sm:h-4" /> Return
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        title={confirmation.title}
        message={confirmation.message}
        onConfirm={handleConfirmation}
        onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
        isConfirming={isConfirming}
      />
      <header className="bg-gradient-to-r from-primary to-primary-dark shadow-lg border-b sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl shadow-lg"><BookOpen size={22} className="text-white" /></div>
              <span className="hidden sm:inline">Admin Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
            </h1>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowPrintMembersModal(true)} className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all" title="Print Members"><Printer size={20} /></button>
              <button onClick={handleLogout} className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"><LogOut size={18} /> <span className="hidden sm:inline">Logout</span></button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row max-w-screen-2xl mx-auto">
        {/* Sidebar Navigation */}
        <nav className="w-full md:w-64 bg-gradient-to-b from-neutral-50 to-white border-r border-neutral-200 min-h-[calc(100vh-64px)] hidden md:block shadow-sm">
          <div className="p-4 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all transform hover:scale-105 ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30'
                  : 'text-neutral-600 hover:bg-white hover:text-primary hover:shadow-md'
                  }`}
              >
                <tab.icon size={18} />
                {tab.id === 'Penalty' ? 'Penalty Management' : tab.id}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile Navigation */}
        <nav className="md:hidden bg-gradient-to-r from-neutral-50 to-white border-b overflow-x-auto shadow-sm">
          <div className="flex p-3 space-x-2 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${activeTab === tab.id
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/30'
                  : 'bg-white text-neutral-600 hover:text-primary hover:shadow-md'
                  }`}
              >
                <tab.icon size={16} />
                {tab.id === 'Penalty' ? 'Penalty' : tab.id}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
          {activeTab === 'Circulation' && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-white to-neutral-50 rounded-2xl shadow-lg border border-neutral-200 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-neutral-900 mb-2">Borrow & Return Books</h2>
                    <p className="text-neutral-600">Manage book circulation efficiently</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setShowScanModal(true)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                      <QrCode size={20} /> Quick Scan
                    </button>
                    <button
                      onClick={() => setShowIssueBookModal(true)}
                      className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                      <Plus size={20} /> Issue Book
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-3">
                  {(['Available', 'Issued', 'Overdue'] as BookStatusFilter[]).map(filter => {
                    const isActive = activeFilter === filter;
                    const count = counts[filter.toLowerCase() as keyof typeof counts];

                    return (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`relative px-6 py-3 rounded-xl font-bold text-sm transition-all transform hover:scale-105 ${isActive
                          ? filter === 'Available'
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                            : filter === 'Issued'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                              : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                          : 'bg-white text-neutral-700 border-2 border-neutral-200 hover:border-neutral-300 hover:shadow-md'
                          }`}
                      >
                        <span className="flex items-center gap-2">
                          {filter}
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-white/20' : 'bg-neutral-100'
                            }`}>
                            {count}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={22} />
                <input
                  type="text"
                  placeholder="Search books, members, DDC number..."
                  value={circulationSearch}
                  onChange={(e) => setCirculationSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border-2 border-neutral-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-neutral-900 placeholder:text-neutral-400 shadow-sm"
                />
              </div>

              {/* Results Section */}
              <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 min-h-[500px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Spinner />
                    <p className="mt-4 text-neutral-600 font-medium">Loading circulation data...</p>
                  </div>
                ) : circulationData.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-4">
                      {circulationData.map(renderCirculationItem)}
                    </div>
                  </AnimatePresence>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-20 text-neutral-400"
                  >
                    <div className="bg-neutral-100 p-6 rounded-full mb-4">
                      <BookOpen size={48} className="text-neutral-300" />
                    </div>
                    <p className="text-xl font-bold text-neutral-600 mb-2">No Results Found</p>
                    <p className="text-neutral-500">Try adjusting your search or filter</p>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Book Collection' && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-white to-neutral-50 rounded-2xl shadow-lg border-2 border-neutral-200 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
                      <div className="bg-gradient-to-br from-primary to-primary-dark p-2 rounded-xl">
                        <BookOpen size={28} className="text-white" />
                      </div>
                      Book Collection
                    </h2>
                    <p className="text-neutral-600">Manage your library's book inventory</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={handlePrintBooks} className="bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-md hover:shadow-lg">
                      <Printer size={18} /> Print List
                    </button>
                    <button onClick={() => setShowAddBookModal(true)} className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-md hover:shadow-lg">
                      <Plus size={18} /> Add Book
                    </button>
                    <button onClick={() => setShowManageCategoriesModal(true)} className="bg-gradient-to-r from-secondary to-secondary-dark hover:from-secondary-dark hover:to-secondary text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-md hover:shadow-lg">
                      <Folder size={18} /> Categories
                    </button>
                    <button onClick={() => setShowBulkQRModal(true)} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-md hover:shadow-lg">
                      <Download size={18} /> Bulk QRs
                    </button>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 shadow-xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <BookOpen size={28} className="opacity-80" />
                      <TrendingUp size={20} className="opacity-60" />
                    </div>
                    <p className="text-sm font-semibold opacity-90 mb-1">Total Books</p>
                    <p className="text-4xl font-extrabold">{books.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle2 size={28} className="opacity-80" />
                      <Award size={20} className="opacity-60" />
                    </div>
                    <p className="text-sm font-semibold opacity-90 mb-1">Available</p>
                    <p className="text-4xl font-extrabold">{books.filter(b => b.available_copies > 0).length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 shadow-xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <BookHeart size={28} className="opacity-80" />
                      <TrendingUp size={20} className="opacity-60" />
                    </div>
                    <p className="text-sm font-semibold opacity-90 mb-1">Issued</p>
                    <p className="text-4xl font-extrabold">{books.filter(b => b.available_copies === 0).length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 shadow-xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Folder size={28} className="opacity-80" />
                      <Award size={20} className="opacity-60" />
                    </div>
                    <p className="text-sm font-semibold opacity-90 mb-1">Categories</p>
                    <p className="text-4xl font-extrabold">{categories.length}</p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={22} />
                  <input
                    type="text"
                    placeholder="Search by title, author, category, DDC number..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-neutral-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-neutral-900 placeholder:text-neutral-400 shadow-sm font-medium"
                  />
                </div>

                {/* Rows per page */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <label htmlFor="book-rows-per-page" className="text-sm font-bold text-neutral-700">Show:</label>
                    <select
                      id="book-rows-per-page"
                      value={bookRowsPerPage}
                      onChange={e => setBookRowsPerPage(Number(e.target.value))}
                      className="px-4 py-2 border-2 border-neutral-200 rounded-lg bg-white text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={200}>200</option>
                      <option value={400}>400</option>
                    </select>
                  </div>
                  <p className="text-sm text-neutral-600 font-medium">
                    Showing <span className="font-bold text-primary">{filteredBooks.length}</span> books
                  </p>
                </div>
              </div>

              {/* Table Section */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-neutral-200 overflow-hidden">
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Spinner />
                      <p className="mt-4 text-neutral-600 font-medium">Loading books...</p>
                    </div>
                  ) : (
                    <>
                      <table id="book-collection-table" className="min-w-full divide-y divide-neutral-200">
                        <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100 sticky top-0">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">S.No.</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">Title</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">Author</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">DDC</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">Copies</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider no-print-in-popup">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-neutral-200">
                          {paginatedBooks.map((book, index) => (
                            <tr key={book.id} className="hover:bg-neutral-50 transition-colors group">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 font-medium">{(bookCurrentPage - 1) * bookRowsPerPage + index + 1}</td>
                              <td className="px-6 py-4 text-sm font-bold text-neutral-900 group-hover:text-primary transition-colors">{book.title}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{book.author}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-xs">
                                  {book.categories?.name || 'N/A'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600 font-mono">{book.ddc_number || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`px-3 py-1 rounded-full font-bold text-xs ${book.available_copies > 0
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                                  }`}>
                                  {book.available_copies} / {book.total_copies}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print-in-popup">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => { setEditingBook(book); setShowBookModal(true); }}
                                    className="text-primary hover:text-primary-dark hover:scale-110 transition-all"
                                    title="Edit Book"
                                  >
                                    <Edit size={20} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBook(book.id)}
                                    className="text-red-500 hover:text-red-700 hover:scale-110 transition-all"
                                    title="Delete Book"
                                  >
                                    <Trash2 size={20} />
                                  </button>
                                  <button
                                    onClick={() => handleShowQR(book)}
                                    className="text-neutral-500 hover:text-primary hover:scale-110 transition-all"
                                    title="Show QR Code"
                                  >
                                    <QrCode size={20} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="p-4 border-t-2 border-neutral-200 bg-neutral-50">
                        <Pagination
                          currentPage={bookCurrentPage}
                          totalCount={filteredBooks.length}
                          pageSize={bookRowsPerPage}
                          onPageChange={page => setBookCurrentPage(page)}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Members' && (
            <div className="space-y-6">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-white to-neutral-50 rounded-2xl shadow-lg border-2 border-neutral-200 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-neutral-900 mb-2 flex items-center gap-3">
                      <div className="bg-gradient-to-br from-primary to-primary-dark p-2 rounded-xl">
                        <Users size={28} className="text-white" />
                      </div>
                      Library Members
                    </h2>
                    <p className="text-neutral-600">Manage library member information</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowPrintMembersModal(true)} className="bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-md hover:shadow-lg">
                      <Printer size={18} /> Print List
                    </button>
                    <button onClick={() => setShowPrintCardModal(true)} className="bg-white border-2 border-secondary text-secondary hover:bg-secondary hover:text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-md hover:shadow-lg">
                      <QrCode size={18} /> Print Cards
                    </button>
                    <button onClick={() => { setEditingMember(null); setShowMemberModal(true); }} className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-md hover:shadow-lg">
                      <Plus size={18} /> Add Member
                    </button>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 shadow-xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Users size={28} className="opacity-80" />
                      <TrendingUp size={20} className="opacity-60" />
                    </div>
                    <p className="text-sm font-semibold opacity-90 mb-1">Total Members</p>
                    <p className="text-4xl font-extrabold">{members.length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 shadow-xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <CheckCircle2 size={28} className="opacity-80" />
                      <Award size={20} className="opacity-60" />
                    </div>
                    <p className="text-sm font-semibold opacity-90 mb-1">Active Members</p>
                    <p className="text-4xl font-extrabold">{members.filter(m => m.status === 'active').length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 shadow-xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <AlertTriangle size={28} className="opacity-80" />
                      <TrendingUp size={20} className="opacity-60" />
                    </div>
                    <p className="text-sm font-semibold opacity-90 mb-1">Inactive Members</p>
                    <p className="text-4xl font-extrabold">{members.filter(m => m.status === 'inactive').length}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-5 shadow-xl text-white">
                    <div className="flex items-center justify-between mb-2">
                      <User size={28} className="opacity-80" />
                      <Award size={20} className="opacity-60" />
                    </div>
                    <p className="text-sm font-semibold opacity-90 mb-1">New This Month</p>
                    <p className="text-4xl font-extrabold">{members.filter(m => new Date(m.created_at).getMonth() === new Date().getMonth()).length}</p>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={22} />
                  <input
                    type="text"
                    placeholder="Search by name, email, register number, or class..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-neutral-200 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 outline-none transition-all text-neutral-900 placeholder:text-neutral-400 shadow-sm font-medium"
                  />
                </div>
              </div>

              {/* Table Section */}
              <div className="bg-white rounded-2xl shadow-lg border-2 border-neutral-200 overflow-hidden">
                <div className="overflow-x-auto">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <Spinner />
                      <p className="mt-4 text-neutral-600 font-medium">Loading members...</p>
                    </div>
                  ) : filteredMembers.length > 0 ? (
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">Register ID</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">Class</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 uppercase tracking-wider no-print-in-popup">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-neutral-200">
                        {filteredMembers.map((member) => (
                          <tr key={member.id} className="hover:bg-neutral-50 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-neutral-900">{member.register_number || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                                  <User size={20} className="text-primary" />
                                </div>
                                <span className="font-bold text-neutral-900 group-hover:text-primary transition-colors">{member.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{member.phone || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-xs">
                                {member.class || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-3 py-1 rounded-full font-bold text-xs ${member.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`}>
                                {member.status?.toUpperCase() || 'ACTIVE'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium no-print-in-popup">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => { setEditingMember(member); setShowMemberModal(true); }}
                                  className="text-primary hover:text-primary-dark hover:scale-110 transition-all"
                                  title="Edit Member"
                                >
                                  <Edit size={20} />
                                </button>
                                <button
                                  onClick={() => handleDeleteMember(member.id)}
                                  className="text-red-500 hover:text-red-700 hover:scale-110 transition-all"
                                  title="Delete Member"
                                >
                                  <Trash2 size={20} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                      <div className="bg-neutral-100 p-6 rounded-full mb-4">
                        <Users size={48} className="text-neutral-300" />
                      </div>
                      <p className="text-xl font-bold text-neutral-600 mb-2">No Members Found</p>
                      <p className="text-neutral-500">Try adjusting your search or add a new member</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Penalty' && (
            <Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}>
              <FinesPage />
            </Suspense>
          )}

          {activeTab === 'Feedback' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-white to-neutral-50 rounded-2xl shadow-lg border border-neutral-200 p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-neutral-900 mb-2">Feedback & Suggestions</h2>
                    <p className="text-neutral-600">Manage user reviews and suggestions</p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-xl border-2 border-primary/20 shadow-sm">
                    <span className="text-sm text-neutral-600">Total: </span>
                    <span className="text-2xl font-bold text-primary">{filteredFeedback.length}</span>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={22} />
                  <input
                    type="text"
                    placeholder="Search feedback by member, book, or content..."
                    value={feedbackSearch}
                    onChange={(e) => setFeedbackSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border-2 border-neutral-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-neutral-900 placeholder:text-neutral-400 shadow-sm"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-neutral-700">Type:</label>
                    <select
                      value={feedbackTypeFilter}
                      onChange={(e) => setFeedbackTypeFilter(e.target.value as any)}
                      className="px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white font-medium"
                    >
                      <option value="all">All Types</option>
                      <option value="book_review">Book Reviews</option>
                      <option value="suggestion">Suggestions</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-neutral-700">Status:</label>
                    <select
                      value={feedbackStatusFilter}
                      onChange={(e) => setFeedbackStatusFilter(e.target.value as any)}
                      className="px-4 py-2 border-2 border-neutral-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white font-medium"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Feedback List */}
              <div className="bg-white rounded-2xl shadow-lg border border-neutral-200 p-6 min-h-[400px]">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <Spinner />
                    <p className="mt-4 text-neutral-600 font-medium">Loading feedback...</p>
                  </div>
                ) : filteredFeedback.length > 0 ? (
                  <div className="space-y-4">
                    {filteredFeedback.map(item => (
                      <div key={item.id} className="border-2 border-neutral-200 rounded-xl p-5 hover:shadow-md transition-all bg-gradient-to-br from-white to-neutral-50/30">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-3">
                          <div className="flex-1">
                            {item.feedback_type === 'suggestion' ? (
                              <h3 className="font-bold text-lg text-neutral-900 mb-1">
                                💡 Suggestion: "{item.suggestion_title}"
                              </h3>
                            ) : (
                              <h3 className="font-bold text-lg text-neutral-900 mb-1">
                                📚 Review for: "{item.books?.title}"
                              </h3>
                            )}
                            <p className="text-sm text-neutral-600 flex items-center gap-2">
                              <User size={14} />
                              <span className="font-semibold">{item.members?.name || 'Unknown'}</span>
                              <span className="text-neutral-400">•</span>
                              <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            </p>
                          </div>
                          <span className={`px-4 py-2 text-sm font-bold rounded-full whitespace-nowrap ${item.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200' :
                            item.status === 'approved' ? 'bg-green-100 text-green-800 border-2 border-green-200' :
                              'bg-red-100 text-red-800 border-2 border-red-200'
                            }`}>
                            {item.status.toUpperCase()}
                          </span>
                        </div>

                        {item.feedback_type === 'book_review' && item.rating && (
                          <div className="flex items-center gap-1 mb-3">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={18} className={i < item.rating! ? 'text-yellow-400 fill-current' : 'text-neutral-300'} />
                            ))}
                            <span className="ml-2 text-sm font-semibold text-neutral-600">({item.rating}/5)</span>
                          </div>
                        )}

                        {item.review && (
                          <p className="text-neutral-700 bg-white p-4 rounded-lg border border-neutral-200 mb-3 leading-relaxed">
                            {item.review}
                          </p>
                        )}

                        {item.suggestion_reason && (
                          <p className="text-neutral-700 bg-white p-4 rounded-lg border border-neutral-200 mb-3 leading-relaxed">
                            {item.suggestion_reason}
                          </p>
                        )}

                        {item.status === 'pending' && (
                          <div className="flex gap-3 mt-4 pt-4 border-t border-neutral-200">
                            <button
                              onClick={() => updateFeedbackStatus(item.id, 'approved')}
                              className="flex-1 sm:flex-none bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 size={18} /> Approve
                            </button>
                            <button
                              onClick={() => updateFeedbackStatus(item.id, 'rejected')}
                              className="flex-1 sm:flex-none bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                              <X size={18} /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                    <div className="bg-neutral-100 p-6 rounded-full mb-4">
                      <MessageSquare size={48} className="text-neutral-300" />
                    </div>
                    <p className="text-xl font-bold text-neutral-600 mb-2">No Feedback Found</p>
                    <p className="text-neutral-500">
                      {feedbackSearch || feedbackTypeFilter !== 'all' || feedbackStatusFilter !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'No feedback submitted yet'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'Reports' && (
            <Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}>
              <ReportsPage books={books} members={members} circulation={circulation} categories={categories} />
            </Suspense>
          )}

          {activeTab === 'Read With Us' && (
            <Suspense fallback={<div className="flex justify-center py-20"><Spinner /></div>}>
              <ReadWithUsManager />
            </Suspense>
          )}
        </main>
      </div>

      {showMemberModal && <MemberModal member={editingMember} onClose={() => { setShowMemberModal(false); setEditingMember(null); }} onSave={() => { setShowMemberModal(false); setEditingMember(null); }} />}
      {showIssueBookModal && <IssueBookModal onClose={() => setShowIssueBookModal(false)} onSave={() => setShowIssueBookModal(false)} />}
      {showScanModal && <ScanQRModal onClose={() => setShowScanModal(false)} onSuccess={fetchData} />}
      {showBookQRModal && selectedBookForQR && <BookQRCodeModal book={selectedBookForQR} onClose={() => setShowBookQRModal(false)} />}
      {showBulkQRModal && <BulkQRDownloadModal onClose={() => setShowBulkQRModal(false)} />}
      {showBookModal && <BookModal book={editingBook} categories={categories} onClose={() => { setShowBookModal(false); setEditingBook(null); }} onSave={() => { setShowBookModal(false); setEditingBook(null); }} />}
      {showAddBookModal && <AddBookModal categories={categories} onSave={fetchData} onClose={() => setShowAddBookModal(false)} />}
      {showManageCategoriesModal && <CategoryManager onClose={() => setShowManageCategoriesModal(false)} onSave={fetchData} />}
      {showPrintMembersModal && (
        <Suspense fallback={null}>
          <PrintMembersModal allMembers={filteredMembers} onClose={() => setShowPrintMembersModal(false)} />
        </Suspense>
      )}

      {showPrintCardModal && (
        <PrintMemberCardModal
          members={filteredMembers}
          onClose={() => setShowPrintCardModal(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;