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
exports.WebsiteScanReminderEmail = void 0;
const React = __importStar(require("react"));
const components_1 = require("@react-email/components");
const WebsiteScanReminderEmail = ({ name, scanLink = "https://free.consciouscounsel.ca/wellness/dashboard", }) => {
    return (React.createElement(components_1.Html, null,
        React.createElement(components_1.Head, null),
        React.createElement(components_1.Preview, null, "Found something on your website..."),
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
                    React.createElement(components_1.Heading, { className: "text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0" }, "Found something on your website..."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "Hi ",
                        name || 'there',
                        ","),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "Great news\u2014your business profile is complete! Now it's time for the next step: scanning your website to identify any legal gaps or compliance issues."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        React.createElement("strong", null, "What we'll check:")),
                    React.createElement(components_1.Section, { className: "my-[24px]" },
                        React.createElement("ul", { style: { margin: 0, paddingLeft: '20px' } },
                            React.createElement("li", { style: { marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "Missing legal documents"),
                                " \u2013 Privacy policies, terms of service, disclaimers, and more"),
                            React.createElement("li", { style: { marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "Compliance gaps"),
                                " \u2013 Issues with existing policies or missing required clauses"),
                            React.createElement("li", { style: { marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "Legal risks"),
                                " \u2013 Marketing claims, testimonial usage, and other potential liabilities"),
                            React.createElement("li", { style: { marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "Actionable recommendations"),
                                " \u2013 Clear next steps to protect your business"))),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "The scan takes about 2 minutes and shows you exactly what's missing or needs attention on your website. No guesswork\u2014just clear, actionable insights."),
                    React.createElement(components_1.Section, { className: "text-center mt-[32px] mb-[32px]" },
                        React.createElement(components_1.Button, { className: "bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3", href: scanLink }, "Scan My Website")),
                    React.createElement(components_1.Section, { className: "bg-gray-50 rounded-lg p-[20px] my-[24px]" },
                        React.createElement(components_1.Text, { className: "text-black text-[14px] font-semibold mb-[12px]" }, "\uD83D\uDCA1 Quick tip:"),
                        React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "After the scan, you'll get a detailed report showing exactly what legal documents you need. We'll even help you generate them personalized for your business.")),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "If you have any questions, ",
                        React.createElement(components_1.Link, { href: "https://calendly.com/chad-consciouscounsel/connection-call-with-chad", className: "text-teal-600 no-underline" }, "speak to us"),
                        ". We're here to help."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px] mt-[24px]" }, "Best,"),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px] font-bold mt-[8px]" }, "The Conscious Counsel Team"),
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
exports.WebsiteScanReminderEmail = WebsiteScanReminderEmail;
exports.default = exports.WebsiteScanReminderEmail;
