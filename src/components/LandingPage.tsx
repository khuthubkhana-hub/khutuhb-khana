import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Search, ArrowRight, Library, Monitor, GraduationCap, Users } from 'lucide-react';
import ReadWithUsSection from './ReadWithUsSection';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.querySelector(id);
    element?.scrollIntoView({ behavior: 'smooth' });
    if (isMenuOpen) setIsMenuOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate('/home'); // Redirect to home/catalog
    }
  };

  return (
    <div className="bg-white text-neutral-800 font-sans min-h-screen flex flex-col">
      {/* Navbar */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm py-3' : 'bg-white/90 backdrop-blur-sm py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20 group-hover:bg-primary-dark transition-colors">
                <Library size={24} />
              </div>
              <span className="text-xl font-bold text-neutral-900 tracking-tight">Muhimmath Library</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#home" onClick={(e) => handleSmoothScroll(e, '#home')} className="font-medium text-neutral-600 hover:text-primary transition-colors">Home</a>
              <button onClick={() => navigate('/home')} className="font-medium text-neutral-600 hover:text-primary transition-colors">Catalog</button>
              <a href="#read-with-us" onClick={(e) => handleSmoothScroll(e, '#read-with-us')} className="font-medium text-neutral-600 hover:text-primary transition-colors">Events</a>
              <a href="#about" onClick={(e) => handleSmoothScroll(e, '#about')} className="font-medium text-neutral-600 hover:text-primary transition-colors">About</a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => navigate('/admin-login')} className="bg-primary text-white px-6 py-2.5 rounded-full font-semibold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 transform hover:-translate-y-0.5">
                Login
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-neutral-600">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="md:hidden bg-white border-t border-neutral-100 shadow-lg"
          >
            <div className="px-4 py-6 space-y-4">
              <a href="#home" onClick={(e) => handleSmoothScroll(e, '#home')} className="block text-lg font-medium text-neutral-700">Home</a>
              <button onClick={() => navigate('/home')} className="block text-lg font-medium text-neutral-700 w-full text-left">Catalog</button>
              <a href="#read-with-us" onClick={(e) => handleSmoothScroll(e, '#read-with-us')} className="block text-lg font-medium text-neutral-700">Events</a>
              <div className="pt-4 border-t border-neutral-100">
                <button onClick={() => navigate('/admin-login')} className="w-full text-center px-4 py-3 rounded-lg bg-primary text-white font-semibold">
                  Login
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-neutral-50">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1507842217121-9e962835d75d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
              alt="Library Background"
              className="w-full h-full object-cover opacity-10"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white/80" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-neutral-900 leading-tight mb-6">
                Discover the World of Knowledge
              </h1>
              <p className="text-lg sm:text-xl text-neutral-600 mb-10 max-w-2xl mx-auto">
                Access thousands of books, journals, and digital resources.
              </p>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative mb-12">
                <div className="relative flex items-center">
                  <Search className="absolute left-4 text-neutral-400" size={24} />
                  <input
                    type="text"
                    placeholder="Search the entire collection..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-32 py-4 rounded-full border-2 border-neutral-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none text-lg shadow-xl transition-all"
                  />
                  <button type="submit" className="absolute right-2 bg-primary text-white px-8 py-2.5 rounded-full font-bold hover:bg-primary-dark transition-colors">
                    Search
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </section>

        {/* Featured Collections */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-neutral-900 mb-12">Featured Collections</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[
                { title: "The Book to Man", img: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=300&q=80" },
                { title: "The Da Vinci Code", img: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=300&q=80" },
                { title: "Muhimmath Library", img: "https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=300&q=80" },
                { title: "Research Library", img: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80" },
                { title: "The Alchemist", img: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80" },
                { title: "Book of Books", img: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=300&q=80" },
              ].map((book, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -10 }}
                  className="group cursor-pointer"
                  onClick={() => navigate('/home')}
                >
                  <div className="aspect-[2/3] rounded-xl overflow-hidden shadow-md mb-3 relative">
                    <img src={book.img} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                  <h3 className="font-bold text-neutral-900 text-sm group-hover:text-primary transition-colors">{book.title}</h3>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* New Library 2025 Section */}
        <section className="py-20 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1568667256549-094345857637?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                  alt="New Library"
                  className="rounded-3xl shadow-2xl"
                />
                <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl max-w-xs hidden md:block">
                  <p className="font-bold text-lg text-neutral-900">Modern Spaces</p>
                  <p className="text-neutral-600 text-sm">Designed for comfort and productivity.</p>
                </div>
              </div>
              <div>
                <span className="text-primary font-bold tracking-wider uppercase text-sm">New Library 2025</span>
                <h2 className="text-4xl font-bold text-neutral-900 mt-2 mb-6">Muhimmath Library of books, journals, and digital resources</h2>
                <p className="text-neutral-600 text-lg mb-8 leading-relaxed">
                  Experience a state-of-the-art learning environment with our newly renovated spaces.
                  Featuring quiet study zones, collaborative meeting rooms, and high-speed digital access points.
                </p>
                <button onClick={() => navigate('/home')} className="bg-white border-2 border-neutral-200 text-neutral-800 px-8 py-3 rounded-full font-bold hover:border-primary hover:text-primary transition-all">
                  Learn more
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Library Services */}
        <section id="about" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-neutral-900 mb-12">Library Services</h2>
            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  icon: <Monitor size={32} />,
                  title: "e-Resources",
                  desc: "24/7 access to online journals, document streams, consultations, and operation resources."
                },
                {
                  icon: <GraduationCap size={32} />,
                  title: "Research Support",
                  desc: "Research support research labs, research, compontl, enustation, and digital resource."
                },
                {
                  icon: <Users size={32} />,
                  title: "Study Spaces",
                  desc: "Lorem ipsum dixit at modera, study spaces, croeenmaation estudio, onresohe nim rilis."
                }
              ].map((service, idx) => (
                <div key={idx} className="flex flex-col items-start">
                  <div className="bg-blue-50 text-primary p-4 rounded-2xl mb-6">
                    {service.icon}
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-3">{service.title}</h3>
                  <p className="text-neutral-600 leading-relaxed">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Read With Us Section */}
        <ReadWithUsSection />

        {/* Newsletter */}
        <section className="py-20 bg-white border-t border-neutral-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-8">
              <div>
                <h3 className="text-2xl font-bold text-neutral-900">Newsletter</h3>
                <p className="text-neutral-600 mt-2">Subscribe to get the latest updates and news.</p>
              </div>
              <form className="flex w-full md:w-auto gap-4">
                <input
                  type="email"
                  placeholder="Enter your email address..."
                  className="flex-grow md:w-80 px-6 py-3 rounded-full border border-neutral-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-neutral-50"
                />
                <button type="button" className="bg-primary text-white p-3 rounded-full hover:bg-primary-dark transition-colors">
                  <ArrowRight size={24} />
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t border-neutral-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg text-white">
              <Library size={20} />
            </div>
            <span className="font-bold text-neutral-900">Muhimmath Library</span>
          </div>
          <div className="flex gap-6 text-neutral-500">
            <a href="#" className="hover:text-primary transition-colors">Facebook</a>
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">Instagram</a>
            <a href="#" className="hover:text-primary transition-colors">LinkedIn</a>
          </div>
          <p className="text-neutral-500 text-sm">&copy; {new Date().getFullYear()} All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
