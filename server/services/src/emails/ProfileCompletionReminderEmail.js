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
exports.ProfileCompletionReminderEmail = void 0;
const React = __importStar(require("react"));
const components_1 = require("@react-email/components");
const ProfileCompletionReminderEmail = ({ name, profileLink = "https://free.consciouscounsel.ca/wellness/dashboard/profile", }) => {
    return (React.createElement(components_1.Html, null,
        React.createElement(components_1.Head, null),
        React.createElement(components_1.Preview, null, "Quick question about your business..."),
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
                    React.createElement(components_1.Heading, { className: "text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0" }, "Quick question about your business..."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "Hi ",
                        name || 'there',
                        ","),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "We noticed you haven't finished setting up your business profile yet. Don't worry\u2014completing it only takes about 2 minutes, and it unlocks personalized legal documents tailored specifically to your business."),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        React.createElement("strong", null, "Here's what you'll get when you complete it:")),
                    React.createElement(components_1.Section, { className: "my-[24px]" },
                        React.createElement("ul", { style: { margin: 0, paddingLeft: '20px' } },
                            React.createElement("li", { style: { marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "Personalized legal documents"),
                                " \u2013 Waivers, contracts, and policies customized with your business name and details"),
                            React.createElement("li", { style: { marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "Customized recommendations"),
                                " \u2013 Get document suggestions based on your specific business type and services"),
                            React.createElement("li", { style: { marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "Your legal health score"),
                                " \u2013 See how protected your business is and what to improve"),
                            React.createElement("li", { style: { marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                                React.createElement("strong", null, "Access to your document vault"),
                                " \u2013 Store and manage all your legal documents in one place"))),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        React.createElement("strong", null, "Why it matters:")),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "The more we know about your business, the better we can protect you. Your profile helps us generate documents with your business name, services, and details already filled in\u2014saving you time and ensuring everything is accurate."),
                    React.createElement(components_1.Section, { className: "text-center mt-[32px] mb-[32px]" },
                        React.createElement(components_1.Button, { className: "bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3", href: profileLink }, "Complete My Business Profile")),
                    React.createElement(components_1.Section, { className: "bg-gray-50 rounded-lg p-[20px] my-[24px]" },
                        React.createElement(components_1.Text, { className: "text-black text-[14px] font-semibold mb-[12px]" }, "\uD83D\uDCA1 Quick tip:"),
                        React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "Start with just your business name\u2014you can add more details later. Even a basic profile unlocks document generation, so you can get started right away.")),
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
exports.ProfileCompletionReminderEmail = ProfileCompletionReminderEmail;
exports.default = exports.ProfileCompletionReminderEmail;
