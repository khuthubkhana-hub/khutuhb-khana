import React, { useState, useEffect, useMemo } from 'react';
import { supabase, type ReadWithUs, type Language } from '../lib/supabase';
import Header from './Header';
import Pagination from './Pagination';
import { Search, Loader2, BookHeart, Filter, Sparkles } from 'lucide-react';
import PostCard from './PostCard';
import { motion, AnimatePresence } from 'framer-motion';

const postCategories: (ReadWithUs['category'] | 'All')[] = ['All', 'Article', 'Book Review', 'Poem', 'Story'];
const languages: (Language | 'All')[] = ['All', 'English', 'Kannada', 'Malayalam', 'Arabic', 'Urdu'];

const ReadWithUsPage: React.FC = () => {
  const [posts, setPosts] = useState<ReadWithUs[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<ReadWithUs['category'] | 'All'>('All');
  const [activeLanguage, setActiveLanguage] = useState<Language | 'All'>('All');
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(12);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data } = await supabase.from('read_with_us').select('*').order('created_at', { ascending: false });
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const filteredPosts = useMemo(() => posts
    .filter(post => activeCategory === 'All' || post.category === activeCategory)
    .filter(post => activeLanguage === 'All' || post.language === activeLanguage)
    .filter(post =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase())
    ), [posts, activeCategory, activeLanguage, searchQuery]);

  const paginatedPosts = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredPosts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredPosts, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, activeLanguage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 rounded-3xl -z-10"></div>
          <div className="py-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Sparkles size={16} />
              <span className="text-sm font-bold uppercase tracking-wider">Community Stories</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-neutral-900 tracking-tight mb-4">
              Read With <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Us</span>
            </h1>
            <p className="mt-3 text-lg sm:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed">
              Discover stories, poems, and reviews from our talented community of readers and writers.
            </p>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-white rounded-2xl shadow-lg border border-neutral-200/80 overflow-hidden"
        >
          <div className="p-4 sm:p-6">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
              <input
                type="text"
                placeholder="Search by title, author, or content..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all text-neutral-900 placeholder:text-neutral-400"
              />
            </div>

            {/* Filter Toggle Button (Mobile) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden w-full flex items-center justify-center gap-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold py-3 rounded-xl transition-colors mb-4"
            >
              <Filter size={18} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>

            {/* Filters */}
            <AnimatePresence>
              {(showFilters || window.innerWidth >= 768) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col md:flex-row gap-6"
                >
                  <div className="w-full">
                    <label className="text-sm font-bold text-neutral-700 mb-3 block flex items-center gap-2">
                      <span className="w-1 h-4 bg-primary rounded-full"></span>
                      Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {postCategories.map(cat => (
                        <motion.button
                          key={cat}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeCategory === cat
                            ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-lg shadow-primary/30'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:shadow-md'
                            }`}
                        >
                          {cat}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  <div className="w-full">
                    <label className="text-sm font-bold text-neutral-700 mb-3 block flex items-center gap-2">
                      <span className="w-1 h-4 bg-accent rounded-full"></span>
                      Language
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {languages.map(lang => (
                        <motion.button
                          key={lang}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveLanguage(lang)}
                          className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${activeLanguage === lang
                            ? 'bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg shadow-accent/30'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:shadow-md'
                            }`}
                        >
                          {lang}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Active Filters Summary */}
          {(activeCategory !== 'All' || activeLanguage !== 'All' || searchQuery) && (
            <div className="px-4 sm:px-6 pb-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-neutral-500 font-medium">Active filters:</span>
                {activeCategory !== 'All' && (
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold">
                    {activeCategory}
                  </span>
                )}
                {activeLanguage !== 'All' && (
                  <span className="bg-accent/10 text-accent px-3 py-1 rounded-full font-semibold">
                    {activeLanguage}
                  </span>
                )}
                {searchQuery && (
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-semibold">
                    "{searchQuery}"
                  </span>
                )}
                <button
                  onClick={() => {
                    setActiveCategory('All');
                    setActiveLanguage('All');
                    setSearchQuery('');
                  }}
                  className="text-neutral-500 hover:text-neutral-700 underline font-medium ml-2"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Results Count */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 text-neutral-600 font-medium"
          >
            Showing <span className="text-primary font-bold">{filteredPosts.length}</span> {filteredPosts.length === 1 ? 'post' : 'posts'}
          </motion.div>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-primary mb-4" size={48} />
            <p className="text-neutral-500 font-medium">Loading amazing stories...</p>
          </div>
        ) : paginatedPosts.length > 0 ? (
          <>
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {paginatedPosts.map((post) => (
                <motion.div
                  key={post.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </motion.div>
            <div className="mt-12">
              <Pagination
                currentPage={currentPage}
                totalCount={filteredPosts.length}
                pageSize={rowsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-neutral-200 shadow-sm"
          >
            <div className="bg-neutral-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookHeart size={40} className="text-neutral-400" />
            </div>
            <p className="text-2xl font-bold text-neutral-900 mb-2">No Posts Found</p>
            <p className="text-neutral-500 mb-6 max-w-md mx-auto">
              No articles match your current filters. Try adjusting your search or filters.
            </p>
            <button
              onClick={() => {
                setActiveCategory('All');
                setActiveLanguage('All');
                setSearchQuery('');
              }}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl"
            >
              Clear All Filters
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default ReadWithUsPage;
