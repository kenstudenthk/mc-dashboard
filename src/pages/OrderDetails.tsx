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
} from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import { orderService, Order } from "../services/orderService";
import {
  orderTimelineService,
  TimelineEvent,
} from "../services/orderTimelineService";

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

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      orderService.findByTitle(id),
      orderTimelineService.getByOrder(id),
    ])
      .then(([ord, events]) => {
        setOrder(ord);
        setTimeline(events);
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
          <TutorTooltip text="Click here to modify the details of this order." position="bottom">
            <button className="gradient-cta px-5 py-2 rounded-lg font-medium text-sm shadow-sm">
              Edit Order
            </button>
          </TutorTooltip>
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
                  <InfoField label="Billing Account" value={order.BillingAccount} />
                </dl>
                <dl>
                  <InfoField label="Account ID / Root ID / UID" value={order.AccountID} />
                  <InfoField label="Account Name / Cloud Checker Name" value={order.AccountName} />
                  <InfoField label="Account Login Email" value={order.AccountLoginEmail} />
                  <InfoField label="Other Account Information" value={order.OtherAccountInfo} />
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
                <InfoField label="CxS Complete Date" value={formatDate(order.CxSCompleteDate ?? "")} />
                <InfoField label="CxS Request No." value={order.CxSRequestNo} />
                <InfoField label="TID" value={order.TID} />
                <InfoField label="SD Number" value={order.SDNumber} />
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
                      <a href={order.OrderFormURL} target="_blank" rel="noopener noreferrer" className="text-[#0071e3] hover:underline break-all">
                        View File
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
    </div>
  );
};

export default OrderDetails;
