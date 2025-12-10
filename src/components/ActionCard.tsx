import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  bgColor: string;
  iconColor: string;
  onClick?: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  icon: Icon,
  title,
  description,
  bgColor,
  iconColor,
  onClick
}) => {
  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative bg-gradient-to-br from-white to-neutral-50 rounded-2xl shadow-lg border border-neutral-200 p-6 hover:shadow-2xl hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Decorative corner element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <motion.div
          whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
          transition={{ duration: 0.5 }}
          className={`w-14 h-14 ${bgColor} rounded-xl flex items-center justify-center mb-5 shadow-md group-hover:shadow-xl transition-shadow duration-300`}
        >
          <Icon size={28} className={`${iconColor} group-hover:scale-110 transition-transform duration-300`} />
        </motion.div>

        <h3 className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-primary transition-colors duration-300">
          {title}
        </h3>

        <p className="text-neutral-600 text-sm leading-relaxed mb-4">
          {description}
        </p>

        {/* Animated arrow */}
        <div className="flex items-center gap-2 text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300">
          <span>Explore</span>
          <ArrowRight size={16} className="animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
};

export default ActionCard;
