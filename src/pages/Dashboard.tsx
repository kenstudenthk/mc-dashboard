import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from "motion/react";
import { 
  Clock, 
  Calendar, 
  Cloud, 
  List, 
  Eye, 
  Plus, 
  ArrowRight, 
  ChevronRight,
  TrendingUp,
  Activity
} from "lucide-react";
import { Link } from "react-router-dom";
import { TutorTooltip } from "../components/TutorTooltip";
import { Order } from "../services/orderService";
import { useOrders } from "../services/useOrdersQuery";
import { normalizeCloudProvider } from "../constants/cloudProviders";

// ── Clay Design Constants ───────────────────────────────────────────────────
const CLAY_ACCENTS = {
  matcha: { main: "#078a52", light: "#84e7a5", dark: "#02492a" },
  slushie: { main: "#3bd3fd", light: "#b2f0ff", dark: "#0089ad" },
  lemon: { main: "#fbbd41", light: "#f8cc65", dark: "#9d6a09" },
  ube: { main: "#43089f", light: "#c1b0ff", dark: "#32037d" },
  pomegranate: { main: "#fc7981", light: "#ffb3b8", dark: "#a12d35" },
};

const INCOMPLETE_STATUSES = new Set([
  "Processing",
  "Account Created",
  "Pending for order issued",
  "Pending for other parties",
  "Pending Closure",
]);

// ── Helpers ─────────────────────────────────────────────────────────────────

const isToday = (isoDate: string): boolean => {
  if (!isoDate) return false;
  try {
    const d = new Date(isoDate);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
};

const formatDate = (iso: string): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-GB", { month: "short" });
    const year = String(d.getFullYear()).slice(2);
    return `${day}-${month}-${year}`;
  } catch {
    return iso;
  }
};

const getStatusStyles = (status: string) => {
  switch (status) {
    case "Completed":
      return { color: "#078a52", bg: "#84e7a5", label: "Completed" };
    case "Account Created":
      return { color: "#0089ad", bg: "#b2f0ff", label: "Account Created" };
    case "Processing":
      return { color: "#9d6a09", bg: "#f8cc65", label: "Processing" };
    case "Pending for order issued":
      return { color: "#a12d35", bg: "#ffb3b8", label: "Pending Issue" };
    case "Cancelled":
      return { color: "#32037d", bg: "#c1b0ff", label: "Cancelled" };
    default:
      return { color: "#55534e", bg: "#dad4c8", label: status };
  }
};

// ── Sub-components ─────────────────────────────────────────────────────────

/**
 * Animated Number Counter
 */
const AnimatedCounter = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.5,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (latest) => setDisplayValue(Math.floor(latest))
    });
    return () => controls.stop();
  }, [value]);

  return <>{displayValue}</>;
};

/**
 * Kinetic Typography Header
 */
const AnimatedTitle = ({ text }: { text: string }) => {
  return (
    <h1 className="text-5xl sm:text-7xl font-bold text-[#000000] tracking-tighter leading-[1.1] perspective-1000 flex flex-wrap gap-x-4">
      {text.split(" ").map((word, i) => (
        <span key={i} className="inline-block whitespace-nowrap overflow-hidden py-1">
          <motion.span
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] }}
            className="inline-block"
          >
            {word}
          </motion.span>
        </span>
      ))}
    </h1>
  );
};

/**
 * Bento Stat Card with Liquid Animation
 */
const BentoStatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  accent, 
  tooltip 
}: { 
  label: string; 
  value: number; 
  icon: any; 
  accent: keyof typeof CLAY_ACCENTS;
  tooltip: string;
}) => {
  const colors = CLAY_ACCENTS[accent];
  
  return (
    <TutorTooltip text={tooltip} position="bottom">
      <motion.div
        whileHover={{ rotateZ: -2, y: -8 }}
        className="group relative cursor-pointer h-full"
      >
        {/* Hard Shadow */}
        <div className="absolute inset-0 rounded-[32px] translate-x-[8px] translate-y-[8px] bg-black opacity-10 group-hover:opacity-100 group-hover:translate-x-[12px] group-hover:translate-y-[12px] transition-all duration-300" />
        
        {/* Card Body */}
        <div className="relative h-full bg-white border border-[#dad4c8] rounded-[32px] p-7 flex flex-col gap-6 overflow-hidden z-10">
          {/* Animated Blob */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-[60px] opacity-10 group-hover:opacity-30"
            style={{ backgroundColor: colors.main }}
          />

          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: "#faf9f7" }}>
              <Icon className="w-6 h-6" style={{ color: colors.main }} />
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-[#9f9b93]">
              <Activity className="w-3 h-3" />
              Live
            </div>
          </div>

          <div>
            <div className="text-5xl font-black text-[#000000] tracking-tighter leading-none mb-1">
              <AnimatedCounter value={value} />
            </div>
            <div className="text-sm font-bold text-[#9f9b93] tracking-tight uppercase">
              {label}
            </div>
          </div>
        </div>
      </motion.div>
    </TutorTooltip>
  );
};

