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
exports.FinalReminderEmail = void 0;
const React = __importStar(require("react"));
const components_1 = require("@react-email/components");
const FinalReminderEmail = ({ name, businessType = "wellness business", dashboardLink = "https://free.consciouscounsel.ca/wellness/dashboard", calendlyLink = "https://calendly.com/chad-consciouscounsel/connection-call-with-chad", }) => {
    return (React.createElement(components_1.Html, null,
        React.createElement(components_1.Head, null),
        React.createElement(components_1.Preview, null, "Last chance: Free consultation expires in 48 hours"),
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
                    React.createElement(components_1.Heading, { className: "text-black text-[22px] font-bold text-center p-0 my-[30px] mx-0" }, "\u23F0 Last Chance: Free Consultation Expires Soon"),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "Hi ",
                        name || 'there',
                        ","),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "I wanted to reach out one more time because your ",
                        React.createElement("strong", null, "free legal consultation offer expires in 48 hours"),
                        "."),
                    React.createElement(components_1.Section, { style: {
                            backgroundColor: '#fef2f2',
                            borderRadius: '12px',
                            padding: '24px',
                            margin: '24px 0',
                            border: '2px solid #dc2626',
                            textAlign: 'center',
                        } },
                        React.createElement(components_1.Text, { style: { fontSize: '32px', fontWeight: 'bold', color: '#dc2626', margin: '0 0 8px 0' } }, "48 Hours Left"),
                        React.createElement(components_1.Text, { style: { fontSize: '14px', color: '#991b1b', margin: '0' } }, "Your free consultation offer expires soon")),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "I know you're busy running your business, but I don't want you to miss out on this opportunity to get personalized legal protection\u2014completely free."),
                    React.createElement(components_1.Section, { className: "bg-emerald-50 rounded-lg p-[20px] my-[24px]" },
                        React.createElement(components_1.Text, { className: "text-black text-[14px] font-bold mb-[12px]" }, "\uD83C\uDF81 What You Get (Free):"),
                        React.createElement("ul", { style: { margin: '0', paddingLeft: '20px' } },
                            React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "15-30 minute consultation"),
                                " with a legal expert"),
                            React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "Personalized risk assessment"),
                                " for your business"),
                            React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "Custom document recommendations"),
                                " based on your business"),
                            React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "Free legal document templates"),
                                " to get started immediately"),
                            React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "No obligation"),
                                "\u2014just honest advice"))),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        React.createElement("strong", null, "After 48 hours, this offer expires."),
                        " Regular consultations cost $200, but you can book yours for free right now."),
                    React.createElement(components_1.Section, { className: "bg-gray-50 rounded-lg p-[20px] my-[24px]" },
                        React.createElement(components_1.Text, { className: "text-black text-[14px] font-bold mb-[8px]" }, "\u26A1 Why book now?"),
                        React.createElement("ul", { style: { margin: '0', paddingLeft: '20px' } },
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } },
                                React.createElement("strong", null, "Free consultation"),
                                " (normally $200)"),
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } },
                                React.createElement("strong", null, "Limited spots available"),
                                " this week"),
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } },
                                React.createElement("strong", null, "Get protected before something goes wrong")),
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } },
                                React.createElement("strong", null, "No obligation"),
                                "\u2014just get expert advice"))),
                    React.createElement(components_1.Section, { className: "text-center mt-[32px] mb-[32px]" },
                        React.createElement(components_1.Button, { className: "bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3", href: calendlyLink }, "Book My Free Consultation Now"),
                        React.createElement(components_1.Text, { className: "text-[#666666] text-[12px] leading-[20px] mt-[12px]" },
                            "Or ",
                            React.createElement(components_1.Link, { href: dashboardLink, className: "text-teal-600 no-underline" }, "access your dashboard"),
                            " to get started on your own")),
                    React.createElement(components_1.Section, { className: "bg-red-50 rounded-lg p-[20px] my-[24px] border-l-4", style: { borderLeftColor: '#dc2626' } },
                        React.createElement(components_1.Text, { className: "text-black text-[13px] leading-[20px]" },
                            React.createElement("strong", null, "\u26A0\uFE0F Don't wait until it's too late."),
                            " Every day you delay is another day your business is exposed to legal risks. Get protected today\u2014it's free and takes just 15 minutes.")),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "I'd love to help you protect your business. Book your free consultation before the offer expires."),
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
exports.FinalReminderEmail = FinalReminderEmail;
exports.default = exports.FinalReminderEmail;
