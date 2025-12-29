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
exports.LegalHealthScoreEmail = void 0;
const React = __importStar(require("react"));
const components_1 = require("@react-email/components");
const LegalHealthScoreEmail = ({ name, businessType = "wellness business", score, riskLevel, hasPhysicalMovement = false, hostsRetreats = false, hiresStaff = false, collectsOnline = false, usesPhotos = false, dashboardLink = "https://free.consciouscounsel.ca/wellness/dashboard", calendlyLink = "https://calendly.com/chad-consciouscounsel/connection-call-with-chad", }) => {
    // Dynamic content based on risk level
    const getRiskEmoji = () => {
        if (riskLevel === 'High')
            return '🚨';
        if (riskLevel === 'Moderate')
            return '⚠️';
        return '✅';
    };
    const getRiskColor = () => {
        if (riskLevel === 'High')
            return '#dc2626'; // red-600
        if (riskLevel === 'Moderate')
            return '#ea580c'; // orange-600
        return '#059669'; // emerald-600
    };
    const getRiskBackgroundColor = () => {
        if (riskLevel === 'High')
            return '#fef2f2'; // red-50
        if (riskLevel === 'Moderate')
            return '#fff7ed'; // orange-50
        return '#f0fdf4'; // emerald-50
    };
    const getSubjectLine = () => {
        if (riskLevel === 'High')
            return `${name || 'there'}, your business has ${score} risk points`;
        if (riskLevel === 'Moderate')
            return `Your Legal Health Score: ${score}/100`;
        return `Good news about your legal protection`;
    };
    // Build list of specific risk factors for this business
    const riskFactors = [];
    if (hasPhysicalMovement)
        riskFactors.push('Physical movement activities (yoga, fitness, pilates)');
    if (hostsRetreats)
        riskFactors.push('Off-site retreats or travel events');
    if (hiresStaff)
        riskFactors.push('Hiring staff or contractors');
    if (collectsOnline)
        riskFactors.push('Online payments and bookings');
    if (usesPhotos)
        riskFactors.push('Using client photos/videos for marketing');
    // Dynamic headline
    const getHeadline = () => {
        if (riskLevel === 'High') {
            return `Your business has a ${score}/100 risk score`;
        }
        if (riskLevel === 'Moderate') {
            return `Your business is moderately exposed (${score}/100)`;
        }
        return `You're in good shape! (${score}/100 risk score)`;
    };
    // Dynamic explanation
    const getExplanation = () => {
        if (riskLevel === 'High') {
            return `Based on your business profile, your business has significant legal exposure. This doesn't mean you're in trouble—it means your business activities involve higher liability risks that require robust legal protection.`;
        }
        if (riskLevel === 'Moderate') {
            return `Your business has moderate legal exposure. You're doing some things right, but there are gaps in your protection that could leave you vulnerable if something goes wrong.`;
        }
        return `Great news! Your business has relatively low legal exposure. However, even low-risk businesses need proper legal documentation to protect against unexpected situations.`;
    };
    // What this means section
    const getWhatThisMeans = () => {
        if (riskLevel === 'High') {
            return (React.createElement(React.Fragment, null,
                React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                    React.createElement("strong", { style: { color: getRiskColor() } }, "What this means for you:")),
                React.createElement(components_1.Section, { className: "my-[16px]" },
                    React.createElement("ul", { style: { margin: 0, paddingLeft: '20px' } },
                        React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                            React.createElement("strong", null, "Higher liability risk"),
                            " \u2013 Your activities could lead to injury claims, lawsuits, or disputes"),
                        React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                            React.createElement("strong", null, "More legal documents needed"),
                            " \u2013 Waivers, contracts, policies, and disclaimers are essential"),
                        React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                            React.createElement("strong", null, "One lawsuit could devastate your business"),
                            " \u2013 Legal fees average $50,000-$150,000 even if you win")))));
        }
        if (riskLevel === 'Moderate') {
            return (React.createElement(React.Fragment, null,
                React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                    React.createElement("strong", { style: { color: getRiskColor() } }, "What this means for you:")),
                React.createElement(components_1.Section, { className: "my-[16px]" },
                    React.createElement("ul", { style: { margin: 0, paddingLeft: '20px' } },
                        React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                            React.createElement("strong", null, "Some protection gaps exist"),
                            " \u2013 You're not in immediate danger, but there are vulnerabilities"),
                        React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                            React.createElement("strong", null, "Prevention is easier than defense"),
                            " \u2013 Fixing gaps now costs $0; fixing them after a lawsuit costs tens of thousands"),
                        React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                            React.createElement("strong", null, "A few key documents will significantly improve your protection"))))));
        }
        return (React.createElement(React.Fragment, null,
            React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                React.createElement("strong", { style: { color: getRiskColor() } }, "What this means for you:")),
            React.createElement(components_1.Section, { className: "my-[16px]" },
                React.createElement("ul", { style: { margin: 0, paddingLeft: '20px' } },
                    React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                        React.createElement("strong", null, "Lower inherent risk"),
                        " \u2013 Your business activities have less liability exposure"),
                    React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                        React.createElement("strong", null, "Basic protection is still essential"),
                        " \u2013 Even low-risk businesses need proper terms, privacy policies, and contracts"),
                    React.createElement("li", { style: { marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' } },
                        React.createElement("strong", null, "Get protected now before you scale"),
                        " \u2013 It's easier to set things up correctly from the start")))));
    };
    return (React.createElement(components_1.Html, null,
        React.createElement(components_1.Head, null),
        React.createElement(components_1.Preview, null, getSubjectLine()),
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
                        getRiskEmoji(),
                        " ",
                        getHeadline()),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                        "Hi ",
                        name || 'there',
                        ","),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, getExplanation()),
                    React.createElement(components_1.Section, { style: {
                            backgroundColor: getRiskBackgroundColor(),
                            borderRadius: '12px',
                            padding: '24px',
                            textAlign: 'center',
                            margin: '24px 0',
                            border: `2px solid ${getRiskColor()}`,
                        } },
                        React.createElement(components_1.Text, { style: { fontSize: '14px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' } }, "Your Legal Health Score"),
                        React.createElement(components_1.Text, { style: { fontSize: '48px', fontWeight: 'bold', color: getRiskColor(), margin: '0', lineHeight: '1' } }, score),
                        React.createElement(components_1.Text, { style: { fontSize: '16px', fontWeight: 'bold', color: getRiskColor(), textTransform: 'uppercase', margin: '12px 0 0 0' } },
                            riskLevel,
                            " Risk")),
                    getWhatThisMeans(),
                    riskFactors.length > 0 && (React.createElement(React.Fragment, null,
                        React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" },
                            React.createElement("strong", null,
                                "Why your score is ",
                                score,
                                "/100:")),
                        React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "Based on your profile, these factors contribute to your risk score:"),
                        React.createElement(components_1.Section, { className: "bg-gray-50 rounded-lg p-[16px] my-[16px]" },
                            React.createElement("ul", { style: { margin: 0, paddingLeft: '20px' } }, riskFactors.map((factor, index) => (React.createElement("li", { key: index, style: { marginBottom: '6px', color: '#374151', fontSize: '13px', lineHeight: '1.5' } }, factor))))))),
                    riskLevel === 'High' ? (React.createElement(React.Fragment, null,
                        React.createElement(components_1.Section, { className: "bg-red-50 rounded-lg p-[20px] my-[24px] border-l-4", style: { borderLeftColor: '#dc2626' } },
                            React.createElement(components_1.Text, { className: "text-black text-[14px] font-bold mb-[8px]" }, "\u26A1 Here's what you should do immediately:"),
                            React.createElement(components_1.Text, { className: "text-black text-[13px] leading-[20px] mb-[8px]" },
                                "1. ",
                                React.createElement("strong", null, "Review the documents in your dashboard"),
                                " \u2013 See exactly what legal protection you need"),
                            React.createElement(components_1.Text, { className: "text-black text-[13px] leading-[20px] mb-[8px]" },
                                "2. ",
                                React.createElement("strong", null, "Download your free liability waiver template"),
                                " \u2013 Start using it with every client immediately"),
                            React.createElement(components_1.Text, { className: "text-black text-[13px] leading-[20px]" },
                                "3. ",
                                React.createElement("strong", null, "Book a 15-minute call with Chad"),
                                " \u2013 Get personalized advice on closing your protection gaps")),
                        React.createElement(components_1.Section, { className: "text-center mt-[32px] mb-[32px]" },
                            React.createElement(components_1.Button, { className: "bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3", href: calendlyLink }, "Book My Free 15-Min Legal Audit"),
                            React.createElement(components_1.Text, { className: "text-[#666666] text-[12px] leading-[20px] mt-[12px]" },
                                "Or ",
                                React.createElement(components_1.Link, { href: dashboardLink, className: "text-teal-600 no-underline" }, "view your dashboard"))))) : riskLevel === 'Moderate' ? (React.createElement(React.Fragment, null,
                        React.createElement(components_1.Section, { className: "bg-orange-50 rounded-lg p-[20px] my-[24px]" },
                            React.createElement(components_1.Text, { className: "text-black text-[14px] font-bold mb-[12px]" }, "\uD83D\uDCA1 Next steps to improve your protection:"),
                            React.createElement(components_1.Text, { className: "text-black text-[13px] leading-[20px]" },
                                "1. ",
                                React.createElement("strong", null, "Check your dashboard"),
                                " for personalized document recommendations",
                                React.createElement("br", null),
                                "2. ",
                                React.createElement("strong", null, "Download your free templates"),
                                " and start using them today",
                                React.createElement("br", null),
                                "3. ",
                                React.createElement("strong", null, "Optional: Book a call"),
                                " if you want expert review of your setup")),
                        React.createElement(components_1.Section, { className: "text-center mt-[32px] mb-[32px]" },
                            React.createElement(components_1.Button, { className: "bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 mb-[12px]", href: dashboardLink }, "View My Dashboard"),
                            React.createElement("br", null),
                            React.createElement(components_1.Link, { href: calendlyLink, className: "text-teal-600 text-[13px] no-underline" }, "or schedule a free call with Chad \u2192")))) : (React.createElement(React.Fragment, null,
                        React.createElement(components_1.Section, { className: "bg-emerald-50 rounded-lg p-[20px] my-[24px]" },
                            React.createElement(components_1.Text, { className: "text-black text-[14px] font-bold mb-[12px]" }, "\u2728 You're in a great position. Here's what to do:"),
                            React.createElement(components_1.Text, { className: "text-black text-[13px] leading-[20px]" },
                                "1. ",
                                React.createElement("strong", null, "Download your free legal document templates"),
                                " \u2013 Get protected now before you need them",
                                React.createElement("br", null),
                                "2. ",
                                React.createElement("strong", null, "Set up your terms and privacy policy"),
                                " \u2013 Essential for any online business",
                                React.createElement("br", null),
                                "3. ",
                                React.createElement("strong", null, "Lock in your protection before you scale"),
                                " \u2013 It's easier to do it right from the start")),
                        React.createElement(components_1.Section, { className: "text-center mt-[32px] mb-[32px]" },
                            React.createElement(components_1.Button, { className: "bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3", href: dashboardLink }, "Get My Free Documents")))),
                    riskLevel === 'High' && (React.createElement(components_1.Section, { className: "bg-gray-50 rounded-lg p-[20px] my-[24px]" },
                        React.createElement(components_1.Text, { className: "text-black text-[13px] leading-[20px] italic" },
                            React.createElement("strong", null, "Real story:"),
                            " A yoga studio owner with a similar risk profile was sued when a client fell during class. Without a proper waiver, they spent $87,000 in legal fees and settlements. The right documents would have cost $0 and prevented the entire situation."))),
                    React.createElement(components_1.Text, { className: "text-black text-[14px] leading-[24px]" }, "If you have questions about your score or what documents you need, just reply to this email. I'm here to help."),
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
exports.LegalHealthScoreEmail = LegalHealthScoreEmail;
exports.default = exports.LegalHealthScoreEmail;
