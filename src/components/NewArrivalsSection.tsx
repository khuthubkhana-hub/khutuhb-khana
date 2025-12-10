import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase, type Book } from '../lib/supabase';
import { Sparkles, ArrowRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NewArrivalsSection: React.FC = () => {
    const navigate = useNavigate();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNewArrivals = async () => {
            const { data, error } = await supabase
                .from('books')
                .select('*, categories(name)')
                .order('created_at', { ascending: false })
                .limit(10);

            if (data) setBooks(data);
            if (error) console.error('Error fetching new arrivals:', error);
            setLoading(false);
        };

        fetchNewArrivals();
    }, []);

    if (loading || books.length === 0) return null;

    return (
        <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                        <Sparkles size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-neutral-900">New Arrivals</h2>
                </div>
                <button
                    onClick={() => navigate('/home')}
                    className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
                >
                    View All <ArrowRight size={16} />
                </button>
            </div>

            <div className="relative">
                {/* Gradient Masks for Scroll */}
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-neutral-50 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-neutral-50 to-transparent z-10 pointer-events-none" />

                <div className="overflow-x-auto pb-6 -mx-4 px-4 scrollbar-hide flex gap-4 snap-x">
                    {books.map((book, idx) => (
                        <motion.div
                            key={book.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex-shrink-0 w-48 bg-white rounded-xl shadow-sm border border-neutral-100 overflow-hidden snap-start hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => navigate(`/book/${book.id}`)}
                        >
                            <div className="aspect-[2/3] bg-neutral-100 relative overflow-hidden">
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/30 text-primary font-bold text-xl">
                                    {book.title[0]}
                                </div>
                                <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                    NEW
                                </div>
                            </div>
                            <div className="p-3">
                                <h3 className="font-bold text-neutral-900 text-sm line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                                    {book.title}
                                </h3>
                                <p className="text-xs text-neutral-500 line-clamp-1 mb-2">{book.author}</p>
                                <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                                    <Calendar size={10} />
                                    <span>{new Date(book.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default NewArrivalsSection;
