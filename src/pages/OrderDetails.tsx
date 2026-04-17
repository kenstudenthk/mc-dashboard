import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  CheckCircle,
  Clock,
  FileText,
  Server,
  Building,
  X,
} from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import { usePermission } from "../contexts/PermissionContext";
import { orderService, Order, CreateOrderInput } from "../services/orderService";
import { useOrderByTitle, useInvalidateOrders } from "../services/useOrdersQuery";
import {
  orderTimelineService,
  TimelineEvent,
} from "../services/orderTimelineService";
import {
  serviceAccountService,
  ServiceAccount,
} from "../services/serviceAccountService";

// ─── Option Lists ─────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ["Processing", "Account Created", "Completed", "Cancelled", "Pending for order issued", "Pending Closure", "Pending for other parties"];
const ORDER_TYPE_OPTIONS = ["New Install", "Misc Change", "Contract Renewal", "Termination", "Pre-Pro"];

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed": return "bg-green-100 text-green-700";
    case "Account Created": return "bg-blue-100 text-blue-700";
    case "Processing": return "bg-yellow-100 text-yellow-700";
    case "Cancelled": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
};

// ─── Display Components ───────────────────────────────────────────────────────
const InfoField = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="py-2.5 border-b border-[#1d1d1f]/04 last:border-0">
    <dt className="label-text text-[#1d1d1f]/35 mb-1">{label}</dt>
    <dd className="text-sm font-medium text-[#1d1d1f]">{value || "—"}</dd>
  </div>
);

// ─── Edit Panel Components ────────────────────────────────────────────────────
const inputClass = (val: string) =>
  `w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30 ${val ? "bg-white border-[#0071e3]/40" : "bg-[#f5f5f7] border-[#1d1d1f]/08"}`;

const PanelField = ({
  label,
  children,
  span2 = false,
}: {
  label: string;
  children: React.ReactNode;
  span2?: boolean;
}) => (
  <div className={`space-y-1 ${span2 ? "col-span-2" : ""}`}>
    <label className="text-xs font-medium text-[#1d1d1f]/50">{label}</label>
    {children}
  </div>
);

const PanelToggle = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-[#1d1d1f]/50">{label}</label>
    <div className="flex items-center gap-1 p-1 bg-[#f5f5f7] rounded-lg border border-[#1d1d1f]/08 w-fit">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? "" : opt)}
          className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
            value === opt
              ? "bg-[#0071e3] text-white shadow-sm"
              : "text-[#1d1d1f]/40 hover:text-[#1d1d1f]/70"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const PanelSegmented = ({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="space-y-1">
    <label className="text-xs font-medium text-[#1d1d1f]/50">{label}</label>
    <div className="flex items-center gap-1 p-1 bg-[#f5f5f7] rounded-lg border border-[#1d1d1f]/08">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? "" : opt)}
          className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
            value === opt
              ? "bg-[#0071e3] text-white shadow-sm"
              : "text-[#1d1d1f]/40 hover:text-[#1d1d1f]/70"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const PanelSectionLabel = ({ title }: { title: string }) => (
  <div className="flex items-center gap-2 pt-1 pb-0.5">
    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#1d1d1f]/30">
      {title}
    </span>
    <div className="flex-1 h-px bg-[#1d1d1f]/06" />
  </div>
);

