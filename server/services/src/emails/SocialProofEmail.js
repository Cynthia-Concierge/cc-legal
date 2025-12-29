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
exports.SocialProofEmail = void 0;
const React = __importStar(require("react"));
const components_1 = require("@react-email/components");
const SocialProofEmail = ({ name, businessType = "wellness business", totalProtected = 1247, recentSignups = 34, dashboardLink = "https://free.consciouscounsel.ca/wellness/dashboard", calendlyLink = "https://calendly.com/chad-consciouscounsel/connection-call-with-chad", }) => {
    return (React.createElement(components_1.Html, null,
        React.createElement(components_1.Head, null),
        React.createElement(components_1.Preview, null,
            totalProtected,
            "+ wellness businesses trust Conscious Counsel for legal protection"),
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
                        "\uD83C\uDF89 Join ",
                        totalProtected,
                        "+ Protected Wellness Businesses"),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "Hi ",
                        name || 'there',
                        ","),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "I wanted to share something exciting with you: ",
                        React.createElement("strong", null,
                            totalProtected,
                            " wellness businesses"),
                        " have chosen Conscious Counsel to protect their businesses."),
                    React.createElement(components_1.Section, { style: {
                            backgroundColor: '#f0fdfa',
                            borderRadius: '12px',
                            padding: '24px',
                            margin: '24px 0',
                            border: '2px solid #0d9488',
                            textAlign: 'center',
                        } },
                        React.createElement(components_1.Text, { style: { fontSize: '48px', fontWeight: 'bold', color: '#0d9488', margin: '0', lineHeight: '1' } }, totalProtected),
                        React.createElement(components_1.Text, { style: { fontSize: '16px', fontWeight: 'bold', color: '#0d9488', margin: '12px 0 0 0' } }, "Wellness Businesses Protected"),
                        React.createElement(components_1.Text, { style: { fontSize: '14px', color: '#059669', margin: '16px 0 0 0', fontWeight: '600' } },
                            "+",
                            recentSignups,
                            " joined this week")),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "These aren't just numbers\u2014they're real yoga studios, retreat leaders, coaches, and wellness professionals who decided to protect their businesses from legal risks."),
                    React.createElement(components_1.Section, { className: "bg-gray-50 rounded-lg p-[20px] my-[24px]" },
                        React.createElement(components_1.Text, { className: "text-black text-[14px] font-bold mb-[12px]" }, "\uD83D\uDC65 Who's Using Conscious Counsel:"),
                        React.createElement("ul", { style: { margin: '0', paddingLeft: '20px' } },
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } },
                                React.createElement("strong", null, "127 yoga studios"),
                                " protecting their classes and retreats"),
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } },
                                React.createElement("strong", null, "89 retreat leaders"),
                                " covering international events"),
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } },
                                React.createElement("strong", null, "203 coaches"),
                                " protecting their online programs"),
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } },
                                React.createElement("strong", null, "156 gyms and fitness studios"),
                                " covering physical activities"),
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } },
                                React.createElement("strong", null, "And hundreds more"),
                                " wellness businesses just like yours"))),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "They all have one thing in common: ",
                        React.createElement("strong", null, "they decided not to wait until something went wrong.")),
                    React.createElement(components_1.Section, { className: "bg-emerald-50 rounded-lg p-[20px] my-[24px]" },
                        React.createElement(components_1.Text, { className: "text-black text-[13px] leading-[20px] italic mb-[12px]" },
                            React.createElement("strong", null, "\"I almost didn't get the documents because I thought I didn't need them. Thank goodness I did\u2014they literally saved my business when a client threatened to sue.\"")),
                        React.createElement(components_1.Text, { className: "text-black text-[12px] leading-[18px]", style: { color: '#059669' } }, "\u2014 Sarah, Yoga Studio Owner")),
                    React.createElement(components_1.Section, { className: "bg-emerald-50 rounded-lg p-[20px] my-[24px]" },
                        React.createElement(components_1.Text, { className: "text-black text-[13px] leading-[20px] italic mb-[12px]" },
                            React.createElement("strong", null, "\"The peace of mind is worth everything. I know my retreat business is protected, and I can focus on creating amazing experiences for my clients.\"")),
                        React.createElement(components_1.Text, { className: "text-black text-[12px] leading-[18px]", style: { color: '#059669' } }, "\u2014 Maria, Retreat Leader")),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "Your business deserves the same protection. Join the ",
                        totalProtected,
                        "+ wellness businesses who chose legal peace of mind."),
                    React.createElement(components_1.Section, { className: "text-center mt-[32px] mb-[32px]" },
                        React.createElement(components_1.Button, { className: "bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3", href: dashboardLink }, "Get My Free Legal Protection"),
                        React.createElement(components_1.Text, { className: "text-[#666666] text-[12px] leading-[20px] mt-[12px]" },
                            "Or ",
                            React.createElement(components_1.Link, { href: calendlyLink, className: "text-teal-600 no-underline" }, "book a free call"),
                            " to see how we can help")),
                    React.createElement(components_1.Section, { className: "bg-gray-50 rounded-lg p-[20px] my-[24px]" },
                        React.createElement(components_1.Text, { className: "text-black text-[13px] leading-[20px]" },
                            React.createElement("strong", null, "\uD83D\uDCA1 Why they chose Conscious Counsel:")),
                        React.createElement("ul", { style: { margin: '12px 0 0 0', paddingLeft: '20px' } },
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } }, "Free legal document templates"),
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } }, "Personalized recommendations based on their business"),
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } }, "Expert support when they need it"),
                            React.createElement("li", { style: { marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' } }, "Simple, no-legal-jargon approach"))),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "Don't be the one business that wasn't protected. Join the movement today."),
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
exports.SocialProofEmail = SocialProofEmail;
exports.default = exports.SocialProofEmail;
