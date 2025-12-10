import React, { useState } from 'react';
import { X, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SearchableSelect from './SearchableSelect';

interface WriteReviewModalProps {
  onClose: () => void;
}

const WriteReviewModal: React.FC<WriteReviewModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    member_id: '',
    book_id: '',
    rating: 0,
    review: ''
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id || !formData.book_id || formData.rating === 0) {
      alert('Please fill all required fields and provide a rating.');
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.from('feedback').insert({
        ...formData,
        feedback_type: 'book_review',
        status: 'pending'
      });

      if (error) throw error;

      alert('Thank you! Your review has been submitted.');
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all scale-100">
        <div className="flex justify-between items-center p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Write a Review</h2>
            <p className="text-sm text-neutral-500">Share your thoughts with the community</p>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Select Member <span className="text-red-500">*</span></label>
              <SearchableSelect
                value={selectedMember}
                onChange={(option: any) => {
                  setSelectedMember(option);
                  setFormData({ ...formData, member_id: option ? option.value : '' });
                }}
                placeholder="Search for your name..."
                tableName="members"
                labelField="name"
                searchFields={['name', 'email']}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Select Book <span className="text-red-500">*</span></label>
              <SearchableSelect
                value={selectedBook}
                onChange={(option: any) => {
                  setSelectedBook(option);
                  setFormData({ ...formData, book_id: option ? option.value : '' });
                }}
                placeholder="Search for the book..."
                tableName="books"
                labelField="title"
                searchFields={['title', 'author']}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Rating <span className="text-red-500">*</span></label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="focus:outline-none group transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={`transition-colors ${star <= formData.rating ? 'text-yellow-400 fill-current drop-shadow-sm' : 'text-neutral-200 group-hover:text-neutral-300'
                        }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-neutral-400 mt-1">Click stars to rate</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Your Review</label>
              <textarea
                rows={4}
                value={formData.review}
                onChange={(e) => setFormData({ ...formData, review: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none bg-neutral-50 focus:bg-white"
                placeholder="What did you think about this book?"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100 mt-6">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-neutral-600 font-medium hover:bg-neutral-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-0.5">
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewModal;
