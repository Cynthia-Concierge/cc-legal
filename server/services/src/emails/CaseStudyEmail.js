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
exports.CaseStudyEmail = void 0;
const React = __importStar(require("react"));
const components_1 = require("@react-email/components");
const CaseStudyEmail = ({ name, businessType = "wellness business", dashboardLink = "https://free.consciouscounsel.ca/wellness/dashboard", calendlyLink = "https://calendly.com/chad-consciouscounsel/connection-call-with-chad", }) => {
    // Extract first name from full name if available
    const getFirstName = () => {
        if (!name)
            return 'there';
        const firstName = name.trim().split(' ')[0];
        return firstName || 'there';
    };
    const firstName = getFirstName();
    return (React.createElement(components_1.Html, null,
        React.createElement(components_1.Head, null),
        React.createElement(components_1.Preview, null,
            "How a ",
            businessType,
            " avoided a $50K lawsuit with proper legal protection"),
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
                    React.createElement(components_1.Heading, { className: "text-black text-[22px] font-bold text-center p-0 my-[30px] mx-0" },
                        "\uD83D\uDCA1 How a ",
                        businessType,
                        " avoided a $50K lawsuit"),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "Hi ",
                        firstName,
                        ","),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "Last year, a yoga studio owner almost lost her business over a single class."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "A client claimed they were injured, threatened to sue for $75,000, and told her to \"expect papers.\" Overnight, she went from running classes to wondering if she'd have to shut everything down."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "What saved her wasn't luck."),
                    React.createElement(components_1.Section, { style: {
                            backgroundColor: '#f0fdfa',
                            borderRadius: '12px',
                            padding: '24px',
                            margin: '24px 0',
                            border: '2px solid #0d9488',
                        } },
                        React.createElement(components_1.Text, { style: { fontSize: '16px', fontWeight: 'bold', color: '#0d9488', margin: '0 0 16px 0' } }, "\uD83D\uDEE1\uFE0F What Saved Her"),
                        React.createElement("ul", { style: { margin: '0', paddingLeft: '20px' } },
                            React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                "She had a ",
                                React.createElement("strong", null, "real liability waiver"),
                                " written for her business."),
                            React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                "Her ",
                                React.createElement("strong", null, "agreements clearly outlined the risks"),
                                "."),
                            React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                "And her ",
                                React.createElement("strong", null, "insurance actually matched what she was doing"),
                                "."))),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "Her lawyer reviewed everything \u2014 and the case was dropped."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "She paid $0 in legal fees or settlements."),
                    React.createElement(components_1.Section, { className: "bg-red-50 rounded-lg p-[20px] my-[24px] border-l-4", style: { borderLeftColor: '#dc2626' } },
                        React.createElement(components_1.Text, { className: "text-black text-[14px] font-bold mb-[8px]" }, "\u26A0\uFE0F Without Those Documents"),
                        React.createElement(components_1.Text, { className: "text-black text-[13px] leading-[20px]" }, "Without those documents, her attorney told her she would've been looking at:"),
                        React.createElement("ul", { style: { margin: '12px 0 0 0', paddingLeft: '20px' } },
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } }, "$50,000\u2013$150,000 in legal costs"),
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } }, "Months of stress"),
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } }, "A very real risk of closing her studio"))),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "Most wellness owners think their waivers and contracts are \"good enough.\""),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "That's exactly what she thought too."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "If you run a ",
                        businessType,
                        ", you likely have the same exposure \u2014 you just don't know it yet."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "That's why we offer a free legal protection review for wellness businesses. On a short call, we'll walk through what you're doing, identify gaps, and tell you exactly what needs to be fixed (and what doesn't)."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "No pressure. No obligation. Just clarity."),
                    React.createElement(components_1.Section, { className: "text-center mt-[32px] mb-[32px]" },
                        React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px] mb-[16px]" }, "\uD83D\uDC49 Book your free legal protection review here:"),
                        React.createElement(components_1.Button, { className: "bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3", href: calendlyLink }, "Book Free Legal Protection Review")),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px] mt-[24px]" }, "Talk soon,"),
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
exports.CaseStudyEmail = CaseStudyEmail;
exports.default = exports.CaseStudyEmail;