// ─── Page Component ───────────────────────────────────────────────────────────
const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission, userEmail } = usePermission();
  const canEdit = hasPermission("Admin");

  const { data: orderFromCache, isLoading, isError } = useOrderByTitle(id);
  const invalidateOrders = useInvalidateOrders();
  const [orderOverride, setOrderOverride] = useState<Order | null>(null);
  const order = orderOverride ?? orderFromCache ?? null;

  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [serviceAccount, setServiceAccount] = useState<ServiceAccount | null>(null);
  const loading = isLoading && !order;
  const error = isError ? "Failed to load order details." : null;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CreateOrderInput>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleEditOpen = () => {
    if (!order) return;
    setEditForm({
      Title: order.Title,
      SubName: order.SubName ?? "",
      Status: order.Status,
      SRD: order.SRD?.slice(0, 10) ?? "",
      CloudProvider: order.CloudProvider,
      OrderType: order.OrderType,
      ServiceType: order.ServiceType ?? "",
      Amount: order.Amount,
      OasisNumber: order.OasisNumber ?? "",
      OrderReceiveDate: order.OrderReceiveDate?.slice(0, 10) ?? "",
      CxSCompleteDate: order.CxSCompleteDate?.slice(0, 10) ?? "",
      CxSRequestNo: order.CxSRequestNo ?? "",
      TID: order.TID ?? "",
      SDNumber: order.SDNumber ?? "",
      PSJob: order.PSJob ?? "",
      T2T3: order.T2T3 ?? "",
      WelcomeLetter: order.WelcomeLetter ?? "",
      By: order.By ?? "",
      OrderFormURL: order.OrderFormURL ?? "",
      CustomerID: order.CustomerID,
      CustomerName: order.CustomerName,
      ContactPerson: order.ContactPerson ?? "",
      ContactNo: order.ContactNo ?? "",
      ContactEmail: order.ContactEmail ?? "",
      BillingAddress: order.BillingAddress ?? "",
      Remark: order.Remark ?? "",
    });
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleEditClose = () => {
    setIsEditOpen(false);
    setEditError(null);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const updated = await orderService.update(order.id, editForm, userEmail);
      setOrderOverride(updated);
      invalidateOrders();
      handleEditClose();
    } catch {
      setEditError("Failed to save. Please check the PA flow and try again.");
    } finally {
      setEditSaving(false);
    }
  };

  const set = (field: keyof CreateOrderInput, value: string | number) =>
    setEditForm((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (!order?.id) return;
    Promise.allSettled([
      orderTimelineService.getByOrder(order.id),
      serviceAccountService.findByOrderId(order.id),
    ]).then(([eventsResult, accountsResult]) => {
      if (eventsResult.status === "fulfilled") setTimeline(eventsResult.value);
      if (accountsResult.status === "fulfilled" && accountsResult.value.length > 0)
        setServiceAccount(accountsResult.value[0]);
    });
  }, [order?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[#1d1d1f]/30 text-sm">
        Loading…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center py-24 text-red-500 text-sm">
        {error ?? "Order not found."}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/orders"
            className="p-2 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg hover:bg-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#1d1d1f]/60" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-[28px] font-semibold text-[#1d1d1f]"
                style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
              >
                {order.Title}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(order.Status)}`}
              >
                {order.Status}
              </span>
            </div>
            <p className="text-sm text-[#1d1d1f]/45 mt-1">SRD: {formatDate(order.SRD)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg hover:bg-white transition-colors text-[#1d1d1f]/50">
            <Printer className="w-4 h-4" />
          </button>
          <button className="p-2 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg hover:bg-white transition-colors text-[#1d1d1f]/50">
            <Download className="w-4 h-4" />
          </button>
          {canEdit && (
            <TutorTooltip text="Click here to modify the details of this order." position="bottom">
              <button
                onClick={handleEditOpen}
                className="gradient-cta px-5 py-2 rounded-lg font-medium text-sm shadow-sm"
              >
                Edit Order
              </button>
            </TutorTooltip>
          )}
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-5">
          <TutorTooltip
            text="This section contains the core technical details about the cloud service provisioned for this order."
            position="top"
          >
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-[#1d1d1f]/06 pb-4">
                <Server className="w-4 h-4 text-[#0071e3]" />
                <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Cloud Service Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <dl>
                  <InfoField label="Product Subscribe" value={order.CloudProvider} />
                  <InfoField label="Order Type" value={order.OrderType} />
                  <InfoField label="Service Type" value={order.ServiceType} />
                  <InfoField
                    label="Amount"
                    value={`$${order.Amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  />
                  <InfoField label="Billing Account / Secondary ID" value={serviceAccount?.SecondaryID} />
                </dl>
                <dl>
                  <InfoField label="Account ID / Root ID / UID" value={serviceAccount?.PrimaryAccountID ?? order.AccountID} />
                  <InfoField label="Account Name / Cloud Checker Name" value={serviceAccount?.AccountName} />
                  <InfoField label="Domain" value={serviceAccount?.Domain} />
                  <InfoField label="Login Email" value={serviceAccount?.LoginEmail} />
                  <InfoField label="Other Account Information" value={serviceAccount?.OtherInfo} />
                </dl>
              </div>
            </div>
          </TutorTooltip>

          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-[#1d1d1f]/06 pb-4">
              <FileText className="w-4 h-4 text-[#0071e3]" />
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Provisioning & Tracking</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <dl>
                <InfoField label="OASIS Number" value={order.OasisNumber} />
                <InfoField label="Order Receive Date" value={formatDate(order.OrderReceiveDate ?? "")} />
                <InfoField label="CxS Complete Date" value={order.CxSCompleteDate ? formatDate(order.CxSCompleteDate) : "TBC"} />
                <InfoField label="CxS Request No." value={order.CxSRequestNo} />
                <InfoField label="TID" value={order.TID} />
                {order.SDNumber ? (
                  <div className="py-2.5 border-b border-[#1d1d1f]/04 last:border-0">
                    <dt className="label-text text-[#1d1d1f]/35 mb-1">SD Number</dt>
                    <dd className="text-sm font-medium">
                      <a
                        href={`http://10.8.100.3:8080/pabx/servlet/IncidentDetailServlet?incidentId=${order.SDNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0071e3] hover:underline"
                      >
                        {order.SDNumber}
                      </a>
                    </dd>
                  </div>
                ) : (
                  <InfoField label="SD Number" value={order.SDNumber} />
                )}
              </dl>
              <dl>
                <InfoField label="PS Job (Y/N)" value={order.PSJob} />
                <InfoField label="T2 / T3" value={order.T2T3} />
                <InfoField label="Welcome Letter" value={order.WelcomeLetter} />
                <InfoField label="Handled By" value={order.By} />
                {order.OrderFormURL && (
                  <div className="py-2.5 border-b border-[#1d1d1f]/04 last:border-0">
                    <dt className="label-text text-[#1d1d1f]/35 mb-1">Order Form</dt>
                    <dd className="text-sm font-medium">
                      <a
                        href={order.OrderFormURL}
                        download
                        rel="noopener noreferrer"
                        className="text-[#0071e3] hover:underline inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download File
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
            {order.Remark && (
              <div className="mt-4 pt-4 border-t border-[#1d1d1f]/06">
                <dt className="label-text text-[#1d1d1f]/35 mb-1">Remark</dt>
                <dd className="text-sm text-[#1d1d1f] whitespace-pre-wrap">{order.Remark}</dd>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          <TutorTooltip text="Quick details about the customer associated with this order." position="left">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4 border-b border-[#1d1d1f]/06 pb-4">
                <Building className="w-4 h-4 text-[#0071e3]" />
                <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Customer</h2>
              </div>
              <Link
                to={`/customers/${order.CustomerID}`}
                className="text-sm font-semibold text-[#0071e3] hover:underline transition-colors block mb-2"
              >
                {order.CustomerName}
              </Link>
              <p className="text-xs text-[#1d1d1f]/35 mb-4">ID #{order.CustomerID}</p>
              <dl>
                <InfoField label="Contact Person" value={order.ContactPerson} />
                <InfoField label="Contact No." value={order.ContactNo} />
                <InfoField label="Contact Email" value={order.ContactEmail} />
                {order.BillingAddress && (
                  <div className="py-2.5">
                    <dt className="label-text text-[#1d1d1f]/35 mb-1">Billing Address</dt>
                    <dd className="text-sm font-medium text-[#1d1d1f] whitespace-pre-wrap">
                      {order.BillingAddress}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </TutorTooltip>

          <TutorTooltip text="A chronological view of the order's lifecycle." position="left">
            <div className="card p-6">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f] mb-4">Timeline</h2>
              {timeline.length === 0 ? (
                <p className="text-sm text-[#1d1d1f]/30">No timeline events yet.</p>
              ) : (
                <div className="space-y-5 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#1d1d1f]/10 before:to-transparent">
                  {timeline.map((event) => (
                    <div key={event.id} className="relative flex items-start gap-4">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white text-white shadow shrink-0 z-10 ${
                          event.Completed ? "bg-green-500" : "bg-[#0071e3]"
                        }`}
                      >
                        {event.Completed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>
                      <div className="pt-2">
                        <div className="font-semibold text-[#1d1d1f] text-sm">{event.Title}</div>
                        <div className="text-xs text-[#1d1d1f]/45">{formatDate(event.EventDate)}</div>
                        {event.Description && (
                          <div className="text-xs text-[#1d1d1f]/45 mt-0.5">{event.Description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TutorTooltip>
        </div>
      </div>

      {/* ── Edit Slide Panel ─────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isEditOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleEditClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-out ${
          isEditOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1d1d1f]/06 shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-[#1d1d1f]">Edit Order</h2>
            <p className="text-xs text-[#1d1d1f]/40 mt-0.5">{order?.Title}</p>
          </div>
          <button
            onClick={handleEditClose}
            className="p-1.5 rounded-lg text-[#1d1d1f]/35 hover:text-[#1d1d1f]/60 hover:bg-[#f5f5f7] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Panel Body */}
        <form onSubmit={handleEditSave} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {editError && (
            <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {editError}
            </div>
          )}

          {/* Order Info */}
          <section className="space-y-3">
            <PanelSectionLabel title="Order Info" />
            <div className="grid grid-cols-2 gap-3">
              <PanelField label="Order Title" span2>
                <input type="text" required value={editForm.Title ?? ""} onChange={(e) => set("Title", e.target.value)} className={inputClass(editForm.Title ?? "")} />
              </PanelField>
              <PanelField label="Project Name" span2>
                <input type="text" value={editForm.SubName ?? ""} onChange={(e) => set("SubName", e.target.value)} className={inputClass(editForm.SubName ?? "")} placeholder="e.g. Project Alpha" />
              </PanelField>
              <PanelField label="Status">
                <select value={editForm.Status ?? ""} onChange={(e) => set("Status", e.target.value)} className={inputClass(editForm.Status ?? "")}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </PanelField>
              <PanelField label="Order Type">
                <select value={editForm.OrderType ?? ""} onChange={(e) => set("OrderType", e.target.value)} className={inputClass(editForm.OrderType ?? "")}>
                  <option value="">Select…</option>
                  {ORDER_TYPE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </PanelField>
              <PanelField label="SRD">
                <input type="date" value={editForm.SRD ?? ""} onChange={(e) => set("SRD", e.target.value)} className={inputClass(editForm.SRD ?? "")} />
              </PanelField>
              <PanelField label="Cloud Provider">
                <input type="text" value={editForm.CloudProvider ?? ""} onChange={(e) => set("CloudProvider", e.target.value)} className={inputClass(editForm.CloudProvider ?? "")} />
              </PanelField>
              <PanelField label="Service Type">
                <input type="text" value={editForm.ServiceType ?? ""} onChange={(e) => set("ServiceType", e.target.value)} className={inputClass(editForm.ServiceType ?? "")} />
              </PanelField>
              <PanelField label="Amount ($)">
                <input type="number" min={0} step="0.01" value={editForm.Amount ?? ""} onChange={(e) => set("Amount", parseFloat(e.target.value) || 0)} className={inputClass(String(editForm.Amount ?? ""))} />
              </PanelField>
            </div>
          </section>

          {/* Tracking */}
          <section className="space-y-3">
            <PanelSectionLabel title="Tracking" />
            <div className="grid grid-cols-2 gap-3">
              <PanelField label="OASIS Number">
                <input type="text" value={editForm.OasisNumber ?? ""} onChange={(e) => set("OasisNumber", e.target.value)} className={inputClass(editForm.OasisNumber ?? "")} />
              </PanelField>
              <PanelField label="CxS Request No.">
                <input type="text" value={editForm.CxSRequestNo ?? ""} onChange={(e) => set("CxSRequestNo", e.target.value)} className={inputClass(editForm.CxSRequestNo ?? "")} />
              </PanelField>
              <PanelField label="Order Receive Date">
                <input type="date" value={editForm.OrderReceiveDate ?? ""} onChange={(e) => set("OrderReceiveDate", e.target.value)} className={inputClass(editForm.OrderReceiveDate ?? "")} />
              </PanelField>
              <PanelField label="CxS Complete Date">
                <input type="date" value={editForm.CxSCompleteDate ?? ""} onChange={(e) => set("CxSCompleteDate", e.target.value)} className={inputClass(editForm.CxSCompleteDate ?? "")} />
              </PanelField>
              <PanelField label="TID">
                <input type="text" value={editForm.TID ?? ""} onChange={(e) => set("TID", e.target.value)} className={inputClass(editForm.TID ?? "")} />
              </PanelField>
              <PanelField label="SD Number">
                <input type="text" value={editForm.SDNumber ?? ""} onChange={(e) => set("SDNumber", e.target.value)} className={inputClass(editForm.SDNumber ?? "")} />
              </PanelField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <PanelToggle label="PS Job" options={["Y", "N"]} value={editForm.PSJob ?? ""} onChange={(v) => set("PSJob", v)} />
              <PanelToggle label="Welcome Letter" options={["Yes", "No"]} value={editForm.WelcomeLetter ?? ""} onChange={(v) => set("WelcomeLetter", v)} />
            </div>
            <PanelSegmented label="T2 / T3" options={["T1", "T2", "T3", "N/A"]} value={editForm.T2T3 ?? ""} onChange={(v) => set("T2T3", v)} />
            <div className="grid grid-cols-2 gap-3">
              <PanelField label="Handled By">
                <input type="text" value={editForm.By ?? ""} onChange={(e) => set("By", e.target.value)} className={inputClass(editForm.By ?? "")} />
              </PanelField>
              <PanelField label="Order Form URL" span2>
                <input type="url" value={editForm.OrderFormURL ?? ""} onChange={(e) => set("OrderFormURL", e.target.value)} className={inputClass(editForm.OrderFormURL ?? "")} placeholder="https://…" />
              </PanelField>
            </div>
          </section>

          {/* Customer */}
          <section className="space-y-3">
            <PanelSectionLabel title="Customer" />
            <div className="grid grid-cols-2 gap-3">
              <PanelField label="Customer Name" span2>
                <input type="text" value={editForm.CustomerName ?? ""} onChange={(e) => set("CustomerName", e.target.value)} className={inputClass(editForm.CustomerName ?? "")} />
              </PanelField>
              <PanelField label="Contact Person">
                <input type="text" value={editForm.ContactPerson ?? ""} onChange={(e) => set("ContactPerson", e.target.value)} className={inputClass(editForm.ContactPerson ?? "")} />
              </PanelField>
              <PanelField label="Contact No.">
                <input type="text" value={editForm.ContactNo ?? ""} onChange={(e) => set("ContactNo", e.target.value)} className={inputClass(editForm.ContactNo ?? "")} />
              </PanelField>
              <PanelField label="Contact Email" span2>
                <input type="email" value={editForm.ContactEmail ?? ""} onChange={(e) => set("ContactEmail", e.target.value)} className={inputClass(editForm.ContactEmail ?? "")} />
              </PanelField>
              <PanelField label="Billing Address" span2>
                <textarea value={editForm.BillingAddress ?? ""} onChange={(e) => set("BillingAddress", e.target.value)} className={`${inputClass(editForm.BillingAddress ?? "")} min-h-[70px] resize-none`} />
              </PanelField>
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-3">
            <PanelSectionLabel title="Notes" />
            <PanelField label="Remark">
              <textarea value={editForm.Remark ?? ""} onChange={(e) => set("Remark", e.target.value)} className={`${inputClass(editForm.Remark ?? "")} min-h-[100px] resize-none`} />
            </PanelField>
          </section>
        </form>

        {/* Panel Footer */}
        <div className="px-6 py-4 border-t border-[#1d1d1f]/06 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={handleEditClose}
            className="flex-1 px-4 py-2.5 border border-[#1d1d1f]/08 text-[#1d1d1f]/70 font-medium rounded-lg hover:bg-[#f5f5f7] transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleEditSave}
            disabled={editSaving}
            className="flex-1 px-4 py-2.5 bg-[#0071e3] text-white font-medium rounded-lg hover:bg-[#0071e3]/90 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {editSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
