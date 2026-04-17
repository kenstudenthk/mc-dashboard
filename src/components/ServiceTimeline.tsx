import React, { useState, useEffect } from "react";
import { Check } from "lucide-react";
import CloudProviderLogo from "./CloudProviderLogo";
import type { OrderStep } from "../services/orderStepsService";

interface TimelineStep {
  id: number;
  title: string;
  description: string;
}

interface TimelineFlows {
  new: TimelineStep[];
  migration?: TimelineStep[];
}

type Provider = "Alibaba" | "Azure" | "GCP" | "Huawei" | "HuaweiHA" | "AWS";
type Flow = "new" | "migration";
type StepState = "done" | "active" | "upcoming";

const TIMELINE_DATA: Record<Provider, TimelineFlows> = {
  Alibaba: {
    new: [
      { id: 1, title: "Submit Information", description: "Enter the customer's details into the Alibaba Channel Platform." },
      { id: 2, title: "Send Invitation", description: "Initiate and send the account registration invitation email to the customer." },
      { id: 3, title: "Customer Registration", description: "Wait for customer to accept invitation and complete registration (status: Lead → Official)." },
      { id: 4, title: "Send Welcome Letter", description: "Once account is registered and order is issued, send the Welcome Letter." },
    ],
    migration: [
      { id: 1, title: "Send Migration Request", description: "Email B&Data with order form to request migrating the customer's existing Alibaba account to HKT master account." },
      { id: 2, title: "Wait for Confirmation", description: "Receive email confirmation from B&Data that migration is successful." },
      { id: 3, title: "Send Welcome Letter", description: "Send the Welcome Letter to the customer." },
    ],
  },
  Azure: {
    new: [
      { id: 1, title: "Create Customer", description: "Enter customer information into the Microsoft 365 CSP Portal." },
      { id: 2, title: "Add Azure Plan", description: "Create a new subscription and add the Azure Plan to the cart." },
      { id: 3, title: "Request Permissions", description: "Send GDAP request to the customer and wait for acceptance." },
      { id: 4, title: "Assign Roles", description: "Assign CSP security group and configure Owner roles in Azure Management Portal." },
      { id: 5, title: "Send Welcome Letter", description: "Send login credentials and Welcome Letter to the customer." },
    ],
    migration: [
      { id: 1, title: "Transfer Subscription", description: "Handle migration to transfer M365 tenant and Azure subscription to HKT CSP portal." },
      { id: 2, title: "Send Welcome Letter", description: "Send the Welcome Letter to the customer." },
    ],
  },
  GCP: {
    new: [
      { id: 1, title: "Obtain GCP Account", description: "Contact customer for existing GCP Account ID, or guide them to create one." },
      { id: 2, title: "Create Billing Subaccount", description: "Log into Google Cloud Console and create a New Billing Subaccount under the HKT organization." },
      { id: 3, title: "Input Details", description: "Create the customer, fill in organization details, and select available SKUs." },
      { id: 4, title: "Assign Administrator", description: "Enter customer's GCP email and set as \"Billing Account Administrator\"." },
      { id: 5, title: "Send Welcome Letter", description: "Send the Welcome Letter to the customer." },
    ],
  },
  Huawei: {
    new: [
      { id: 1, title: "Prepare URL", description: "Generate account registration URL from HKT Huawei Cloud Reseller Console." },
      { id: 2, title: "Send Link", description: "Email the registration link and account creation guide to the customer." },
      { id: 3, title: "Wait for Completion", description: "Wait for customer to notify you they have created the account." },
      { id: 4, title: "Unfreeze & Budget", description: "Log into portal, set customer's Monthly Budget, and unfreeze the account." },
      { id: 5, title: "Notify & Welcome", description: "Notify internal AM/ASM team and send the Welcome Letter to the customer." },
    ],
  },
  HuaweiHA: {
    new: [
      { id: 1, title: "Arrange Meeting", description: "Schedule and join a Zoom meeting with the HA customer." },
      { id: 2, title: "Live Registration", description: "Guide customer to verify email, set password, and bind phone via SMS live during meeting." },
      { id: 3, title: "Configure Account", description: "Enable association, change account name, and update tenant information." },
      { id: 4, title: "Disable Protection", description: "Disable \"Operation Protection\" in root account and pass meeting host to HA." },
      { id: 5, title: "Unfreeze & Notify", description: "After meeting: set Monthly Budget, unfreeze account, email MS Team to configure policies." },
    ],
  },
  AWS: {
    new: [
      { id: 1, title: "Create Account", description: "Access AWS website, input company/project name, verify root email address." },
      { id: 2, title: "Input Information", description: "Fill customer's contact and credit/debit card payment information." },
      { id: 3, title: "Verify Identity", description: "Complete security check via automated voice call or SMS verification." },
      { id: 4, title: "Select Plan", description: "Select \"Basic support - Free\" plan and complete sign-up." },
      { id: 5, title: "Retrieve ID", description: "Log in and retrieve AWS Account ID to share with HKT Multi-Cloud support team." },
    ],
  },
};