/**
 * Modern List Item
 */
const OrderListItem = ({ order, index }: { order: Order; index: number }) => {
  const styles = getStatusStyles(order.Status);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
      whileHover={{ scale: 1.01, x: 4 }}
      className="group relative"
    >
      <Link 
        to={`/orders/${order.Title}`}
        className="flex items-center gap-4 p-4 rounded-2xl hover:bg-[#faf9f7] transition-all border border-transparent hover:border-[#dad4c8]"
      >
        <div className="w-10 h-10 rounded-xl bg-white border border-[#dad4c8] flex items-center justify-center font-bold text-[10px] text-[#55534e]">
          #{order.Title.slice(-3)}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-black text-[#000000] truncate tracking-tight">{order.CustomerName}</h4>
          <p className="text-[11px] font-bold text-[#9f9b93] uppercase tracking-wider">{order.Title}</p>
        </div>

        <div className="hidden sm:flex flex-col items-end gap-1 px-4 border-r border-[#dad4c8]/50">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[#9f9b93]">SRD</span>
          <span className="text-[11px] font-bold text-[#55534e]">{formatDate(order.SRD)}</span>
        </div>

        <div className="flex items-center gap-3">
          <div 
            className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
            style={{ color: styles.color, backgroundColor: styles.bg + "40" }}
          >
            <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: styles.color }} />
            {styles.label}
          </div>
          <ChevronRight className="w-4 h-4 text-[#dad4c8] group-hover:text-[#000000] transition-colors" />
        </div>
      </Link>
    </motion.div>
  );
};

// ── Main Dashboard ──────────────────────────────────────────────────────────

