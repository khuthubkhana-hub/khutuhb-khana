import React from 'react';
import { Link } from 'react-router-dom';
import { type ReadWithUs } from '../lib/supabase';
import { BookText, User, Calendar, Sparkles } from 'lucide-react';

interface PostCardProps {
  post: ReadWithUs;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <Link
      to={`/read-with-us/${post.id}`}
      className="block bg-white rounded-2xl shadow-lg border-2 border-neutral-200 overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/50"
    >
      {/* Image Section */}
      <div className="relative overflow-hidden aspect-[3/4]">
        {post.image_url ? (
          <>
            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-white to-accent/10 flex items-center justify-center">
            <BookText size={64} className="text-neutral-300 group-hover:text-primary transition-colors" />
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 right-3 bg-gradient-to-r from-primary to-primary-dark text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
          {post.category}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-neutral-900 mb-2 line-clamp-2 transition-colors group-hover:text-primary leading-tight">
          {post.title}
        </h3>

        {/* Author */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-primary" />
          </div>
          <p className="text-sm text-neutral-600 font-medium truncate">by {post.author}</p>
        </div>

        {/* Date */}
        <div className="mt-auto pt-4 border-t-2 border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Calendar size={16} className="text-neutral-400" />
            <span className="font-medium">{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-1 text-primary">
            <Sparkles size={16} />
            <span className="text-xs font-bold">Read More</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PostCard;
