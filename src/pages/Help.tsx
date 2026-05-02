import React from "react";
import { HelpCircle, Mail, MessageSquare, Phone, ChevronRight } from "lucide-react";

const Help = () => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Page header */}
      <div>
        <h1
          className="text-[28px] font-semibold text-[#1d1d1f]"
          style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
        >
          Help & Support
        </h1>
        <p
          className="text-sm text-[#1d1d1f]/50 mt-1"
          style={{ letterSpacing: "-0.224px" }}
        >
          How can we help you today?
        </p>
      </div>

      {/* Contact channels */}
      <TutorTooltip
        text="Choose your preferred channel to contact our support team. We're here to help with any technical or administrative issues."
        position="bottom"
        componentName="Help.ContactChannels"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Mail,
              label: "Email Support",
              desc: "Get help via email within 24 hours.",
              detail: "support@pccw.com",
            },
            {
              icon: MessageSquare,
              label: "Live Chat",
              desc: "Chat with our support team in real-time.",
              detail: "Available 9am – 6pm",
            },
            {
              icon: Phone,
              label: "Phone Support",
              desc: "Call us directly for urgent issues.",
              detail: "+852 1000 0000",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="card p-6 flex flex-col gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#f5f5f7] flex items-center justify-center text-[#0071e3] group-hover:bg-[#0071e3] group-hover:text-white transition-colors">
                <item.icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3
                  className="text-[14px] font-semibold text-[#1d1d1f]"
                  style={{ letterSpacing: "-0.224px" }}
                >
                  {item.label}
                </h3>
                <p
                  className="text-[12px] text-[#1d1d1f]/45 mt-0.5"
                  style={{ letterSpacing: "-0.12px" }}
                >
                  {item.desc}
                </p>
              </div>
              <span
                className="text-[12px] font-medium text-[#0071e3]"
                style={{ letterSpacing: "-0.12px" }}
              >
                {item.detail}
              </span>
            </div>
          ))}
        </div>
      </TutorTooltip>

      {/* FAQ */}
      <TutorTooltip
        text="Find quick answers to common questions about order creation, exports, and account management."
        position="top"
        componentName="Help.FAQ"
      >
        <div className="card p-7">
          <h2
            className="text-[17px] font-semibold text-[#1d1d1f] border-b border-[#1d1d1f]/06 pb-4 mb-2"
            style={{ letterSpacing: "-0.374px" }}
          >
            Frequently Asked Questions
          </h2>
          <div className="divide-y divide-[#1d1d1f]/06">
            {[
              {
                q: "How do I create a new order?",
                a: 'Navigate to the Order Registry and click the "New Order" button in the top right corner.',
              },
              {
                q: "Can I export my customer list?",
                a: "Yes, you can export your customer list by clicking the download icon on the Customers page.",
              },
              {
                q: "How do I change my password?",
                a: 'Go to Settings > Profile Settings and click on "Change Password".',
              },
              {
                q: "How are roles assigned?",
                a: "Roles are managed by a Global Admin in Settings > Role Management. Contact your admin to update your access level.",
              },
              {
                q: "What does pre-provision order mean?",
                a: 'A pre-provision order is a cloud account created in advance without an official Service No. It is displayed as "TBC" until a service number is assigned.',
              },
            ].map((faq, i) => (
              <div key={i} className="py-4 flex items-start gap-3 group cursor-pointer">
                <HelpCircle className="w-4 h-4 text-[#0071e3] mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-[14px] font-medium text-[#1d1d1f] group-hover:text-[#0071e3] transition-colors"
                    style={{ letterSpacing: "-0.224px" }}
                  >
                    {faq.q}
                  </h4>
                  <p
                    className="text-[13px] text-[#1d1d1f]/45 mt-1 leading-relaxed"
                    style={{ letterSpacing: "-0.12px" }}
                  >
                    {faq.a}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#1d1d1f]/20 mt-0.5 shrink-0 group-hover:text-[#0071e3] transition-colors" />
              </div>
            ))}
          </div>
        </div>
      </TutorTooltip>
    </div>
  );
};

export default Help;