const Dashboard = () => {
  const { data, isLoading: loading } = useOrders();
  const orders: Order[] = Array.isArray(data) ? data : [];

  const incompleteOrders = orders.filter((o) => INCOMPLETE_STATUSES.has(o.Status));
  const srdTodayOrders = orders.filter((o) => isToday(o.SRD));
  const preProvisionOrders = orders.filter((o) => o.Title === "TBC");
  const completedCount = orders.filter((o) => o.Status === "Completed").length;

  return (
    <div className="max-w-7xl mx-auto pb-32 px-6">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#078a52]/03 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#43089f]/03 rounded-full blur-[140px]" />
      </div>

      {/* Header Section */}
      <section className="relative pt-16 pb-12 z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-[#078a52]">
            <TrendingUp className="w-4 h-4" />
            Provisioning Intelligence
          </div>
          <AnimatedTitle text="System Overview" />
        </div>

        <TutorTooltip text="Launch the new order workflow" position="left">
          <Link to="/orders/new">
            <motion.button
              whileHover={{ scale: 1.05, rotateZ: 2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 px-8 py-5 bg-[#000000] text-white rounded-[24px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-black/20 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#078a52] to-[#3bd3fd] opacity-0 group-hover:opacity-20 transition-opacity" />
              <Plus className="w-5 h-5" />
              <span>Create New Order</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </TutorTooltip>
      </section>

      {/* KPI Grid */}
      <section className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 z-10">
        <BentoStatCard 
          label="Incomplete" 
          value={incompleteOrders.length} 
          icon={Clock} 
          accent="lemon"
          tooltip="Orders currently in progress"
        />
        <BentoStatCard 
          label="SRD Today" 
          value={srdTodayOrders.length} 
          icon={Calendar} 
          accent="slushie"
          tooltip="Deliveries due within 24 hours"
        />
        <BentoStatCard 
          label="Pre-Provision" 
          value={preProvisionOrders.length} 
          icon={Cloud} 
          accent="ube"
          tooltip="Awaiting official service numbers"
        />
        <BentoStatCard 
          label="Completed" 
          value={completedCount} 
          icon={List} 
          accent="matcha"
          tooltip="Total lifetime success"
        />
      </section>

      {/* Main Content Grid */}
      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        
        {/* Incomplete Orders Focus */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-end justify-between border-b-2 border-black pb-4">
            <h2 className="text-3xl font-black tracking-tighter uppercase italic">Pending Action</h2>
            <Link to="/orders" className="text-[10px] font-black uppercase tracking-widest text-[#078a52] hover:underline flex items-center gap-1">
              Registry <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="bg-white border border-[#dad4c8] rounded-[32px] p-2 overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 text-center text-[#9f9b93] font-bold animate-pulse uppercase tracking-widest text-xs">
                Hydrating Data...
              </div>
            ) : incompleteOrders.length === 0 ? (
              <div className="py-20 text-center text-[#9f9b93] font-bold uppercase tracking-widest text-xs">
                Zero Pending Orders
              </div>
            ) : (
              <div className="flex flex-col">
                {incompleteOrders.slice(0, 6).map((order, i) => (
                  <OrderListItem key={order.id} order={order} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Secondary Insights */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          
          {/* SRD Today Card */}
          <div className="relative group">
            <div className="absolute inset-0 rounded-[32px] translate-x-[4px] translate-y-[4px] bg-[#3bd3fd] opacity-10 group-hover:opacity-20 transition-all" />
            <div className="relative bg-white border border-[#dad4c8] rounded-[32px] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight uppercase italic flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3bd3fd]" />
                  Due Today
                </h3>
                <span className="text-[10px] font-black text-[#9f9b93] uppercase tracking-widest">
                  {srdTodayOrders.length} Deliveries
                </span>
              </div>
              
              <div className="space-y-3">
                {srdTodayOrders.length === 0 ? (
                  <p className="py-4 text-center text-[#9f9b93] text-xs font-bold uppercase tracking-tighter">Quiet Day</p>
                ) : (
                  srdTodayOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-[#faf9f7] rounded-2xl border border-[#dad4c8]/50">
                      <span className="text-xs font-bold text-[#000000]">{order.CustomerName}</span>
                      <Link to={`/orders/${order.Title}`} className="w-7 h-7 rounded-lg bg-white border border-[#dad4c8] flex items-center justify-center hover:bg-black hover:text-white transition-all">
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Pre-Provision Insight */}
          <div className="relative group flex-1">
            <div className="absolute inset-0 rounded-[32px] translate-x-[4px] translate-y-[4px] bg-[#43089f] opacity-10 group-hover:opacity-20 transition-all" />
            <div className="relative bg-white border border-[#dad4c8] rounded-[32px] p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight uppercase italic flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#43089f]" />
                  TBC Registry
                </h3>
              </div>

              <div className="flex-1 space-y-3">
                {preProvisionOrders.length === 0 ? (
                   <p className="py-4 text-center text-[#9f9b93] text-xs font-bold uppercase tracking-tighter">No Active Pre-provisions</p>
                ) : (
                  preProvisionOrders.slice(0, 4).map((order) => (
                    <div key={order.id} className="flex items-center gap-3 p-3 hover:bg-[#faf9f7] rounded-xl transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-[#faf9f7] flex items-center justify-center">
                        <Cloud className="w-4 h-4 text-[#43089f]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-[#000000] truncate uppercase">{order.CustomerName}</p>
                        <p className="text-[10px] font-bold text-[#9f9b93]">{normalizeCloudProvider(order.CloudProvider ?? "")}</p>
                      </div>
                      <span className="text-[9px] font-black text-[#9f9b93]">{formatDate(order.SRD)}</span>
                    </div>
                  ))
                )}
              </div>
              
              <Link 
                to="/orders" 
                className="mt-auto py-3 bg-[#faf9f7] border border-[#dad4c8] rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-black hover:text-white transition-all"
              >
                View Full TBC Registry
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
