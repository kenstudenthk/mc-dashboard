import React, { useCallback, useEffect, useState } from "react";
import DOMPurify from "dompurify";
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
  Mail,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import CloudProviderLogo from "../components/CloudProviderLogo";
import ServiceTimeline, {
  ServiceTimelineProps,
} from "../components/ServiceTimeline";
import { usePermission } from "../contexts/PermissionContext";
import {
  orderService,
  Order,
  CreateOrderInput,
} from "../services/orderService";
import { useOrderById, useInvalidateOrders } from "../services/useOrdersQuery";
import {
  orderTimelineService,
  TimelineEvent,
} from "../services/orderTimelineService";
import {
  serviceAccountService,
  ServiceAccount,
} from "../services/serviceAccountService";
import { orderStepsService, OrderStep } from "../services/orderStepsService";
import { emailService, EmailLog } from "../services/emailService";
import { EmailComposePanel } from "../components/EmailComposePanel";

// ─── Option Lists ─────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  "Processing",
  "Account Created",
  "Completed",
  "Cancelled",
  "Pending for order issued",
  "Pending Closure",
  "Pending for other parties",
];
const ORDER_TYPE_OPTIONS = [
  "New Install",
  "Misc Change",
  "Contract Renewal",
  "Termination",
  "Pre-Pro",
];

// ─── ServiceTimeline mapping ──────────────────────────────────────────────────
function mapCloudProvider(
  raw: string,
): ServiceTimelineProps["provider"] | null {
  const s = raw?.toLowerCase() ?? "";
  if (s.includes("alibaba")) return "Alibaba";
  if (s.includes("azure") || s.includes("microsoft")) return "Azure";
  if (s.includes("gcp") || s.includes("google")) return "GCP";
  if (s.includes("huawei") && (s.includes("ha") || s.includes("hospital")))
    return "HuaweiHA";
  if (s.includes("huawei")) return "Huawei";
  if (s.includes("aws") || s.includes("amazon")) return "AWS";
  return null;
}

function mapOrderFlow(orderType: string): ServiceTimelineProps["flow"] {
  return orderType === "New Install" ? "new" : "migration";
}

function getServiceAccountLabels(provider: ServiceTimelineProps["provider"] | null) {
  switch (provider) {
    case "AWS":
      return {
        primaryAccount: "Payer Account",
        accountId: "AWS ID",
        accountName: "CloudCheckr (Friendly Account Name)",
        loginEmail: "Admin Email",
      };
    case "Alibaba":
      return {
        primaryAccount: "Billing Account",
        accountId: "UID",
        accountName: "Account Name / Cloud Checker Name",
        loginEmail: "Root Account Email",
      };
    case "Huawei":
    case "HuaweiHA":
      return {
        primaryAccount: "Billing Account",
        accountId: "Customer ID",
        accountName: "Account Name",
        loginEmail: "Account Email",
      };
    default:
      return {
        primaryAccount: "Billing Account",
        accountId: "Account ID",
        accountName: "Account Name / Cloud Checker Name",
        loginEmail: "Login Email",
      };
  }
}

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

// Clay swatch status colors
const getStatusStyle = (
  status: string,
): { background: string; color: string } => {
  switch (status) {
    case "Completed":
      return { background: "#84e7a5", color: "#02492a" };
    case "Account Created":
      return { background: "#3bd3fd33", color: "#0089ad" };
    case "Processing":
      return { background: "#f8cc65", color: "#9d6a09" };
    case "Cancelled":
      return { background: "#fc798133", color: "#b0101a" };
    default:
      return { background: "#eee9df", color: "#55534e" };
  }
};

// ─── Display Components ───────────────────────────────────────────────────────
const InfoField = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div
    className="py-2.5 border-b last:border-0"
    style={{ borderColor: "#eee9df" }}
  >
    <dt className="label-text mb-1" style={{ color: "#9f9b93" }}>
      {label}
    </dt>
    <dd className="text-sm font-medium" style={{ color: "#000" }}>
      {value || "—"}
    </dd>
  </div>
);

