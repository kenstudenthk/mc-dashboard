import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { 
  HelpCircle, 
  Mail, 
  MessageSquare, 
  Phone, 
  ChevronRight, 
  Search, 
  BookOpen, 
  Settings, 
  ShieldCheck, 
  Zap,
  Clock,
  ArrowRight,
  X,
  MessageCircle
} from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";

// ── Clay Design Constants ───────────────────────────────────────────────────
const CLAY_ACCENTS = {
  matcha: { main: "#078a52", light: "#84e7a5", dark: "#02492a" },
  slushie: { main: "#3bd3fd", light: "#b2f0ff", dark: "#0089ad" },
  lemon: { main: "#fbbd41", light: "#f8cc65", dark: "#9d6a09" },
  ube: { main: "#43089f", light: "#c1b0ff", dark: "#32037d" },
  pomegranate: { main: "#fc7981", light: "#ffb3b8", dark: "#a12d35" },
};

// ── Components ─────────────────────────────────────────────────────────────

/**
 * Animated Title with staggered characters
 */
const AnimatedTitle = ({ text }: { text: string }) => {
  const words = text.split(" ");
  
  return (
    <h1 className="text-5xl sm:text-7xl font-bold text-[#000000] tracking-tighter leading-[1.1] perspective-1000">
      {words.map((word, i) => (
        <span key={i} className="inline-block mr-[0.2em] whitespace-nowrap">
          {word.split("").map((char, j) => (
            <motion.span
              key={j}
              initial={{ opacity: 0, y: 40, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ 
                delay: (i * 0.1) + (j * 0.03), 
                duration: 0.8, 
                ease: [0.215, 0.61, 0.355, 1] 
              }}
              className="inline-block origin-bottom"
              style={{ color: word.toLowerCase().includes("help") ? "#078a52" : "inherit" }}
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </h1>
  );
};

/**
 * Magnetic Search Bar
 */
const MagneticSearch = () => {
  const [isFocused, setIsFocused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 20 };
  const dx = useSpring(mouseX, springConfig);
  const dy = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set((e.clientX - centerX) * 0.1);
    mouseY.set((e.clientY - centerY) * 0.1);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: dx, y: dy }}
      className="relative max-w-2xl mx-auto z-10"
    >
      <motion.div
        animate={{ 
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused 
            ? "0 20px 40px -10px rgba(7, 138, 82, 0.15)" 
            : "0 4px 6px -1px rgba(0, 0, 0, 0.05)"
        }}
        className="relative"
      >
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-[#078a52]' : 'text-[#9f9b93]'}`} />
        </div>
        <input
          type="text"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="What are you looking for?"
          className="w-full pl-14 pr-6 py-5 bg-white border border-[#dad4c8] rounded-[24px] text-lg focus:outline-none focus:border-[#078a52] transition-colors shadow-sm placeholder:text-[#9f9b93]/70"
        />
        <div className="absolute right-4 inset-y-4 flex items-center gap-2">
          <AnimatePresence>
            {isFocused && (
              <motion.span 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-[10px] font-bold text-[#078a52] uppercase tracking-widest mr-2"
              >
                Press Enter
              </motion.span>
            )}
          </AnimatePresence>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 bg-[#faf9f7] border border-[#dad4c8] rounded-lg text-[10px] font-mono text-[#9f9b93]">
            <span>⌘</span>K
          </kbd>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Bento Card with Liquid Background
 */
const BentoCard = ({ 
  title, 
  description, 
  icon: Icon, 
  accent, 
  index 
}: { 
  title: string; 
  description: string; 
  icon: any; 
  accent: keyof typeof CLAY_ACCENTS;
  index: number;
}) => {
  const colors = CLAY_ACCENTS[accent];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 + (index * 0.1), duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ 
        rotateZ: -1.5, 
        y: -10,
        scale: 1.01
      }}
      className="group relative cursor-pointer h-full"
    >
      {/* Signature Clay Hard Shadow */}
      <div 
        className="absolute inset-0 rounded-[32px] translate-x-[8px] translate-y-[8px] bg-black opacity-10 group-hover:opacity-100 group-hover:translate-x-[12px] group-hover:translate-y-[12px] transition-all duration-300"
      />
      
      {/* Main Surface */}
      <div className="relative h-full bg-white border border-[#dad4c8] rounded-[32px] p-8 flex flex-col gap-8 overflow-hidden z-10">
        {/* Animated Gradient Blob */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[60px] opacity-10 group-hover:opacity-40 transition-opacity"
          style={{ backgroundColor: colors.main }}
        />
        
        <div 
          className="w-16 h-16 rounded-[20px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 shadow-sm"
          style={{ backgroundColor: "#faf9f7" }}
        >
          <Icon className="w-7 h-7" style={{ color: colors.main }} />
        </div>
        
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-[#000000] tracking-tight">
            {title}
          </h3>
          <p className="text-[#55534e] text-[15px] leading-relaxed">
            {description}
          </p>
        </div>
        
        <div className="mt-auto flex items-center gap-3 text-xs font-black uppercase tracking-[0.12em] transition-all group-hover:gap-5" style={{ color: colors.main }}>
          <span>Explore Section</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </motion.div>
  );
};

const FAQItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div layout className="border-b border-[#dad4c8]/50 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group outline-none"
      >
        <span className={`text-lg font-semibold transition-all ${isOpen ? 'text-[#078a52] translate-x-2' : 'text-[#000000] group-hover:text-[#078a52] group-hover:translate-x-1'}`}>
          {question}
        </span>
        <motion.div
          animate={{ 
            rotate: isOpen ? 180 : 0,
            backgroundColor: isOpen ? "#078a52" : "#faf9f7",
            borderColor: isOpen ? "#078a52" : "#dad4c8"
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center border transition-colors"
        >
          <ChevronRight className={`w-4 h-4 transition-colors ${isOpen ? 'text-white' : 'text-[#55534e]'}`} />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: "auto", opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-[#55534e] leading-relaxed text-[15px] max-w-2xl pl-2">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const Help = () => {
  const [isHubOpen, setIsHubOpen] = useState(false);

  const categories = [
    {
      title: "Getting Started",
      description: "New here? Master the fundamentals of cloud provisioning in minutes.",
      icon: Zap,
      accent: "slushie" as const,
    },
    {
      title: "Security & Roles",
      description: "Manage your team's access levels and keep your data fortified.",
      icon: ShieldCheck,
      accent: "lemon" as const,
    },
    {
      title: "Order Workflow",
      description: "Step-by-step guides on creating, tracking, and completing orders.",
      icon: BookOpen,
      accent: "matcha" as const,
    },
    {
      title: "Admin Tools",
      description: "Powerful features for bulk operations and system configuration.",
      icon: Settings,
      accent: "ube" as const,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto pb-32 px-6">
      {/* ── Background Decoration ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#078a52]/05 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-[#3bd3fd]/05 rounded-full blur-[100px]" />
      </div>

      {/* ── Hero Section ── */}
      <section className="relative pt-20 pb-20 text-center space-y-10 z-10">
        <AnimatedTitle text="How can we help?" />
        
        <p className="text-[#9f9b93] text-xl max-w-2xl mx-auto leading-relaxed">
          The ultimate resource for mastering the MC Dashboard. 
          Find instant answers, technical docs, and direct support.
        </p>

        <MagneticSearch />

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex items-center justify-center gap-6 text-xs font-bold uppercase tracking-widest text-[#9f9b93]"
        >
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#078a52]" />
            2.4k Articles
          </span>
          <span className="w-px h-4 bg-[#dad4c8]" />
          <span className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3bd3fd]" />
            150+ Video Tutorials
          </span>
          <span className="w-px h-4 bg-[#dad4c8]" />
          <span className="flex items-center gap-2 text-[#078a52]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#078a52] animate-pulse" />
            Live Support Online
          </span>
        </motion.div>
      </section>

      {/* ── Bento Grid ── */}
      <section className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32 z-10">
        {categories.map((cat, i) => (
          <BentoCard key={cat.title} {...cat} index={i} />
        ))}
      </section>

      {/* ── Knowledge & FAQ ── */}
      <section className="relative grid grid-cols-1 lg:grid-cols-12 gap-16 items-start z-10">
        <div className="lg:col-span-8 space-y-10">
          <div className="flex items-end justify-between border-b-2 border-black pb-4">
            <h2 className="text-4xl font-black tracking-tighter uppercase italic">Common Queries</h2>
            <div className="flex items-center gap-2 text-xs font-bold text-[#9f9b93] uppercase tracking-widest">
              Updated Today <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          
          <motion.div layout className="space-y-2">
            {[
              {
                q: "How do I create a new order?",
                a: 'Navigate to the Order Registry and click the "New Order" button in the top right corner. Our guided workflow will walk you through customer selection and service configuration.',
              },
              {
                q: "Can I export my customer list?",
                a: "Absolutely. Head to the Customers page and use the export tool. You can filter by region, account manager, or provider before downloading your Excel report.",
              },
              {
                q: "How are system roles assigned?",
                a: "Roles (Admin, Editor, Viewer) are managed by Global Admins in the Settings panel. Permissions are updated instantly across the entire platform.",
              },
              {
                q: "What is a 'pre-provision' order?",
                a: 'These are early-stage cloud instances created before a formal service number is generated. They help accelerate deployment for urgent customer requirements.',
              },
            ].map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </motion.div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-5 bg-[#faf9f7] border-2 border-dashed border-[#dad4c8] rounded-[24px] text-sm font-bold text-[#55534e] hover:border-[#078a52] hover:text-[#078a52] transition-colors"
          >
            Load 24 More Articles
          </motion.button>
        </div>

        {/* ── Contact Sidebar ── */}
        <div className="lg:col-span-4 space-y-8">
          <div className="p-10 bg-black rounded-[40px] text-white space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#84e7a5] blur-[80px] opacity-20" />
            
            <div className="space-y-2">
              <h3 className="text-3xl font-bold tracking-tight">Direct Help</h3>
              <p className="text-white/50 text-sm leading-relaxed">
                Can't find what you're looking for? Our specialist team is ready to assist.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: MessageCircle, label: "Instant Chat", detail: "Active Now", accent: "#3bd3fd" },
                { icon: Mail, label: "Email Desk", detail: "24h SLA", accent: "#84e7a5" },
                { icon: Phone, label: "Priority Line", detail: "Premium Only", accent: "#fbbd41" },
              ].map((item) => (
                <motion.div
                  key={item.label}
                  whileHover={{ x: 10, backgroundColor: "rgba(255,255,255,0.1)" }}
                  className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer border border-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-bold">{item.label}</h4>
                    <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: item.accent }}>{item.detail}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                </motion.div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/10">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-white/40">
                <span>Business Hours</span>
                <span className="text-[#84e7a5]">Open Now</span>
              </div>
            </div>
          </div>

          <div className="p-8 bg-[#078a52] rounded-[40px] text-white flex items-center justify-between group cursor-pointer overflow-hidden relative">
            <motion.div 
              className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"
            />
            <div className="relative z-10">
              <h4 className="font-bold text-lg">System Status</h4>
              <p className="text-white/70 text-xs">All modules online</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center relative z-10">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* ── Floating Hub ── */}
      <div className="fixed bottom-10 right-10 z-[100]">
        <AnimatePresence>
          {isHubOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 20 }}
              className="absolute bottom-20 right-0 w-72 bg-white border border-[#dad4c8] rounded-[32px] p-6 shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold tracking-tight">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Zap, label: "Tutor", color: "#43089f" },
                  { icon: MessageSquare, label: "Feedback", color: "#fc7981" },
                  { icon: BookOpen, label: "Docs", color: "#078a52" },
                  { icon: Globe, label: "Regional", color: "#3bd3fd" },
                ].map(action => (
                  <button key={action.label} className="p-4 rounded-2xl bg-[#faf9f7] hover:bg-black hover:text-white transition-all group flex flex-col items-center gap-2">
                    <action.icon className="w-5 h-5 transition-transform group-hover:scale-110" style={{ color: action.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">{action.label}</span>
                  </button>
                ))}
              </div>
              <button className="w-full py-3 bg-[#078a52] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#078a52]/20">
                Start Live Chat
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <TutorTooltip text="Open Support Hub" position="left">
          <motion.button
            onClick={() => setIsHubOpen(!isHubOpen)}
            whileHover={{ scale: 1.1, rotate: isHubOpen ? -90 : 0 }}
            whileTap={{ scale: 0.9 }}
            animate={{ backgroundColor: isHubOpen ? "#000000" : "#078a52" }}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl relative"
          >
            {isHubOpen ? <X className="text-white w-7 h-7" /> : <HelpCircle className="text-white w-7 h-7" />}
            {!isHubOpen && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full" />
            )}
          </motion.button>
        </TutorTooltip>
      </div>
    </div>
  );
};

export default Help;
