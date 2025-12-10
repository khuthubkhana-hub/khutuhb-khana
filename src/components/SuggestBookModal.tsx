import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import SearchableSelect from './SearchableSelect';

interface SuggestBookModalProps {
  onClose: () => void;
}

const SuggestBookModal: React.FC<SuggestBookModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    member_id: '',
    suggestion_title: '',
    suggestion_author: '',
    suggestion_reason: ''
  });
  const [selectedMember, setSelectedMember] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.member_id) {
      alert('Please select a member.');
      return;
    }
    setLoading(true);

    try {
      const { error } = await supabase.from('feedback').insert({
        ...formData,
        feedback_type: 'suggestion',
        status: 'pending'
      });

      if (error) throw error;

      alert('Thank you! Your suggestion has been submitted.');
      onClose();
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      alert('Failed to submit suggestion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all scale-100">
        <div className="flex justify-between items-center p-6 border-b border-neutral-100 bg-neutral-50/50">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900">Suggest a Book</h2>
            <p className="text-sm text-neutral-500">Help us grow our collection</p>
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
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Book Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={formData.suggestion_title}
                onChange={(e) => setFormData({ ...formData, suggestion_title: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-neutral-50 focus:bg-white"
                placeholder="e.g. The Alchemist"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Author</label>
              <input
                type="text"
                value={formData.suggestion_author}
                onChange={(e) => setFormData({ ...formData, suggestion_author: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-neutral-50 focus:bg-white"
                placeholder="e.g. Paulo Coelho"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Reason for Suggestion</label>
              <textarea
                rows={3}
                value={formData.suggestion_reason}
                onChange={(e) => setFormData({ ...formData, suggestion_reason: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none bg-neutral-50 focus:bg-white"
                placeholder="Why should we add this book?"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-neutral-100 mt-6">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-neutral-600 font-medium hover:bg-neutral-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-0.5">
              {loading ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SuggestBookModal;
