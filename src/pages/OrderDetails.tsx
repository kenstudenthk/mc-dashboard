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
import {
  orderTimelineService,
  TimelineEvent,
} from "../services/orderTimelineService";
import {
  serviceAccountService,
  ServiceAccount,
} from "../services/serviceAccountService";

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
    case "Completed":
      return "bg-green-100 text-green-700";
    case "Account Created":
      return "bg-blue-100 text-blue-700";
    case "Processing":
      return "bg-yellow-100 text-yellow-700";
    case "Cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const InfoField = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="py-2.5 border-b border-[#1d1d1f]/04 last:border-0">
    <dt className="label-text text-[#1d1d1f]/35 mb-1">{label}</dt>
    <dd className="text-sm font-medium text-[#1d1d1f]">{value || "—"}</dd>
  </div>
);

const STATUS_OPTIONS = ["Processing", "Account Created", "Completed", "Cancelled"];
const inputClass = "w-full px-4 py-2.5 bg-[#f5f5f7] border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all text-sm text-[#1d1d1f] placeholder:text-[#1d1d1f]/30";

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission, userEmail } = usePermission();
  const canEdit = hasPermission("Admin");

  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [serviceAccount, setServiceAccount] = useState<ServiceAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CreateOrderInput>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleEditOpen = () => {
    if (!order) return;
    setEditForm({
      Title: order.Title,
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
      setOrder(updated);
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
    if (!id) return;
    const numericId = /^\d+$/.test(id) ? parseInt(id, 10) : null;
    const orderPromise = numericId !== null
      ? orderService.findById(numericId)
      : orderService.findByTitle(id);
    orderPromise
      .then((ord) => {
        setOrder(ord);
        return Promise.allSettled([
          orderTimelineService.getByOrder(ord.id),
          serviceAccountService.findByOrderId(ord.id),
        ]);
      })
      .then(([eventsResult, accountsResult]) => {
        if (eventsResult.status === "fulfilled") setTimeline(eventsResult.value);
        if (accountsResult.status === "fulfilled" && accountsResult.value.length > 0)
          setServiceAccount(accountsResult.value[0]);
      })
      .catch(() => setError("Failed to load order details."))
      .finally(() => setLoading(false));
  }, [id]);

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
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(order.Status)}`}>
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
                <h2 className="text-[17px] font-semibold text-[#1d1d1f]">
                  Cloud Service Details
                </h2>
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
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">
                Provisioning & Tracking
              </h2>
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
                      <a href={order.OrderFormURL} download rel="noopener noreferrer" className="text-[#0071e3] hover:underline inline-flex items-center gap-1">
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
                    <dd className="text-sm font-medium text-[#1d1d1f] whitespace-pre-wrap">{order.BillingAddress}</dd>
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
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white text-white shadow shrink-0 z-10 ${event.Completed ? "bg-green-500" : "bg-[#0071e3]"}`}
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

      {isEditOpen && (
        <div className="fixed inset-0 bg-[#1d1d1f]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#1d1d1f]/06 shrink-0">
              <h2 className="text-[17px] font-semibold text-[#1d1d1f]">Edit Order — {order?.Title}</h2>
              <button onClick={handleEditClose} className="text-[#1d1d1f]/35 hover:text-[#1d1d1f]/60 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSave} className="overflow-y-auto flex-1 p-6 space-y-6">
              {editError && (
                <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                  {editError}
                </div>
              )}

              {/* Order Info */}
              <section>
                <h3 className="text-xs font-semibold text-[#1d1d1f]/40 uppercase tracking-wider mb-3">Order Info</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Order Title</label>
                    <input type="text" required value={editForm.Title ?? ""} onChange={(e) => set("Title", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Status</label>
                    <select value={editForm.Status ?? ""} onChange={(e) => set("Status", e.target.value)} className={inputClass}>
                      {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">SRD</label>
                    <input type="date" value={editForm.SRD ?? ""} onChange={(e) => set("SRD", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Cloud Provider</label>
                    <input type="text" value={editForm.CloudProvider ?? ""} onChange={(e) => set("CloudProvider", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Order Type</label>
                    <input type="text" value={editForm.OrderType ?? ""} onChange={(e) => set("OrderType", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Service Type</label>
                    <input type="text" value={editForm.ServiceType ?? ""} onChange={(e) => set("ServiceType", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Amount ($)</label>
                    <input type="number" min={0} step="0.01" value={editForm.Amount ?? ""} onChange={(e) => set("Amount", parseFloat(e.target.value) || 0)} className={inputClass} />
                  </div>
                </div>
              </section>

              {/* Tracking */}
              <section>
                <h3 className="text-xs font-semibold text-[#1d1d1f]/40 uppercase tracking-wider mb-3">Tracking</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">OASIS Number</label>
                    <input type="text" value={editForm.OasisNumber ?? ""} onChange={(e) => set("OasisNumber", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">CxS Request No.</label>
                    <input type="text" value={editForm.CxSRequestNo ?? ""} onChange={(e) => set("CxSRequestNo", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Order Receive Date</label>
                    <input type="date" value={editForm.OrderReceiveDate ?? ""} onChange={(e) => set("OrderReceiveDate", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">CxS Complete Date</label>
                    <input type="date" value={editForm.CxSCompleteDate ?? ""} onChange={(e) => set("CxSCompleteDate", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">TID</label>
                    <input type="text" value={editForm.TID ?? ""} onChange={(e) => set("TID", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">SD Number</label>
                    <input type="text" value={editForm.SDNumber ?? ""} onChange={(e) => set("SDNumber", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">PS Job (Y/N)</label>
                    <input type="text" value={editForm.PSJob ?? ""} onChange={(e) => set("PSJob", e.target.value)} className={inputClass} placeholder="Y or N" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">T2 / T3</label>
                    <input type="text" value={editForm.T2T3 ?? ""} onChange={(e) => set("T2T3", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Welcome Letter</label>
                    <input type="text" value={editForm.WelcomeLetter ?? ""} onChange={(e) => set("WelcomeLetter", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Handled By</label>
                    <input type="text" value={editForm.By ?? ""} onChange={(e) => set("By", e.target.value)} className={inputClass} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Order Form URL</label>
                    <input type="url" value={editForm.OrderFormURL ?? ""} onChange={(e) => set("OrderFormURL", e.target.value)} className={inputClass} placeholder="https://..." />
                  </div>
                </div>
              </section>

              {/* Customer */}
              <section>
                <h3 className="text-xs font-semibold text-[#1d1d1f]/40 uppercase tracking-wider mb-3">Customer</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Customer Name</label>
                    <input type="text" value={editForm.CustomerName ?? ""} onChange={(e) => set("CustomerName", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Contact Person</label>
                    <input type="text" value={editForm.ContactPerson ?? ""} onChange={(e) => set("ContactPerson", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Contact No.</label>
                    <input type="text" value={editForm.ContactNo ?? ""} onChange={(e) => set("ContactNo", e.target.value)} className={inputClass} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Contact Email</label>
                    <input type="email" value={editForm.ContactEmail ?? ""} onChange={(e) => set("ContactEmail", e.target.value)} className={inputClass} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-[#1d1d1f]/60">Billing Address</label>
                    <textarea value={editForm.BillingAddress ?? ""} onChange={(e) => set("BillingAddress", e.target.value)} className={`${inputClass} min-h-[70px] resize-none`} />
                  </div>
                </div>
              </section>

              {/* Notes */}
              <section>
                <h3 className="text-xs font-semibold text-[#1d1d1f]/40 uppercase tracking-wider mb-3">Notes</h3>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-[#1d1d1f]/60">Remark</label>
                  <textarea value={editForm.Remark ?? ""} onChange={(e) => set("Remark", e.target.value)} className={`${inputClass} min-h-[90px] resize-none`} />
                </div>
              </section>
            </form>

            <div className="p-6 border-t border-[#1d1d1f]/06 flex gap-3 shrink-0">
              <button type="button" onClick={handleEditClose} className="flex-1 px-4 py-2 border border-[#1d1d1f]/08 text-[#1d1d1f]/70 font-medium rounded-lg hover:bg-[#f5f5f7] transition-colors text-sm">
                Cancel
              </button>
              <button type="submit" form="edit-order-form" disabled={editSaving} onClick={handleEditSave} className="flex-1 px-4 py-2 bg-[#0071e3] text-white font-medium rounded-lg hover:bg-[#0071e3]/90 transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed">
                {editSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
