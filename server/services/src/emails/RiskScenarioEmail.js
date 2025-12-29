"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RiskScenarioEmail = void 0;
const React = __importStar(require("react"));
const components_1 = require("@react-email/components");
const RiskScenarioEmail = ({ name, businessType = "wellness business", hasPhysicalMovement = false, hostsRetreats = false, hiresStaff = false, collectsOnline = false, dashboardLink = "https://free.consciouscounsel.ca/wellness/dashboard", calendlyLink = "https://calendly.com/chad-consciouscounsel/connection-call-with-chad", }) => {
    // Extract first name from full name if available
    const getFirstName = () => {
        if (!name)
            return 'there';
        const firstName = name.trim().split(' ')[0];
        return firstName || 'there';
    };
    const firstName = getFirstName();
    // Select relevant scenario based on business type
    const getScenario = () => {
        if (hostsRetreats) {
            return {
                title: "What happens if a client gets injured at your retreat?",
                scenario: `Imagine you're hosting a wellness retreat in Costa Rica. During a morning yoga session, a participant slips on a wet mat and breaks their wrist. They're upset, in pain, and now they're threatening to sue you for medical expenses, lost wages, and "emotional distress."`,
                costs: [
                    "Medical expenses: $15,000-$30,000",
                    "Legal fees to defend yourself: $50,000-$100,000",
                    "Potential settlement: $25,000-$75,000",
                    "Travel insurance may not cover it if you don't have proper waivers",
                ],
                protection: [
                    "A proper liability waiver signed before the retreat",
                    "Terms of service that clearly outline risks",
                    "Travel insurance verification",
                    "Emergency contact forms",
                ],
            };
        }
        if (hasPhysicalMovement) {
            return {
                title: "What happens if a client gets injured during class?",
                scenario: `A client at your business claims they were injured during a session. They say you didn't warn them about the risks, and now they're demanding compensation for medical bills, lost income, and pain and suffering.`,
                costs: [
                    "Medical expenses: $10,000-$50,000",
                    "Legal defense costs: $40,000-$120,000",
                    "Potential settlement: $20,000-$100,000",
                    "Business interruption and reputation damage",
                ],
                protection: [
                    "A liability waiver signed before each session",
                    "Clear terms of service outlining risks",
                    "Proper insurance coverage",
                    "Incident documentation procedures",
                ],
            };
        }
        if (collectsOnline) {
            return {
                title: "What happens if a client disputes a charge?",
                scenario: `A client books an online course through your business, completes it, then disputes the charge with their credit card company. They claim the course wasn't as described, and now you're facing a chargeback plus potential legal action.`,
                costs: [
                    "Chargeback fees: $25-$100 per dispute",
                    "Lost revenue from refunded course",
                    "Legal fees if they escalate: $5,000-$25,000",
                    "Damage to your payment processor relationship",
                ],
                protection: [
                    "Clear terms of service and refund policy",
                    "Detailed course descriptions",
                    "Purchase agreements",
                    "Privacy policy for data collection",
                ],
            };
        }
        // Default scenario
        return {
            title: "What happens if something goes wrong?",
            scenario: `Imagine a situation where a client is unhappy with your services. They feel they didn't get what they paid for, or something didn't go as expected. Without proper legal protection, you could be vulnerable.`,
            costs: [
                "Legal fees: $5,000-$50,000",
                "Potential settlements or refunds",
                "Time and stress dealing with disputes",
                "Damage to your business reputation",
            ],
            protection: [
                "Clear terms of service",
                "Proper contracts and agreements",
                "Privacy policy (if you collect data)",
                "Refund and cancellation policies",
            ],
        };
    };
    const scenario = getScenario();
    return (React.createElement(components_1.Html, null,
        React.createElement(components_1.Head, null),
        React.createElement(components_1.Preview, null, scenario.title),
        React.createElement(components_1.Tailwind, { config: {
                theme: {
                    extend: {
                        colors: {
                            teal: {
                                500: "#14b8a6",
                                600: "#0d9488",
                            },
                        },
                    },
                },
            } },
            React.createElement(components_1.Body, { className: "bg-gray-100 my-auto mx-auto font-sans" },
                React.createElement(components_1.Container, { className: "border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[600px] bg-white" },
                    React.createElement(components_1.Section, { className: "mt-[32px]" },
                        React.createElement(components_1.Text, { className: "text-black text-[24px] font-bold text-center p-0 my-0 mx-auto" }, "Conscious Counsel")),
                    React.createElement(components_1.Heading, { className: "text-black text-[22px] font-bold p-0 my-[30px] mx-0" }, scenario.title),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "Hi ",
                        firstName,
                        ","),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "I want to share a scenario that could happen to any ",
                        businessType,
                        " owner\u2014including you."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px] mt-[24px]" }, scenario.scenario),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] font-bold mt-[24px] mb-[12px]" }, "What this could cost you:"),
                    React.createElement("ul", { style: { margin: '0 0 16px 0', paddingLeft: '20px' } }, scenario.costs.map((cost, index) => (React.createElement("li", { key: index, style: { marginBottom: '6px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } }, cost)))),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px] mb-[24px]" },
                        React.createElement("strong", null, "Total potential cost:"),
                        " $50,000\u2013$200,000+ (even if you're not at fault)"),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] font-bold mt-[24px] mb-[12px]" }, "How to protect yourself:"),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px] mb-[12px]" }, "With the right legal documents, you can:"),
                    React.createElement("ul", { style: { margin: '0 0 16px 0', paddingLeft: '20px' } }, scenario.protection.map((item, index) => (React.createElement("li", { key: index, style: { marginBottom: '6px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } }, item)))),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px] mb-[24px]" },
                        React.createElement("strong", { style: { color: '#059669' } }, "Cost to get protected: $0"),
                        " (we provide free templates)"),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "The scary part? This scenario happens to wellness businesses every single day. The good news? It's completely preventable with proper legal protection."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "Don't wait until something goes wrong. Get protected now\u2014before you need it."),
                    React.createElement(components_1.Section, { className: "text-center mt-[32px] mb-[32px]" },
                        React.createElement(components_1.Button, { className: "bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3", href: dashboardLink }, "Get My Free Legal Protection"),
                        React.createElement(components_1.Text, { className: "text-[#666666] text-[12px] leading-[20px] mt-[12px]" },
                            "Or ",
                            React.createElement(components_1.Link, { href: calendlyLink, className: "text-teal-600 no-underline" }, "book a free call"),
                            " to discuss your specific risks")),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px] mt-[24px]" }, "The scary part? This scenario happens to wellness businesses every single day. The good news? It's completely preventable with proper legal protection."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "Don't wait until something goes wrong. Get protected now\u2014before you need it."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px] mt-[24px]" }, "I'm here to help you protect your business. Let's make sure you're covered."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px] mt-[24px]" }, "Best,"),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px] font-bold mt-[8px]" },
                        "Chad",
                        React.createElement("br", null),
                        "Conscious Counsel"),
                    React.createElement(components_1.Hr, { className: "border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" }),
                    React.createElement(components_1.Section, { className: "text-center" },
                        React.createElement(components_1.Text, { className: "text-[#666666] text-[12px] leading-[24px] mb-[8px]" },
                            "Need help? Email us at",
                            " ",
                            React.createElement(components_1.Link, { href: "mailto:chad@consciouscounsel.ca", className: "text-teal-600 no-underline" }, "chad@consciouscounsel.ca")),
                        React.createElement(components_1.Text, { className: "text-[#666666] text-[12px] leading-[24px]" },
                            "\u00A9 ",
                            new Date().getFullYear(),
                            " Conscious Counsel. All rights reserved.")))))));
};
exports.RiskScenarioEmail = RiskScenarioEmail;
exports.default = exports.RiskScenarioEmail;
