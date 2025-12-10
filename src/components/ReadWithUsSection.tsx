import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, type ReadWithUs } from '../lib/supabase';
import { BookHeart, Loader2, ArrowRight, Star } from 'lucide-react';
import PostCard from './PostCard';

const ReadWithUsSection: React.FC = () => {
  const [posts, setPosts] = useState<ReadWithUs[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('read_with_us')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      if (data) setPosts(data);
      if (error) console.error("Error fetching 'Read With Us' posts:", error);
      setLoading(false);
    };

    fetchPosts();

    const channel = supabase
      .channel('public:read_with_us:landing')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'read_with_us' }, fetchPosts)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <section id="read-with-us" className="py-24 bg-neutral-50 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-primary font-bold tracking-wider uppercase text-sm mb-3 bg-primary/10 px-3 py-1 rounded-full"
            >
              <BookHeart size={16} />
              <span>Community Corner</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold text-neutral-900 leading-tight"
            >
              Read With Us
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-lg text-neutral-600 leading-relaxed"
            >
              Dive into stories, reviews, and articles written by our vibrant community of readers. Join the conversation!
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link to="/read-with-us" className="hidden md:inline-flex items-center gap-2 font-bold text-white bg-neutral-900 hover:bg-neutral-800 px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 group">
              View All Posts <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : posts.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
          >
            {posts.map((post, idx) => (
              <motion.div
                key={post.id}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                }}
                className="h-full"
              >
                <PostCard post={post} showStats={false} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-neutral-200 shadow-sm">
            <div className="bg-neutral-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookHeart size={40} className="text-neutral-300" />
            </div>
            <p className="text-2xl font-bold text-neutral-900 mb-2">No Posts Yet</p>
            <p className="text-neutral-500 max-w-md mx-auto">Be the first to share your story! Submit a review or article to get started.</p>
          </div>
        )}

        <div className="mt-12 text-center md:hidden">
          <Link to="/read-with-us" className="inline-flex items-center gap-2 font-bold text-white bg-neutral-900 hover:bg-neutral-800 px-6 py-3 rounded-xl transition-all shadow-lg w-full justify-center">
            View All Posts <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ReadWithUsSection;
