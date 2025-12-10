import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, Mic, MicOff, Hash, Folder } from 'lucide-react';
import { supabase, type Book, type Category } from '../lib/supabase';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import Pagination from './Pagination';
import BookDetailModal from './BookDetailModal';

// Debounce hook for search optimization
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const LibraryCollection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowersMap, setBorrowersMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'none' | 'category'>('none');

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);

  const [voiceLang, setVoiceLang] = useState('en-US');

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  const {
    isListening,
    transcript,
    isSupported: isSpeechRecognitionSupported,
    startListening
  } = useSpeechRecognition({ lang: voiceLang });

  useEffect(() => {
    if (transcript) {
      setSearchQuery(transcript);
    }
  }, [transcript]);

  const fetchBooksAndCirculation = async () => {
    setLoading(true);
    const [
      { data: booksData },
      { data: circulationData },
      { data: categoriesData }
    ] = await Promise.all([
      supabase.from('books').select('*, categories(name)').order('created_at', { ascending: false }).limit(10000),
      supabase.from('circulation').select('book_id, members(name)').eq('status', 'issued'),
      supabase.from('categories').select('*').order('name')
    ]);

    setBooks(booksData || []);
    setCategories(categoriesData || []);

    if (circulationData) {
      const newBorrowersMap = new Map<string, string>();
      circulationData.forEach((circ: any) => {
        if (circ.book_id && circ.members?.name) {
          newBorrowersMap.set(circ.book_id, circ.members.name);
        }
      });
      setBorrowersMap(newBorrowersMap);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchBooksAndCirculation();

    const channel = supabase.channel('public-db-changes-collection')
      .on('postgres_changes', { event: '*', schema: 'public' }, fetchBooksAndCirculation)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Debounced search for better performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const filteredBooks = useMemo(() => books
    .filter(book => {
      const lowerSearch = debouncedSearchQuery.toLowerCase();
      return book.title.toLowerCase().includes(lowerSearch) ||
        book.author.toLowerCase().includes(lowerSearch) ||
        book.publisher?.toLowerCase().includes(lowerSearch) ||
        book.categories?.name?.toLowerCase().includes(lowerSearch) ||
        book.ddc_number?.toLowerCase().includes(lowerSearch)
    })
    .filter(book => filterCategory === 'all' || book.category_id === filterCategory)
    , [books, debouncedSearchQuery, filterCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, filterCategory, groupBy, rowsPerPage]);

  const paginatedBooks = useMemo(() => {
    const indexOfLastBook = currentPage * rowsPerPage;
    const indexOfFirstBook = indexOfLastBook - rowsPerPage;
    return filteredBooks.slice(indexOfFirstBook, indexOfLastBook);
  }, [filteredBooks, currentPage, rowsPerPage]);

  const groupedBooks = useMemo(() => {
    if (groupBy === 'none') {
      return null;
    }

    return filteredBooks.reduce((acc, book) => {
      const key = book.categories?.name || 'Uncategorized';

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(book);
      return acc;
    }, {} as Record<string, Book[]>);
  }, [filteredBooks, groupBy]);

  const BookCard: React.FC<{ book: Book }> = ({ book }) => {
    const borrowerName = borrowersMap.get(book.id);
    const isAvailable = book.available_copies > 0 && !borrowerName;

    return (
      <div
        className="group border-2 border-neutral-200 rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col bg-gradient-to-br from-white to-neutral-50 cursor-pointer overflow-hidden"
        onClick={() => setSelectedBook(book)}
      >
        {/* Book Cover/Icon */}
        <div className={`h-32 sm:h-36 flex items-center justify-center relative overflow-hidden ${isAvailable
          ? 'bg-gradient-to-br from-green-400 to-emerald-500'
          : borrowerName
            ? 'bg-gradient-to-br from-amber-400 to-orange-500'
            : 'bg-gradient-to-br from-red-400 to-rose-500'
          }`}>
          <BookOpen size={48} className="text-white opacity-90 group-hover:scale-110 transition-transform duration-300" />

          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            {isAvailable ? (
              <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-700">Available</span>
              </div>
            ) : borrowerName ? (
              <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[10px] font-bold text-amber-700">Borrowed</span>
              </div>
            ) : (
              <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] font-bold text-red-700">Issued</span>
              </div>
            )}
          </div>
        </div>

        {/* Book Details */}
        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          <h3 className="font-bold text-sm sm:text-base text-neutral-900 leading-tight line-clamp-2 mb-2 group-hover:text-primary transition-colors" title={book.title}>
            {book.title}
          </h3>
          <p className="text-xs sm:text-sm text-neutral-600 truncate mb-2" title={book.author}>
            by <span className="font-semibold">{book.author}</span>
          </p>

          {/* Category Badge */}
          {book.categories?.name && (
            <div className="mb-2">
              <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] sm:text-xs font-bold">
                {book.categories.name}
              </span>
            </div>
          )}

          {/* DDC Number */}
          {book.ddc_number && (
            <div className="mt-auto pt-2 border-t border-neutral-200">
              <p className="text-xs text-neutral-500 flex items-center gap-1 font-mono" title={`DDC: ${book.ddc_number}`}>
                <Hash size={12} className="text-primary" />
                <span className="font-semibold text-primary">{book.ddc_number}</span>
              </p>
            </div>
          )}
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-white to-neutral-50 rounded-2xl shadow-xl border-2 border-neutral-200 p-4 sm:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-dark mb-2">
            Library Collection
          </h2>
          <p className="text-neutral-600 text-sm sm:text-base">Explore our extensive collection of books</p>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl p-1.5 shadow-md border-2 border-neutral-200">
          <span className="text-sm font-semibold text-neutral-600 px-2 hidden sm:inline">Group by:</span>
          {(['none', 'category'] as const).map(group => (
            <button
              key={group}
              onClick={() => setGroupBy(group)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${groupBy === group
                ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30'
                : 'text-neutral-600 hover:bg-neutral-100'
                }`}
            >
              {group === 'none' ? 'All Books' : 'By Category'}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 mb-6">
        <div className={`relative ${isSpeechRecognitionSupported ? 'lg:col-span-7' : 'lg:col-span-8'}`}>
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={22} />
          <input
            type="text"
            placeholder={isListening ? "🎤 Listening..." : "Search by title, author, category, or DDC..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3.5 sm:py-4 border-2 border-neutral-200 rounded-xl focus:ring-4 focus:ring-primary/20 focus:border-primary transition-all text-base font-medium placeholder:text-neutral-400 bg-white shadow-sm"
          />
          {isSpeechRecognitionSupported && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={startListening}
                className={`p-2 rounded-full transition-all ${isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-lg'
                  : 'text-neutral-500 hover:bg-neutral-100 hover:text-primary'
                  }`}
                title="Search with voice"
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            </div>
          )}
        </div>

        {isSpeechRecognitionSupported && (
          <select
            value={voiceLang}
            onChange={e => setVoiceLang(e.target.value)}
            className="lg:col-span-2 w-full px-4 py-3.5 sm:py-4 border-2 border-neutral-200 rounded-xl bg-white focus:ring-4 focus:ring-primary/20 focus:border-primary font-medium text-base shadow-sm"
            aria-label="Select voice typing language"
          >
            <option value="en-US">🇺🇸 English</option>
            <option value="kn-IN">🇮🇳 Kannada</option>
            <option value="ml-IN">🇮🇳 Malayalam</option>
            <option value="ar-SA">🇸🇦 Arabic</option>
          </select>
        )}

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className={`w-full px-4 py-3.5 sm:py-4 border-2 border-neutral-200 rounded-xl bg-white focus:ring-4 focus:ring-primary/20 focus:border-primary font-medium text-base shadow-sm ${isSpeechRecognitionSupported ? 'lg:col-span-3' : 'lg:col-span-4'
            }`}
        >
          <option value="all">📚 All Categories</option>
          {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
        </select>
      </div>

      {/* Results Info and Pagination Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-xl border-2 border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <BookOpen className="text-primary" size={20} />
          </div>
          <div>
            <p className="text-sm text-neutral-600">Showing</p>
            <p className="text-lg font-bold text-neutral-900">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'Book' : 'Books'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="rows-per-page" className="text-sm font-semibold text-neutral-600">Per page:</label>
          <select
            id="rows-per-page"
            value={rowsPerPage}
            onChange={e => setRowsPerPage(Number(e.target.value))}
            className="px-3 py-2 border-2 border-neutral-200 rounded-lg bg-white text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-lg font-semibold">Loading books...</p>
        </div>
      ) : filteredBooks.length > 0 ? (
        <>
          {groupBy === 'none' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
              {paginatedBooks.map(book => <BookCard key={book.id} book={book} />)}
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedBooks!).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, booksInGroup]) => (
                <div key={groupName}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="bg-gradient-to-r from-primary to-primary-dark p-2 rounded-xl">
                      <Folder className="text-white" size={20} />
                    </div>
                    <h3 className="text-2xl font-bold text-primary-dark">
                      {groupName}
                    </h3>
                    <span className="ml-auto bg-primary text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md">
                      {booksInGroup.length} {booksInGroup.length === 1 ? 'Book' : 'Books'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
                    {booksInGroup.map(book => <BookCard key={book.id} book={book} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {groupBy === 'none' && <Pagination
            currentPage={currentPage}
            totalCount={filteredBooks.length}
            pageSize={rowsPerPage}
            onPageChange={page => setCurrentPage(page)}
          />}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-2xl border-2 border-dashed border-neutral-300">
          <div className="bg-white p-6 rounded-full shadow-lg mb-6">
            <BookOpen size={64} className="text-neutral-300" />
          </div>
          <p className="text-2xl font-bold text-neutral-700 mb-2">
            {searchQuery || filterCategory !== 'all' ? 'No Books Found' : 'No Books Available'}
          </p>
          <p className="text-neutral-500 text-lg max-w-md text-center">
            {searchQuery || filterCategory !== 'all'
              ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
              : 'The library collection is currently empty.'}
          </p>
        </div>
      )}
      <BookDetailModal book={selectedBook} borrowerName={selectedBook ? borrowersMap.get(selectedBook.id) : null} onClose={() => setSelectedBook(null)} />
    </div>
  );
};

export default LibraryCollection;
