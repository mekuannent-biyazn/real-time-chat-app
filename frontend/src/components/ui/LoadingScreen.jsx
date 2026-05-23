import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-violet-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 rounded-2xl bg-primary-500/30 animate-ping" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-primary-500 rounded-full"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
        <p className="text-slate-400 text-sm">Loading ChatFlow...</p>
      </motion.div>
    </div>
  );
};

export default LoadingScreen;