const PROVIDER_LABELS: Record<Provider, string> = {
  Alibaba: "Alibaba Cloud",
  Azure: "Microsoft Azure",
  GCP: "Google Cloud Platform",
  Huawei: "Huawei Cloud",
  HuaweiHA: "Huawei Cloud HA",
  AWS: "Amazon Web Services",
};

export interface ServiceTimelineProps {
  provider: Provider;
  flow: Flow;
  completedSteps?: OrderStep[];
  onCompleteStep?: (stepKey: string, stepLabel: string) => void;
  onUncompleteStep?: (stepKey: string) => void;
  onProgressChange?: (step: number, flow: Flow) => void;
  horizontal?: boolean;
}

function makeStepKey(flow: Flow, stepId: number): string {
  return `${flow}_${stepId}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function ServiceTimeline({
  provider,
  flow,
  completedSteps,
  onCompleteStep,
  onUncompleteStep,
  onProgressChange,
  horizontal = false,
}: ServiceTimelineProps): React.ReactElement {
  const flows = TIMELINE_DATA[provider];
  const hasMigration = Boolean(flows.migration);
  const resolvedFlow: Flow = flow === "migration" && !hasMigration ? "new" : flow;

  const [activeFlow, setActiveFlow] = useState<Flow>(resolvedFlow);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Build lookup: StepKey → OrderStep (for timestamp display)
  const completedMap = new Map<string, OrderStep>(
    (completedSteps ?? []).map((s) => [s.StepKey, s]),
  );

  const steps = activeFlow === "migration" && flows.migration ? flows.migration : flows.new;
  const totalSteps = steps.length;

  // Sync currentStep when completedSteps loads or activeFlow changes
  useEffect(() => {
    const first = steps.find((s) => !completedMap.has(makeStepKey(activeFlow, s.id)));
    setCurrentStep(first?.id ?? totalSteps + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedSteps, activeFlow]);

  function getStepState(stepId: number): StepState {
    if (completedMap.has(makeStepKey(activeFlow, stepId))) return "done";
    if (stepId === currentStep) return "active";
    return "upcoming";
  }

  const isAllDone = currentStep > totalSteps;
  const activeStep = steps.find((s) => s.id === currentStep) ?? null;

  function handleMarkDone(): void {
    if (activeStep) {
      onCompleteStep?.(makeStepKey(activeFlow, activeStep.id), activeStep.title);
    }
    const next = currentStep + 1;
    setCurrentStep(next);
    onProgressChange?.(next, activeFlow);
  }

  function handleFlowChange(f: Flow): void {
    setActiveFlow(f);
  }

  function handleReset(): void {
    setCurrentStep(1);
    onProgressChange?.(1, activeFlow);
  }

  /* ── Shared header ── */
  const header = (
    <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <CloudProviderLogo provider={PROVIDER_LABELS[provider]} size={20} showName={false} />
        <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#9f9b93" }}>
          {PROVIDER_LABELS[provider]}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {isAllDone && (
          <button onClick={handleReset} className="text-xs font-medium underline" style={{ color: "#9f9b93" }}>
            Reset
          </button>
        )}
        {hasMigration && (
          <div className="flex items-center rounded-full p-0.5 gap-0.5" style={{ border: "1px solid #dad4c8", background: "#faf9f7" }}>
            {(["new", "migration"] as Flow[]).map((f) => (
              <button
                key={f}
                onClick={() => handleFlowChange(f)}
                className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                style={
                  activeFlow === f
                    ? { background: "#ffffff", color: "#000", boxShadow: "rgba(0,0,0,0.1) 0px 1px 1px" }
                    : { color: "#9f9b93" }
                }
              >
                {f === "new" ? "New Account" : "Migration"}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  /* ── Horizontal layout ── */
  if (horizontal) {
    return (
      <div
        className="bg-white rounded-2xl p-5"
        style={{ border: "1px solid #dad4c8", boxShadow: "rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.04) 0px -1px 1px inset" }}
      >
        {header}

        {/* Progress bar */}
        <div className="mb-5">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#eee9df" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ background: "#078a52", width: `${Math.min(((currentStep - 1) / totalSteps) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Step circles row */}
        <div className="flex items-start">
          {steps.map((step, index) => {
            const state = getStepState(step.id);
            const isLast = index === steps.length - 1;
            const doneEntry = completedMap.get(makeStepKey(activeFlow, step.id));
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center" style={{ minWidth: 0, flex: 1 }}>
                  <button
                    onClick={() => state !== "active" && setCurrentStep(step.id)}
                    className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all duration-200 focus:outline-none"
                    style={
                      state === "done"
                        ? { background: "#078a52", border: "none", cursor: "pointer" }
                        : state === "active"
                        ? { background: "#000000", border: "none", cursor: "default", boxShadow: "0 0 0 3px #faf9f7, 0 0 0 5px #000" }
                        : { background: "#f5f3ef", border: "1.5px solid #dad4c8", cursor: "pointer" }
                    }
                  >
                    {state === "done" ? (
                      <Check size={14} color="#ffffff" strokeWidth={3} />
                    ) : (
                      <span className="text-xs font-semibold" style={{ color: state === "active" ? "#ffffff" : "#9f9b93" }}>
                        {step.id}
                      </span>
                    )}
                  </button>
                  <p
                    className="text-xs text-center mt-1.5 px-1 leading-tight"
                    style={{
                      fontWeight: state === "active" ? 700 : state === "done" ? 500 : 400,
                      color: state === "upcoming" ? "#c5bfb5" : "#000",
                      textDecoration: state === "done" ? "line-through" : "none",
                    }}
                  >
                    {step.title}
                  </p>
                  {state === "active" && (
                    <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 mt-1" style={{ background: "#f8cc65", color: "#000" }}>
                      In Progress
                    </span>
                  )}
                  {state === "done" && (
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                      <span className="text-[10px] font-medium rounded-full px-2 py-0.5" style={{ background: "#84e7a5", color: "#02492a" }}>
                        Done
                      </span>
                      {doneEntry && (
                        <span className="text-[9px]" style={{ color: "#9f9b93" }}>{formatDate(doneEntry.CompletedAt)}</span>
                      )}
                      {onUncompleteStep && (
                        <button
                          onClick={() => onUncompleteStep(makeStepKey(activeFlow, step.id))}
                          className="text-[9px] underline mt-0.5"
                          style={{ color: "#c5bfb5" }}
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {!isLast && (
                  <div
                    className="h-px mt-4 transition-all duration-500"
                    style={{ flex: 1, background: state === "done" ? "#84e7a5" : "#dad4c8", minWidth: "1rem" }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Active step description */}
        {!isAllDone && activeStep && (
          <div className="mt-4 rounded-xl px-4 py-3" style={{ background: "#faf9f7", border: "1.5px solid #000" }}>
            <p className="text-sm font-bold text-black mb-0.5">{activeStep.title}</p>
            <p className="text-xs leading-relaxed" style={{ color: "#55534e" }}>{activeStep.description}</p>
            <button
              onClick={handleMarkDone}
              className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "#078a52", color: "#ffffff", border: "none" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#02492a"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#078a52"; }}
            >
              <Check size={12} strokeWidth={3} />
              Mark as Done
            </button>
          </div>
        )}

        {/* All done banner */}
        {isAllDone && (
          <div className="mt-4 rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "#84e7a5", border: "1px solid #078a52" }}>
            <Check size={16} color="#02492a" strokeWidth={3} />
            <span className="text-sm font-semibold" style={{ color: "#02492a" }}>All steps completed — provisioning done!</span>
          </div>
        )}
      </div>
    );
  }

  /* ── Vertical layout (original) ── */
  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{
        border: "1px solid #dad4c8",
        boxShadow: "rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.04) 0px -1px 1px inset",
      }}
    >
      {header}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium" style={{ color: "#55534e" }}>
            {isAllDone ? "All steps completed" : `Step ${currentStep} of ${totalSteps}`}
          </span>
          {isAllDone && (
            <button onClick={handleReset} className="text-xs font-medium underline" style={{ color: "#9f9b93" }}>
              Reset
            </button>
          )}
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#eee9df" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ background: "#078a52", width: `${Math.min(((currentStep - 1) / totalSteps) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div>
        {steps.map((step, index) => {
          const state = getStepState(step.id);
          const isLast = index === steps.length - 1;
          const doneEntry = completedMap.get(makeStepKey(activeFlow, step.id));
          return (
            <div key={step.id} className="flex gap-3">
              <div className="flex flex-col items-center" style={{ width: 32 }}>
                <button
                  onClick={() => state !== "active" && setCurrentStep(step.id)}
                  className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all duration-200 focus:outline-none"
                  style={
                    state === "done"
                      ? { background: "#078a52", border: "none", cursor: "pointer" }
                      : state === "active"
                      ? { background: "#000000", border: "none", cursor: "default", boxShadow: "0 0 0 3px #faf9f7, 0 0 0 5px #000" }
                      : { background: "#f5f3ef", border: "1.5px solid #dad4c8", cursor: "pointer" }
                  }
                >
                  {state === "done" ? (
                    <Check size={14} color="#ffffff" strokeWidth={3} />
                  ) : (
                    <span className="text-xs font-semibold" style={{ color: state === "active" ? "#ffffff" : "#9f9b93" }}>
                      {step.id}
                    </span>
                  )}
                </button>
                {!isLast && (
                  <div
                    className="w-px flex-1 mt-1 transition-all duration-500"
                    style={{ background: state === "done" ? "#84e7a5" : "#dad4c8", minHeight: "1.5rem" }}
                  />
                )}
              </div>
              <div
                className="flex-1 rounded-xl px-3 py-2.5 mb-2 transition-all duration-200"
                style={
                  state === "active"
                    ? { background: "#faf9f7", border: "1.5px solid #000", marginBottom: "0.5rem" }
                    : { background: "transparent", border: "1.5px solid transparent", marginBottom: "0.5rem" }
                }
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className="text-sm leading-snug"
                    style={{
                      fontWeight: state === "active" ? 700 : state === "done" ? 500 : 400,
                      color: state === "upcoming" ? "#9f9b93" : "#000000",
                      textDecoration: state === "done" ? "line-through" : "none",
                    }}
                  >
                    {step.title}
                  </p>
                  {state === "active" && (
                    <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ background: "#f8cc65", color: "#000" }}>
                      In Progress
                    </span>
                  )}
                  {state === "done" && (
                    <span className="text-xs font-medium rounded-full px-2 py-0.5" style={{ background: "#84e7a5", color: "#02492a" }}>
                      Done
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: state === "upcoming" ? "#dad4c8" : "#55534e" }}>
                  {step.description}
                </p>
                {state === "done" && doneEntry && (
                  <p className="text-[10px] mt-1" style={{ color: "#9f9b93" }}>
                    Completed {formatDate(doneEntry.CompletedAt)} by {doneEntry.CompletedBy}
                  </p>
                )}
                {state === "done" && onUncompleteStep && (
                  <button
                    onClick={() => onUncompleteStep(makeStepKey(activeFlow, step.id))}
                    className="text-[10px] underline mt-0.5"
                    style={{ color: "#c5bfb5" }}
                  >
                    Undo
                  </button>
                )}
                {state === "active" && !isAllDone && (
                  <button
                    onClick={handleMarkDone}
                    className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: "#078a52", color: "#ffffff", border: "none" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#02492a"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#078a52"; }}
                  >
                    <Check size={12} strokeWidth={3} />
                    Mark as Done
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* All done banner */}
      {isAllDone && (
        <div className="mt-2 rounded-xl px-4 py-3 flex items-center gap-2" style={{ background: "#84e7a5", border: "1px solid #078a52" }}>
          <Check size={16} color="#02492a" strokeWidth={3} />
          <span className="text-sm font-semibold" style={{ color: "#02492a" }}>All steps completed — provisioning done!</span>
        </div>
      )}
    </div>
  );
}