// ─── Edit Panel Components ────────────────────────────────────────────────────
const inputClass = (val: string) =>
  `w-full px-3.5 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all text-sm placeholder:text-[#9f9b93] ${val ? "bg-white border-black/30" : "bg-[#faf9f7] border-[#dad4c8]"}`;

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
    <label className="text-xs font-medium" style={{ color: "#9f9b93" }}>
      {label}
    </label>
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
    <label className="text-xs font-medium" style={{ color: "#9f9b93" }}>
      {label}
    </label>
    <div
      className="flex items-center gap-1 p-1 rounded-lg w-fit"
      style={{ background: "#faf9f7", border: "1px solid #dad4c8" }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? "" : opt)}
          className="px-3.5 py-1.5 rounded-md text-xs font-medium transition-all"
          style={
            value === opt
              ? { background: "#000", color: "#fff" }
              : { color: "#9f9b93" }
          }
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
    <label className="text-xs font-medium" style={{ color: "#9f9b93" }}>
      {label}
    </label>
    <div
      className="flex items-center gap-1 p-1 rounded-lg"
      style={{ background: "#faf9f7", border: "1px solid #dad4c8" }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? "" : opt)}
          className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all"
          style={
            value === opt
              ? { background: "#000", color: "#fff" }
              : { color: "#9f9b93" }
          }
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const PanelSectionLabel = ({ title }: { title: string }) => (
  <div className="flex items-center gap-2 pt-1 pb-0.5">
    <span
      className="text-[10px] font-semibold uppercase tracking-widest"
      style={{ color: "#9f9b93" }}
    >
      {title}
    </span>
    <div className="flex-1 h-px" style={{ background: "#dad4c8" }} />
  </div>
);

