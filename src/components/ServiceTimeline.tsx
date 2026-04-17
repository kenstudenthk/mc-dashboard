import React, { useState } from "react";

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

const TIMELINE_DATA: Record<Provider, TimelineFlows> = {
  Alibaba: {
    new: [
      {
        id: 1,
        title: "Submit Information",
        description:
          "Enter the customer's details into the Alibaba Channel Platform.",
      },
      {
        id: 2,
        title: "Send Invitation",
        description:
          "Initiate and send the account registration invitation email to the customer.",
      },
      {
        id: 3,
        title: "Customer Registration",
        description:
          "Wait for customer to accept invitation and complete registration (status: Lead → Official).",
      },
      {
        id: 4,
        title: "Send Welcome Letter",
        description:
          "Once account is registered and order is issued, send the Welcome Letter.",
      },
    ],
    migration: [
      {
        id: 1,
        title: "Send Migration Request",
        description:
          "Email B&Data with order form to request migrating the customer's existing Alibaba account to HKT master account.",
      },
      {
        id: 2,
        title: "Wait for Confirmation",
        description:
          "Receive email confirmation from B&Data that migration is successful.",
      },
      {
        id: 3,
        title: "Send Welcome Letter",
        description: "Send the Welcome Letter to the customer.",
      },
    ],
  },
  Azure: {
    new: [
      {
        id: 1,
        title: "Create Customer",
        description:
          "Enter customer information into the Microsoft 365 CSP Portal.",
      },
      {
        id: 2,
        title: "Add Azure Plan",
        description:
          "Create a new subscription and add the Azure Plan to the cart.",
      },
      {
        id: 3,
        title: "Request Permissions",
        description:
          "Send GDAP request to the customer and wait for acceptance.",
      },
      {
        id: 4,
        title: "Assign Roles",
        description:
          "Assign CSP security group and configure Owner roles in Azure Management Portal.",
      },
      {
        id: 5,
        title: "Send Welcome Letter",
        description:
          "Send login credentials and Welcome Letter to the customer.",
      },
    ],
    migration: [
      {
        id: 1,
        title: "Transfer Subscription",
        description:
          "Handle migration to transfer M365 tenant and Azure subscription to HKT CSP portal.",
      },
      {
        id: 2,
        title: "Send Welcome Letter",
        description: "Send the Welcome Letter to the customer.",
      },
    ],
  },
  GCP: {
    new: [
      {
        id: 1,
        title: "Obtain GCP Account",
        description:
          "Contact customer for existing GCP Account ID, or guide them to create one.",
      },
      {
        id: 2,
        title: "Create Billing Subaccount",
        description:
          "Log into Google Cloud Console and create a New Billing Subaccount under the HKT organization.",
      },
      {
        id: 3,
        title: "Input Details",
        description:
          "Create the customer, fill in organization details, and select available SKUs.",
      },
      {
        id: 4,
        title: "Assign Administrator",
        description:
          'Enter customer\'s GCP email and set as "Billing Account Administrator".',
      },
      {
        id: 5,
        title: "Send Welcome Letter",
        description: "Send the Welcome Letter to the customer.",
      },
    ],
  },
  Huawei: {
    new: [
      {
        id: 1,
        title: "Prepare URL",
        description:
          "Generate account registration URL from HKT Huawei Cloud Reseller Console.",
      },
      {
        id: 2,
        title: "Send Link",
        description:
          "Email the registration link and account creation guide to the customer.",
      },
      {
        id: 3,
        title: "Wait for Completion",
        description:
          "Wait for customer to notify you they have created the account.",
      },
      {
        id: 4,
        title: "Unfreeze & Budget",
        description:
          "Log into portal, set customer's Monthly Budget, and unfreeze the account.",
      },
      {
        id: 5,
        title: "Notify & Welcome",
        description:
          "Notify internal AM/ASM team and send the Welcome Letter to the customer.",
      },
    ],
  },
  HuaweiHA: {
    new: [
      {
        id: 1,
        title: "Arrange Meeting",
        description: "Schedule and join a Zoom meeting with the HA customer.",
      },
      {
        id: 2,
        title: "Live Registration",
        description:
          "Guide customer to verify email, set password, and bind phone via SMS live during meeting.",
      },
      {
        id: 3,
        title: "Configure Account",
        description:
          "Enable association, change account name, and update tenant information.",
      },
      {
        id: 4,
        title: "Disable Protection",
        description:
          'Disable "Operation Protection" in root account and pass meeting host to HA.',
      },
      {
        id: 5,
        title: "Unfreeze & Notify",
        description:
          "After meeting: set Monthly Budget, unfreeze account, email MS Team to configure policies.",
      },
    ],
  },
  AWS: {
    new: [
      {
        id: 1,
        title: "Create Account",
        description:
          "Access AWS website, input company/project name, verify root email address.",
      },
      {
        id: 2,
        title: "Input Information",
        description:
          "Fill customer's contact and credit/debit card payment information.",
      },
      {
        id: 3,
        title: "Verify Identity",
        description:
          "Complete security check via automated voice call or SMS verification.",
      },
      {
        id: 4,
        title: "Select Plan",
        description: 'Select "Basic support - Free" plan and complete sign-up.',
      },
      {
        id: 5,
        title: "Retrieve ID",
        description:
          "Log in and retrieve AWS Account ID to share with HKT Multi-Cloud support team.",
      },
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

function renderStep(step: TimelineStep, isLast: boolean): React.ReactNode {
  return (
    <div key={step.id} className="flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-xs font-semibold"
          style={{
            background: "#f5f3ef",
            border: "1.5px solid #dad4c8",
            color: "#55534e",
          }}
        >
          {step.id}
        </div>
        {!isLast && (
          <div
            className="w-px flex-1 mt-1"
            style={{ background: "#dad4c8", minHeight: "1.5rem" }}
          />
        )}
      </div>
      <div className={isLast ? "pb-0" : "pb-5"}>
        <p className="font-medium text-sm text-black leading-snug">
          {step.title}
        </p>
        <p className="text-sm mt-0.5" style={{ color: "#55534e" }}>
          {step.description}
        </p>
      </div>
    </div>
  );
}

export interface ServiceTimelineProps {
  provider: Provider;
  flow: Flow;
}

export default function ServiceTimeline({
  provider,
  flow,
}: ServiceTimelineProps) {
  const flows = TIMELINE_DATA[provider];
  const hasMigration = Boolean(flows.migration);
  const resolvedFlow: Flow =
    flow === "migration" && !hasMigration ? "new" : flow;
  const [activeFlow, setActiveFlow] = useState<Flow>(resolvedFlow);

  const steps =
    activeFlow === "migration" && flows.migration ? flows.migration : flows.new;

  return (
    <div
      className="bg-white rounded-2xl p-5"
      style={{
        border: "1px solid #dad4c8",
        boxShadow:
          "rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.04) 0px -1px 1px inset",
      }}
    >
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#9f9b93" }}
        >
          {PROVIDER_LABELS[provider]}
        </span>
        {hasMigration && (
          <div
            className="flex items-center rounded-full p-0.5 gap-0.5"
            style={{ border: "1px solid #dad4c8", background: "#faf9f7" }}
          >
            {(["new", "migration"] as Flow[]).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFlow(f)}
                className="rounded-full px-3 py-1 text-xs font-semibold transition-all"
                style={
                  activeFlow === f
                    ? {
                        background: "#ffffff",
                        color: "#000",
                        boxShadow:
                          "rgba(0,0,0,0.1) 0px 1px 1px, rgba(0,0,0,0.04) 0px -1px 1px inset",
                      }
                    : { color: "#9f9b93" }
                }
              >
                {f === "new" ? "New Account" : "Migration"}
              </button>
            ))}
          </div>
        )}
      </div>
      <div>
        {steps.map((step, index) =>
          renderStep(step, index === steps.length - 1),
        )}
      </div>
    </div>
  );
}
