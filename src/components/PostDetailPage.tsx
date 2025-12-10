import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase, type ReadWithUs } from '../lib/supabase';
import Header from './Header';
import { Loader2, ArrowLeft, AlertTriangle, User, Calendar, Tag, Globe, BookHeart, Sparkles } from 'lucide-react';
import Spinner from './Spinner';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();

  const [post, setPost] = useState<ReadWithUs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) {
        setError('No post ID provided.');
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { error: readCountError } = await supabase.rpc('increment_read_count', { post_id_in: postId });
        if (readCountError) {
          console.error('Failed to increment read count:', readCountError);
        }

        const { data, error: fetchError } = await supabase
          .from('read_with_us')
          .select('*')
          .eq('id', postId)
          .single();

        if (fetchError) throw fetchError;

        setPost(data);
      } catch (err: any) {
        setError(err.message || 'Post not found.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 to-white">
        <div className="text-center">
          <Spinner className="h-16 w-16 text-primary mx-auto mb-4" />
          <p className="text-neutral-600 font-medium">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-50 to-white text-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl border-2 border-neutral-200"
        >
          <AlertTriangle className="text-red-500 mb-4 mx-auto" size={64} />
          <h2 className="text-3xl font-bold text-neutral-800 mb-3">Oops!</h2>
          <p className="text-neutral-600 mb-6 max-w-md">{error || 'Could not load post details.'}</p>
          <Link to="/read-with-us" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all">
            <ArrowLeft size={20} /> Back to All Posts
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Link to="/read-with-us" className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-dark mb-8 group bg-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all">
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" /> Back to All Posts
          </Link>
        </motion.div>

        {/* Article Container */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl border-2 border-neutral-200 overflow-hidden"
        >
          {/* Header Section */}
          <header className="relative bg-gradient-to-br from-primary/5 via-white to-accent/5 p-8 sm:p-12 border-b-2 border-neutral-200">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative z-10">
              {/* Category Badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-2 rounded-full text-sm font-bold mb-6 shadow-lg"
              >
                <Tag size={16} />
                <span>{post.category}</span>
              </motion.div>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-neutral-900 leading-tight tracking-tight mb-8"
              >
                {post.title}
              </motion.h1>

              {/* Meta Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-6"
              >
                {/* Author */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-md border-2 border-neutral-200">
                  {post.author_image_url ? (
                    <img src={post.author_image_url} alt={post.author} className="w-14 h-14 rounded-full object-cover ring-4 ring-primary/20" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center ring-4 ring-primary/20">
                      <User size={28} className="text-white" />
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Author</p>
                    <p className="text-lg font-bold text-neutral-900">{post.author}</p>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-md border-2 border-neutral-200">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Calendar size={28} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Published</p>
                    <p className="text-lg font-bold text-neutral-900">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Language */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-md border-2 border-neutral-200">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <Globe size={28} className="text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider">Language</p>
                    <p className="text-lg font-bold text-neutral-900">{post.language}</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </header>

          {/* Featured Image */}
          {post.image_url && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative aspect-video overflow-hidden"
            >
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>
          )}

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-8 sm:p-12"
          >
            <div className="prose prose-lg max-w-none whitespace-pre-wrap selection:bg-primary/20 selection:text-primary-dark">
              <div className="text-neutral-800 leading-relaxed text-lg">
                {post.content}
              </div>
            </div>

            {/* Decorative Footer */}
            <div className="mt-12 pt-8 border-t-2 border-neutral-200 flex items-center justify-center gap-3">
              <BookHeart className="text-primary" size={24} />
              <p className="text-neutral-600 font-medium">Thank you for reading!</p>
              <Sparkles className="text-accent" size={24} />
            </div>
          </motion.div>
        </motion.article>

        {/* Related Posts or Back Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center"
        >
          <Link to="/read-with-us" className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:-translate-y-1">
            <BookHeart size={24} />
            Explore More Stories
          </Link>
        </motion.div>
      </main>
    </div>
  );
};

export default PostDetailPage;