// ─── Page Component ───────────────────────────────────────────────────────────
const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { hasPermission, userEmail } = usePermission();
  const canEdit = hasPermission("Admin");

  const [activeSection, setActiveSection] = useState(0);

  const parsedId = id ? parseInt(id, 10) : undefined;
  const { data: orderFromCache, isLoading, isError } = useOrderById(parsedId);
  const invalidateOrders = useInvalidateOrders();
  const [orderOverride, setOrderOverride] = useState<Order | null>(null);
  const order = orderOverride ?? orderFromCache ?? null;

  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [serviceAccount, setServiceAccount] = useState<ServiceAccount | null>(
    null,
  );
  const [completedSteps, setCompletedSteps] = useState<OrderStep[]>([]);
  const loading = isLoading && !order;
  const error = isError ? "Failed to load order details." : null;

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CreateOrderInput>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [isEmailPanelOpen, setIsEmailPanelOpen] = useState(false);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [expandedEmailIds, setExpandedEmailIds] = useState<Set<number>>(
    new Set(),
  );

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
      CaseID: order.CaseID ?? "",
      CaseIDURL: order.CaseIDURL ?? "",
      CustomerID: order.CustomerID,
      CustomerName: order.CustomerName,
      ContactPerson: order.ContactPerson ?? "",
      ContactNo: order.ContactNo ?? "",
      ContactEmail: order.ContactEmail ?? "",
      ContactNo2: order.ContactNo2 ?? "",
      ContactEmail2: order.ContactEmail2 ?? "",
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

  const refreshEmailLogs = useCallback(() => {
    if (!order?.Title) return;
    emailService
      .findByOrder(order.Title)
      .then(setEmailLogs)
      .catch((err) => console.error('[OrderDetails] email logs fetch failed:', err));
  }, [order?.Title]);

  useEffect(() => {
    if (!order?.id) return;
    Promise.allSettled([
      orderTimelineService.getByOrder(order.id),
      serviceAccountService.findByOrderId(order.id),
      orderStepsService.getByOrderId(order.id),
    ]).then(([eventsResult, accountsResult, stepsResult]) => {
      if (eventsResult.status === "fulfilled") setTimeline(eventsResult.value);
      else console.error('[OrderDetails] timeline fetch failed:', eventsResult.reason);
      if (accountsResult.status === "fulfilled" && accountsResult.value.length > 0)
        setServiceAccount(accountsResult.value[0]);
      else if (accountsResult.status === "rejected")
        console.error('[OrderDetails] service account fetch failed:', accountsResult.reason);
      if (stepsResult.status === "fulfilled") setCompletedSteps(stepsResult.value);
      else console.error('[OrderDetails] steps fetch failed:', stepsResult.reason);
    });
  }, [order?.id]);

  useEffect(() => {
    refreshEmailLogs();
  }, [refreshEmailLogs]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-24 text-sm"
        style={{ color: "#9f9b93" }}
      >
        Loading…
      </div>
    );
  }

  if (error || !order) {
    return (
      <div
        className="flex items-center justify-center py-24 text-sm"
        style={{ color: "#fc7981" }}
      >
        {error ?? "Order not found."}
      </div>
    );
  }

  const statusStyle = getStatusStyle(order.Status);

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/orders"
            className="p-2 rounded-xl transition-colors hover:bg-white"
            style={{ background: "#faf9f7", border: "1px solid #dad4c8" }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: "#9f9b93" }} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-[28px] font-semibold"
                style={{
                  color: "#000",
                  letterSpacing: "-0.56px",
                  lineHeight: "1.1",
                }}
              >
                {order.Title}
              </h1>
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                style={statusStyle}
              >
                {order.Status}
              </span>
            </div>
            <p className="text-sm mt-1" style={{ color: "#9f9b93" }}>
              SRD: {formatDate(order.SRD)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-xl transition-colors hover:bg-white"
            style={{
              background: "#faf9f7",
              border: "1px solid #dad4c8",
              color: "#9f9b93",
            }}
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            className="p-2 rounded-xl transition-colors hover:bg-white"
            style={{
              background: "#faf9f7",
              border: "1px solid #dad4c8",
              color: "#9f9b93",
            }}
          >
            <Download className="w-4 h-4" />
          </button>
          <TutorTooltip
            text="Send an email to the customer using a pre-filled template."
            position="bottom"
            componentName="OrderDetails/SendEmail"
          >
            <button
              onClick={() => setIsEmailPanelOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "#ddf4fd",
                border: "1px solid #3bd3fd50",
                color: "#0089ad",
              }}
            >
              <Mail className="w-4 h-4" />
              Send Email
            </button>
          </TutorTooltip>
          {canEdit && (
            <TutorTooltip
              text="Click here to modify the details of this order."
              position="bottom"
              componentName="OrderDetails/EditOrder"
            >
              <button
                onClick={handleEditOpen}
                className="gradient-cta px-5 py-2 font-medium text-sm"
              >
                Edit Order
              </button>
            </TutorTooltip>
          )}
        </div>
      </div>

      {/* Horizontal Provisioning Steps */}
      {(() => {
        const provider = mapCloudProvider(order.CloudProvider ?? "");
        const flow = mapOrderFlow(order.OrderType ?? "");
        if (!provider) return null;
        return (
          <ServiceTimeline
            provider={provider}
            flow={flow}
            horizontal
            completedSteps={completedSteps}
            onCompleteStep={async (stepKey, stepLabel) => {
              await orderStepsService.complete(
                order.id,
                stepKey,
                stepLabel,
                userEmail,
              );
              const updated = await orderStepsService.getByOrderId(order.id);
              setCompletedSteps(updated);
            }}
            onUncompleteStep={async (stepKey) => {
              await orderStepsService.uncomplete(order.id, stepKey, userEmail);
              const updated = await orderStepsService.getByOrderId(order.id);
              setCompletedSteps(updated);
            }}
          />
        );
      })()}

      {/* Section layout — sidebar nav + content */}
      <div className="flex gap-6 items-start">
        {/* Sticky sidebar */}
        <aside
          className="w-52 shrink-0 bg-white rounded-2xl p-3"
          style={{
            position: "sticky",
            top: "1.5rem",
            border: "1px solid #dad4c8",
            boxShadow:
              "rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.04) 0px -1px 1px inset",
          }}
        >
          <p className="label-text px-3 pt-1 pb-2" style={{ color: "#9f9b93" }}>
            SECTIONS
          </p>
          <div className="space-y-0.5">
            {[
              {
                label: "Order Information",
                icon: <FileText className="w-3.5 h-3.5" />,
              },
              { label: "Customer", icon: <Building className="w-3.5 h-3.5" /> },
              {
                label: "Cloud Service Details",
                icon: <Server className="w-3.5 h-3.5" />,
              },
              {
                label: "Provisioning & Tracking",
                icon: <CheckCircle className="w-3.5 h-3.5" />,
              },
              { label: "Timeline", icon: <Clock className="w-3.5 h-3.5" /> },
              {
                label: "Email History",
                icon: <Mail className="w-3.5 h-3.5" />,
              },
            ].map(({ label, icon }, i) => (
              <button
                key={label}
                onClick={() => setActiveSection(i)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all text-left"
                style={
                  activeSection === i
                    ? { background: "#eee9df", color: "#000" }
                    : { color: "#9f9b93" }
                }
              >
                <span
                  style={{ color: activeSection === i ? "#078a52" : "#c5bfb5" }}
                >
                  {icon}
                </span>
                {label}
              </button>
            ))}
          </div>
        </aside>

        {/* Section content */}
        <main className="flex-1 min-w-0">
          {activeSection === 0 && (
            <div className="card p-6 space-y-0">
              <div
                className="flex items-center gap-2 mb-4 pb-4"
                style={{ borderBottom: "1px solid #eee9df" }}
              >
                <FileText className="w-4 h-4" style={{ color: "#078a52" }} />
                <h2
                  className="text-[17px] font-semibold"
                  style={{ color: "#000" }}
                >
                  Order Information
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <dl>
                  <InfoField label="Order Title" value={order.Title} />
                  <InfoField label="Project Name" value={order.SubName} />
                  <InfoField
                    label="Status"
                    value={
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={statusStyle}
                      >
                        {order.Status}
                      </span>
                    }
                  />
                  <InfoField label="Order Type" value={order.OrderType} />
                </dl>
                <dl>
                  <InfoField label="SRD" value={formatDate(order.SRD)} />
                  <InfoField label="Service Type" value={order.ServiceType} />
                  <InfoField
                    label="Amount"
                    value={
                      order.Amount != null
                        ? `$${Number(order.Amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        : "—"
                    }
                  />
                  <InfoField label="OASIS Number" value={order.OasisNumber} />
                </dl>
              </div>
              {order.Remark && (
                <div
                  className="mt-4 pt-4"
                  style={{ borderTop: "1px solid #eee9df" }}
                >
                  <dt className="label-text mb-1" style={{ color: "#9f9b93" }}>
                    Remark
                  </dt>
                  <dd
                    className="text-sm whitespace-pre-wrap"
                    style={{ color: "#000" }}
                  >
                    {order.Remark}
                  </dd>
                </div>
              )}
            </div>
          )}

          {activeSection === 1 && (
            <TutorTooltip
              text="Quick details about the customer associated with this order."
              position="top"
              componentName="OrderDetails/CustomerSection"
            >
              <div className="card p-6">
                <div
                  className="flex items-center gap-2 mb-4 pb-4"
                  style={{ borderBottom: "1px solid #eee9df" }}
                >
                  <Building className="w-4 h-4" style={{ color: "#078a52" }} />
                  <h2
                    className="text-[17px] font-semibold"
                    style={{ color: "#000" }}
                  >
                    Customer
                  </h2>
                </div>
                <Link
                  to={`/customers/${order.CustomerID}`}
                  className="text-sm font-semibold hover:underline transition-colors block mb-2"
                  style={{ color: "#078a52" }}
                >
                  {order.CustomerName}
                </Link>
                <p className="text-xs mb-4" style={{ color: "#9f9b93" }}>
                  ID #{order.CustomerID}
                </p>
                <dl>
                  <InfoField
                    label="Contact Person"
                    value={order.ContactPerson}
                  />
                  <InfoField label="Contact No." value={order.ContactNo} />
                  <InfoField label="Contact Email" value={order.ContactEmail} />
                  <InfoField label="2nd Contact No." value={order.ContactNo2} />
                  <InfoField
                    label="2nd Contact Email"
                    value={order.ContactEmail2}
                  />
                  {order.BillingAddress && (
                    <div className="py-2.5">
                      <dt
                        className="label-text mb-1"
                        style={{ color: "#9f9b93" }}
                      >
                        Billing Address
                      </dt>
                      <dd
                        className="text-sm font-medium whitespace-pre-wrap"
                        style={{ color: "#000" }}
                      >
                        {order.BillingAddress}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </TutorTooltip>
          )}

          {activeSection === 2 && (() => {
            const saLabels = getServiceAccountLabels(mapCloudProvider(order.CloudProvider ?? ""));
            return (
            <TutorTooltip
              text="This section contains the core technical details about the cloud service provisioned for this order."
              position="top"
              componentName="OrderDetails/CloudServiceDetails"
            >
              <div className="card p-6">
                <div
                  className="flex items-center gap-2 mb-4 pb-4"
                  style={{ borderBottom: "1px solid #eee9df" }}
                >
                  <Server className="w-4 h-4" style={{ color: "#078a52" }} />
                  <h2
                    className="text-[17px] font-semibold"
                    style={{ color: "#000" }}
                  >
                    Cloud Service Details
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <dl>
                    <InfoField
                      label="Product Subscribe"
                      value={
                        <CloudProviderLogo
                          provider={order.CloudProvider ?? ""}
                          size={22}
                          nameClassName="text-sm font-medium"
                        />
                      }
                    />
                    <InfoField
                      label={saLabels.primaryAccount}
                      value={serviceAccount?.PrimaryAccountID}
                    />
                    <InfoField
                      label={saLabels.accountId}
                      label="Billing Account"
                      value={serviceAccount?.PrimaryAccountID}
                    />
                    <InfoField
                      label="Account ID"
                      value={serviceAccount?.SecondaryID}
                    />
                  </dl>
                  <dl>
                    <InfoField
                      label={saLabels.accountName}
                      value={serviceAccount?.AccountName}
                    />
                    <InfoField label="Domain" value={serviceAccount?.Domain} />
                    <InfoField
                      label={saLabels.loginEmail}
                      value={serviceAccount?.LoginEmail}
                    />
                    <InfoField
                      label="Other Account Information"
                      value={serviceAccount?.OtherInfo}
                    />
                  </dl>
                </div>
              </div>
            </TutorTooltip>
            );
          })()}

          {activeSection === 3 && (
            <div className="card p-6">
              <div
                className="flex items-center gap-2 mb-4 pb-4"
                style={{ borderBottom: "1px solid #eee9df" }}
              >
                <FileText className="w-4 h-4" style={{ color: "#078a52" }} />
                <h2
                  className="text-[17px] font-semibold"
                  style={{ color: "#000" }}
                >
                  Provisioning & Tracking
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <dl>
                  <InfoField
                    label="Order Receive Date"
                    value={formatDate(order.OrderReceiveDate ?? "")}
                  />
                  <InfoField
                    label="CxS Complete Date"
                    value={
                      order.CxSCompleteDate
                        ? formatDate(order.CxSCompleteDate)
                        : "TBC"
                    }
                  />
                  <InfoField
                    label="CxS Request No."
                    value={order.CxSRequestNo}
                  />
                  <InfoField label="TID" value={order.TID} />
                  {order.SDNumber ? (
                    <div
                      className="py-2.5 border-b last:border-0"
                      style={{ borderColor: "#eee9df" }}
                    >
                      <dt
                        className="label-text mb-1"
                        style={{ color: "#9f9b93" }}
                      >
                        SD Number
                      </dt>
                      <dd className="text-sm font-medium">
                        <a
                          href={`http://10.8.100.3:8080/pabx/servlet/IncidentDetailServlet?incidentId=${order.SDNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: "#078a52" }}
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
                  <InfoField
                    label="Welcome Letter"
                    value={order.WelcomeLetter}
                  />
                  <InfoField label="Handled By" value={order.By} />
                  {order.CaseID &&
                    (order.CaseIDURL ? (
                      <div
                        className="py-2.5 border-b last:border-0"
                        style={{ borderColor: "#eee9df" }}
                      >
                        <dt
                          className="label-text mb-1"
                          style={{ color: "#9f9b93" }}
                        >
                          Case ID
                        </dt>
                        <dd className="text-sm font-medium">
                          <a
                            href={order.CaseIDURL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                            style={{ color: "#078a52" }}
                          >
                            {order.CaseID}
                          </a>
                        </dd>
                      </div>
                    ) : (
                      <InfoField label="Case ID" value={order.CaseID} />
                    ))}
                  {order.OrderFormURL && (
                    <div
                      className="py-2.5 border-b last:border-0"
                      style={{ borderColor: "#eee9df" }}
                    >
                      <dt
                        className="label-text mb-1"
                        style={{ color: "#9f9b93" }}
                      >
                        Order Form
                      </dt>
                      <dd className="text-sm font-medium">
                        <a
                          href={order.OrderFormURL}
                          download
                          rel="noopener noreferrer"
                          className="hover:underline inline-flex items-center gap-1"
                          style={{ color: "#078a52" }}
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download File
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {activeSection === 4 && (
            <TutorTooltip
              text="A chronological view of the order's lifecycle."
              position="top"
              componentName="OrderDetails/Timeline"
            >
              <div className="card p-6">
                <h2
                  className="text-[17px] font-semibold mb-4"
                  style={{ color: "#000" }}
                >
                  Timeline
                </h2>
                {timeline.length === 0 ? (
                  <p className="text-sm" style={{ color: "#9f9b93" }}>
                    No timeline events yet.
                  </p>
                ) : (
                  <div className="space-y-5 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#dad4c8] before:to-transparent">
                    {timeline.map((event) => (
                      <div
                        key={event.id}
                        className="relative flex items-start gap-4"
                      >
                        <div
                          className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white text-white shadow shrink-0 z-10"
                          style={{
                            background: event.Completed ? "#078a52" : "#000",
                          }}
                        >
                          {event.Completed ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <div className="pt-2">
                          <div
                            className="font-semibold text-sm"
                            style={{ color: "#000" }}
                          >
                            {event.Title}
                          </div>
                          <div className="text-xs" style={{ color: "#9f9b93" }}>
                            {formatDate(event.EventDate)}
                          </div>
                          {event.Description && (
                            <div
                              className="text-xs mt-0.5"
                              style={{ color: "#9f9b93" }}
                            >
                              {event.Description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TutorTooltip>
          )}

          {activeSection === 5 && (
            <div className="card p-6">
              <div
                className="flex items-center justify-between mb-4 pb-4"
                style={{ borderBottom: "1px solid #eee9df" }}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" style={{ color: "#0089ad" }} />
                  <h2
                    className="text-[17px] font-semibold"
                    style={{ color: "#000" }}
                  >
                    Email History
                  </h2>
                </div>
                <span
                  className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "#ddf4fd", color: "#0089ad" }}
                >
                  {emailLogs.length} sent
                </span>
              </div>
              {emailLogs.length === 0 ? (
                <div
                  className="rounded-xl p-6 text-center"
                  style={{ border: "1px dashed #dad4c8" }}
                >
                  <Mail
                    className="w-6 h-6 mx-auto mb-2"
                    style={{ color: "#dad4c8" }}
                  />
                  <p className="text-sm" style={{ color: "#9f9b93" }}>
                    No emails sent for this order yet.
                  </p>
                  <button
                    onClick={() => setIsEmailPanelOpen(true)}
                    className="mt-3 text-sm font-medium transition-colors"
                    style={{ color: "#0089ad" }}
                  >
                    Send the first email →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {emailLogs.map((log) => {
                    const logId = log.id ?? 0;
                    const isExpanded = expandedEmailIds.has(logId);
                    const toggleExpand = () =>
                      setExpandedEmailIds((prev) => {
                        const next = new Set(prev);
                        isExpanded ? next.delete(logId) : next.add(logId);
                        return next;
                      });
                    return (
                      <div key={logId}>
                        <button
                          onClick={toggleExpand}
                          className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-colors hover:bg-[#faf9f7]"
                          style={{ border: "1px solid #eee9df" }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                style={
                                  log.Status === "Sent"
                                    ? {
                                        background: "#d1f4e0",
                                        color: "#02492a",
                                      }
                                    : {
                                        background: "#fde8e8",
                                        color: "#b0101a",
                                      }
                                }
                              >
                                {log.Status}
                              </span>
                              <span
                                className="text-xs font-medium truncate"
                                style={{ color: "#000" }}
                              >
                                {log.Subject}
                              </span>
                            </div>
                            <p
                              className="text-[11px]"
                              style={{ color: "#9f9b93" }}
                            >
                              To: {log.SentTo} · {log.SentBy} ·{" "}
                              {formatDate(log.SentAt)}
                            </p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp
                              className="w-3.5 h-3.5 shrink-0 ml-2"
                              style={{ color: "#9f9b93" }}
                            />
                          ) : (
                            <ChevronDown
                              className="w-3.5 h-3.5 shrink-0 ml-2"
                              style={{ color: "#9f9b93" }}
                            />
                          )}
                        </button>
                        {isExpanded && (
                          <div
                            className="mx-1 px-4 py-3 rounded-b-xl text-xs"
                            style={{
                              border: "1px dashed #dad4c8",
                              borderTop: "none",
                              background: "#faf9f7",
                            }}
                          >
                            {log.CC && (
                              <p className="mb-1" style={{ color: "#9f9b93" }}>
                                CC: {log.CC}
                              </p>
                            )}
                            <p className="mb-1" style={{ color: "#9f9b93" }}>
                              Template: {log.TemplateName}
                            </p>
                            <div
                              className="mt-2 pt-2 prose prose-sm max-w-none"
                              style={{
                                borderTop: "1px solid #dad4c8",
                                color: "#000",
                                fontSize: 12,
                              }}
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(log.BodySnapshot),
                              }}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ── Email Compose Panel ──────────────────────────────────────────────── */}
      <EmailComposePanel
        isOpen={isEmailPanelOpen}
        onClose={() => setIsEmailPanelOpen(false)}
        order={order}
        serviceAccount={serviceAccount}
        onSent={refreshEmailLogs}
      />

      {/* ── Edit Slide Panel ─────────────────────────────────────────────── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isEditOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
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
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: "1px solid #dad4c8" }}
        >
          <div>
            <h2 className="text-[16px] font-semibold" style={{ color: "#000" }}>
              Edit Order
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#9f9b93" }}>
              {order?.Title}
            </p>
          </div>
          <button
            onClick={handleEditClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-[#faf9f7]"
            style={{ color: "#9f9b93" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Panel Body */}
        <form
          onSubmit={handleEditSave}
          className="overflow-y-auto flex-1 px-6 py-5 space-y-5"
        >
          {editError && (
            <div
              className="px-4 py-3 text-sm rounded-xl"
              style={{
                color: "#b0101a",
                background: "#fc798120",
                border: "1px solid #fc798150",
              }}
            >
              {editError}
            </div>
          )}

          {/* Order Info */}
          <section className="space-y-3">
            <PanelSectionLabel title="Order Info" />
            <div className="grid grid-cols-2 gap-3">
              <PanelField label="Order Title" span2>
                <input
                  type="text"
                  required
                  value={editForm.Title ?? ""}
                  onChange={(e) => set("Title", e.target.value)}
                  className={inputClass(editForm.Title ?? "")}
                />
              </PanelField>
              <PanelField label="Project Name" span2>
                <input
                  type="text"
                  value={editForm.SubName ?? ""}
                  onChange={(e) => set("SubName", e.target.value)}
                  className={inputClass(editForm.SubName ?? "")}
                  placeholder="e.g. Project Alpha"
                />
              </PanelField>
              <PanelField label="Status">
                <select
                  value={editForm.Status ?? ""}
                  onChange={(e) => set("Status", e.target.value)}
                  className={inputClass(editForm.Status ?? "")}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </PanelField>
              <PanelField label="Order Type">
                <select
                  value={editForm.OrderType ?? ""}
                  onChange={(e) => set("OrderType", e.target.value)}
                  className={inputClass(editForm.OrderType ?? "")}
                >
                  <option value="">Select…</option>
                  {ORDER_TYPE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </PanelField>
              <PanelField label="SRD">
                <input
                  type="date"
                  value={editForm.SRD ?? ""}
                  onChange={(e) => set("SRD", e.target.value)}
                  className={inputClass(editForm.SRD ?? "")}
                />
              </PanelField>
              <PanelField label="Cloud Provider">
                <input
                  type="text"
                  value={editForm.CloudProvider ?? ""}
                  onChange={(e) => set("CloudProvider", e.target.value)}
                  className={inputClass(editForm.CloudProvider ?? "")}
                />
              </PanelField>
              <PanelField label="Service Type">
                <input
                  type="text"
                  value={editForm.ServiceType ?? ""}
                  onChange={(e) => set("ServiceType", e.target.value)}
                  className={inputClass(editForm.ServiceType ?? "")}
                />
              </PanelField>
              <PanelField label="Amount ($)">
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={editForm.Amount ?? ""}
                  onChange={(e) =>
                    set("Amount", parseFloat(e.target.value) || 0)
                  }
                  className={inputClass(String(editForm.Amount ?? ""))}
                />
              </PanelField>
            </div>
          </section>

          {/* Tracking */}
          <section className="space-y-3">
            <PanelSectionLabel title="Tracking" />
            <div className="grid grid-cols-2 gap-3">
              <PanelField label="OASIS Number">
                <input
                  type="text"
                  value={editForm.OasisNumber ?? ""}
                  onChange={(e) => set("OasisNumber", e.target.value)}
                  className={inputClass(editForm.OasisNumber ?? "")}
                />
              </PanelField>
              <PanelField label="CxS Request No.">
                <input
                  type="text"
                  value={editForm.CxSRequestNo ?? ""}
                  onChange={(e) => set("CxSRequestNo", e.target.value)}
                  className={inputClass(editForm.CxSRequestNo ?? "")}
                />
              </PanelField>
              <PanelField label="Order Receive Date">
                <input
                  type="date"
                  value={editForm.OrderReceiveDate ?? ""}
                  onChange={(e) => set("OrderReceiveDate", e.target.value)}
                  className={inputClass(editForm.OrderReceiveDate ?? "")}
                />
              </PanelField>
              <PanelField label="CxS Complete Date">
                <input
                  type="date"
                  value={editForm.CxSCompleteDate ?? ""}
                  onChange={(e) => set("CxSCompleteDate", e.target.value)}
                  className={inputClass(editForm.CxSCompleteDate ?? "")}
                />
              </PanelField>
              <PanelField label="TID">
                <input
                  type="text"
                  value={editForm.TID ?? ""}
                  onChange={(e) => set("TID", e.target.value)}
                  className={inputClass(editForm.TID ?? "")}
                />
              </PanelField>
              <PanelField label="SD Number">
                <input
                  type="text"
                  value={editForm.SDNumber ?? ""}
                  onChange={(e) => set("SDNumber", e.target.value)}
                  className={inputClass(editForm.SDNumber ?? "")}
                />
              </PanelField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <PanelToggle
                label="PS Job"
                options={["Y", "N"]}
                value={editForm.PSJob ?? ""}
                onChange={(v) => set("PSJob", v)}
              />
              <PanelToggle
                label="Welcome Letter"
                options={["Yes", "No"]}
                value={editForm.WelcomeLetter ?? ""}
                onChange={(v) => set("WelcomeLetter", v)}
              />
            </div>
            <PanelSegmented
              label="T2 / T3"
              options={["T1", "T2", "T3", "N/A"]}
              value={editForm.T2T3 ?? ""}
              onChange={(v) => set("T2T3", v)}
            />
            <div className="grid grid-cols-2 gap-3">
              <PanelField label="Handled By">
                <input
                  type="text"
                  value={editForm.By ?? ""}
                  onChange={(e) => set("By", e.target.value)}
                  className={inputClass(editForm.By ?? "")}
                />
              </PanelField>
              <PanelField label="Order Form URL" span2>
                <input
                  type="url"
                  value={editForm.OrderFormURL ?? ""}
                  onChange={(e) => set("OrderFormURL", e.target.value)}
                  className={inputClass(editForm.OrderFormURL ?? "")}
                  placeholder="https://…"
                />
              </PanelField>
              <PanelField label="Case ID">
                <input
                  type="text"
                  value={editForm.CaseID ?? ""}
                  onChange={(e) => set("CaseID", e.target.value)}
                  className={inputClass(editForm.CaseID ?? "")}
                />
              </PanelField>
              <PanelField label="Case ID URL" span2>
                <input
                  type="url"
                  value={editForm.CaseIDURL ?? ""}
                  onChange={(e) => set("CaseIDURL", e.target.value)}
                  className={inputClass(editForm.CaseIDURL ?? "")}
                  placeholder="https://…"
                />
              </PanelField>
            </div>
          </section>

          {/* Customer */}
          <section className="space-y-3">
            <PanelSectionLabel title="Customer" />
            <div className="grid grid-cols-2 gap-3">
              <PanelField label="Customer Name" span2>
                <input
                  type="text"
                  value={editForm.CustomerName ?? ""}
                  onChange={(e) => set("CustomerName", e.target.value)}
                  className={inputClass(editForm.CustomerName ?? "")}
                />
              </PanelField>
              <PanelField label="Contact Person">
                <input
                  type="text"
                  value={editForm.ContactPerson ?? ""}
                  onChange={(e) => set("ContactPerson", e.target.value)}
                  className={inputClass(editForm.ContactPerson ?? "")}
                />
              </PanelField>
              <PanelField label="Contact No.">
                <input
                  type="text"
                  value={editForm.ContactNo ?? ""}
                  onChange={(e) => set("ContactNo", e.target.value)}
                  className={inputClass(editForm.ContactNo ?? "")}
                />
              </PanelField>
              <PanelField label="Contact Email" span2>
                <input
                  type="email"
                  value={editForm.ContactEmail ?? ""}
                  onChange={(e) => set("ContactEmail", e.target.value)}
                  className={inputClass(editForm.ContactEmail ?? "")}
                />
              </PanelField>
              <PanelField label="2nd Contact No.">
                <input
                  type="text"
                  value={editForm.ContactNo2 ?? ""}
                  onChange={(e) => set("ContactNo2", e.target.value)}
                  className={inputClass(editForm.ContactNo2 ?? "")}
                />
              </PanelField>
              <PanelField label="2nd Contact Email" span2>
                <input
                  type="email"
                  value={editForm.ContactEmail2 ?? ""}
                  onChange={(e) => set("ContactEmail2", e.target.value)}
                  className={inputClass(editForm.ContactEmail2 ?? "")}
                />
              </PanelField>
              <PanelField label="Billing Address" span2>
                <textarea
                  value={editForm.BillingAddress ?? ""}
                  onChange={(e) => set("BillingAddress", e.target.value)}
                  className={`${inputClass(editForm.BillingAddress ?? "")} min-h-[70px] resize-none`}
                />
              </PanelField>
            </div>
          </section>

          {/* Notes */}
          <section className="space-y-3">
            <PanelSectionLabel title="Notes" />
            <PanelField label="Remark">
              <textarea
                value={editForm.Remark ?? ""}
                onChange={(e) => set("Remark", e.target.value)}
                className={`${inputClass(editForm.Remark ?? "")} min-h-[100px] resize-none`}
              />
            </PanelField>
          </section>
        </form>

        {/* Panel Footer */}
        <div
          className="px-6 py-4 flex gap-3 shrink-0"
          style={{ borderTop: "1px solid #dad4c8" }}
        >
          <button
            type="button"
            onClick={handleEditClose}
            className="flex-1 px-4 py-2.5 font-medium rounded-xl transition-colors text-sm hover:bg-[#faf9f7]"
            style={{ border: "1px solid #dad4c8", color: "#55534e" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleEditSave}
            disabled={editSaving}
            className="flex-1 px-4 py-2.5 text-white font-medium rounded-xl transition-colors text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#000" }}
            onMouseEnter={(e) => {
              if (!editSaving)
                (e.currentTarget as HTMLButtonElement).style.background =
                  "#333";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#000";
            }}
          >
            {editSaving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
