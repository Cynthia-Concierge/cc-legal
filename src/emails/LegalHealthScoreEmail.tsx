import * as React from "react";
import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
    Hr,
} from "@react-email/components";

interface LegalHealthScoreEmailProps {
    name?: string;
    businessName?: string;
    businessType?: string;
    score: number;
    riskLevel: 'Low' | 'Moderate' | 'High';
    // Risk factors (what contributes to their score)
    hasPhysicalMovement?: boolean;
    hostsRetreats?: boolean;
    hiresStaff?: boolean;
    collectsOnline?: boolean;
    usesPhotos?: boolean;
    // Dashboard and Calendly links
    dashboardLink?: string;
    calendlyLink?: string;
}

export const LegalHealthScoreEmail = ({
    name,
    businessName = "your business",
    businessType = "wellness business",
    score,
    riskLevel,
    hasPhysicalMovement = false,
    hostsRetreats = false,
    hiresStaff = false,
    collectsOnline = false,
    usesPhotos = false,
    dashboardLink = "https://free.consciouscounsel.ca/wellness/dashboard",
    calendlyLink = "https://calendly.com/chad-consciouscounsel/connection-call-with-chad",
}: LegalHealthScoreEmailProps) => {
    // Dynamic content based on risk level
    const getRiskEmoji = () => {
        if (riskLevel === 'High') return '🚨';
        if (riskLevel === 'Moderate') return '⚠️';
        return '✅';
    };

    const getRiskColor = () => {
        if (riskLevel === 'High') return '#dc2626'; // red-600
        if (riskLevel === 'Moderate') return '#ea580c'; // orange-600
        return '#059669'; // emerald-600
    };

    const getRiskBackgroundColor = () => {
        if (riskLevel === 'High') return '#fef2f2'; // red-50
        if (riskLevel === 'Moderate') return '#fff7ed'; // orange-50
        return '#f0fdf4'; // emerald-50
    };

    const getSubjectLine = () => {
        if (riskLevel === 'High') return `${name || 'there'}, your business has ${score} risk points`;
        if (riskLevel === 'Moderate') return `Your Legal Health Score: ${score}/100`;
        return `Good news about your legal protection`;
    };

    // Build list of specific risk factors for this business
    const riskFactors: string[] = [];
    if (hasPhysicalMovement) riskFactors.push('Physical movement activities (yoga, fitness, pilates)');
    if (hostsRetreats) riskFactors.push('Off-site retreats or travel events');
    if (hiresStaff) riskFactors.push('Hiring staff or contractors');
    if (collectsOnline) riskFactors.push('Online payments and bookings');
    if (usesPhotos) riskFactors.push('Using client photos/videos for marketing');

    // Dynamic headline
    const getHeadline = () => {
        if (riskLevel === 'High') {
            return `Your ${businessType} has a ${score}/100 risk score`;
        }
        if (riskLevel === 'Moderate') {
            return `Your business is moderately exposed (${score}/100)`;
        }
        return `You're in good shape! (${score}/100 risk score)`;
    };

    // Dynamic explanation
    const getExplanation = () => {
        if (riskLevel === 'High') {
            return `Based on your business profile, ${businessName} has significant legal exposure. This doesn't mean you're in trouble—it means your business activities involve higher liability risks that require robust legal protection.`;
        }
        if (riskLevel === 'Moderate') {
            return `${businessName} has moderate legal exposure. You're doing some things right, but there are gaps in your protection that could leave you vulnerable if something goes wrong.`;
        }
        return `Great news! ${businessName} has relatively low legal exposure. However, even low-risk businesses need proper legal documentation to protect against unexpected situations.`;
    };

    // What this means section
    const getWhatThisMeans = () => {
        if (riskLevel === 'High') {
            return (
                <>
                    <Text className="text-black text-[14px] leading-[24px]">
                        <strong style={{ color: getRiskColor() }}>What this means for you:</strong>
                    </Text>
                    <Section className="my-[16px]">
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                <strong>Higher liability risk</strong> – Your activities could lead to injury claims, lawsuits, or disputes
                            </li>
                            <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                <strong>More legal documents needed</strong> – Waivers, contracts, policies, and disclaimers are essential
                            </li>
                            <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                <strong>One lawsuit could devastate your business</strong> – Legal fees average $50,000-$150,000 even if you win
                            </li>
                        </ul>
                    </Section>
                </>
            );
        }
        if (riskLevel === 'Moderate') {
            return (
                <>
                    <Text className="text-black text-[14px] leading-[24px]">
                        <strong style={{ color: getRiskColor() }}>What this means for you:</strong>
                    </Text>
                    <Section className="my-[16px]">
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                <strong>Some protection gaps exist</strong> – You're not in immediate danger, but there are vulnerabilities
                            </li>
                            <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                <strong>Prevention is easier than defense</strong> – Fixing gaps now costs $0; fixing them after a lawsuit costs tens of thousands
                            </li>
                            <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                <strong>A few key documents will significantly improve your protection</strong>
                            </li>
                        </ul>
                    </Section>
                </>
            );
        }
        return (
            <>
                <Text className="text-black text-[14px] leading-[24px]">
                    <strong style={{ color: getRiskColor() }}>What this means for you:</strong>
                </Text>
                <Section className="my-[16px]">
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                            <strong>Lower inherent risk</strong> – Your business activities have less liability exposure
                        </li>
                        <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                            <strong>Basic protection is still essential</strong> – Even low-risk businesses need proper terms, privacy policies, and contracts
                        </li>
                        <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                            <strong>Get protected now before you scale</strong> – It's easier to set things up correctly from the start
                        </li>
                    </ul>
                </Section>
            </>
        );
    };

    return (
        <Html>
            <Head />
            <Preview>{getSubjectLine()}</Preview>
            <Tailwind
                config={{
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
                }}
            >
                <Body className="bg-gray-100 my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[600px] bg-white">
                        <Section className="mt-[32px]">
                            <Text className="text-black text-[24px] font-bold text-center p-0 my-0 mx-auto">
                                Conscious Counsel
                            </Text>
                        </Section>

                        <Heading className="text-black text-[22px] font-bold text-center p-0 my-[30px] mx-0">
                            {getRiskEmoji()} {getHeadline()}
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hi {name || 'there'},
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            {getExplanation()}
                        </Text>

                        {/* Risk Score Card */}
                        <Section
                            style={{
                                backgroundColor: getRiskBackgroundColor(),
                                borderRadius: '12px',
                                padding: '24px',
                                textAlign: 'center',
                                margin: '24px 0',
                                border: `2px solid ${getRiskColor()}`,
                            }}
                        >
                            <Text style={{ fontSize: '14px', fontWeight: 'bold', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px 0' }}>
                                Your Legal Health Score
                            </Text>
                            <Text style={{ fontSize: '48px', fontWeight: 'bold', color: getRiskColor(), margin: '0', lineHeight: '1' }}>
                                {score}
                            </Text>
                            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: getRiskColor(), textTransform: 'uppercase', margin: '12px 0 0 0' }}>
                                {riskLevel} Risk
                            </Text>
                        </Section>

                        {getWhatThisMeans()}

                        {/* Risk Factors Breakdown */}
                        {riskFactors.length > 0 && (
                            <>
                                <Text className="text-black text-[14px] leading-[24px]">
                                    <strong>Why your score is {score}/100:</strong>
                                </Text>
                                <Text className="text-black text-[14px] leading-[24px]">
                                    Based on your profile, these factors contribute to your risk score:
                                </Text>
                                <Section className="bg-gray-50 rounded-lg p-[16px] my-[16px]">
                                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                        {riskFactors.map((factor, index) => (
                                            <li key={index} style={{ marginBottom: '6px', color: '#374151', fontSize: '13px', lineHeight: '1.5' }}>
                                                {factor}
                                            </li>
                                        ))}
                                    </ul>
                                </Section>
                            </>
                        )}

                        {/* Call to Action based on Risk Level */}
                        {riskLevel === 'High' ? (
                            <>
                                <Section className="bg-red-50 rounded-lg p-[20px] my-[24px] border-l-4" style={{ borderLeftColor: '#dc2626' }}>
                                    <Text className="text-black text-[14px] font-bold mb-[8px]">
                                        ⚡ Here's what you should do immediately:
                                    </Text>
                                    <Text className="text-black text-[13px] leading-[20px] mb-[8px]">
                                        1. <strong>Review the documents in your dashboard</strong> – See exactly what legal protection you need
                                    </Text>
                                    <Text className="text-black text-[13px] leading-[20px] mb-[8px]">
                                        2. <strong>Download your free liability waiver template</strong> – Start using it with every client immediately
                                    </Text>
                                    <Text className="text-black text-[13px] leading-[20px]">
                                        3. <strong>Book a 15-minute call with Chad</strong> – Get personalized advice on closing your protection gaps
                                    </Text>
                                </Section>

                                <Section className="text-center mt-[32px] mb-[32px]">
                                    <Button
                                        className="bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
                                        href={calendlyLink}
                                    >
                                        Book My Free 15-Min Legal Audit
                                    </Button>
                                    <Text className="text-[#666666] text-[12px] leading-[20px] mt-[12px]">
                                        Or <Link href={dashboardLink} className="text-teal-600 no-underline">view your dashboard</Link>
                                    </Text>
                                </Section>
                            </>
                        ) : riskLevel === 'Moderate' ? (
                            <>
                                <Section className="bg-orange-50 rounded-lg p-[20px] my-[24px]">
                                    <Text className="text-black text-[14px] font-bold mb-[12px]">
                                        💡 Next steps to improve your protection:
                                    </Text>
                                    <Text className="text-black text-[13px] leading-[20px]">
                                        1. <strong>Check your dashboard</strong> for personalized document recommendations<br />
                                        2. <strong>Download your free templates</strong> and start using them today<br />
                                        3. <strong>Optional: Book a call</strong> if you want expert review of your setup
                                    </Text>
                                </Section>

                                <Section className="text-center mt-[32px] mb-[32px]">
                                    <Button
                                        className="bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3 mb-[12px]"
                                        href={dashboardLink}
                                    >
                                        View My Dashboard
                                    </Button>
                                    <br />
                                    <Link href={calendlyLink} className="text-teal-600 text-[13px] no-underline">
                                        or schedule a free call with Chad →
                                    </Link>
                                </Section>
                            </>
                        ) : (
                            <>
                                <Section className="bg-emerald-50 rounded-lg p-[20px] my-[24px]">
                                    <Text className="text-black text-[14px] font-bold mb-[12px]">
                                        ✨ You're in a great position. Here's what to do:
                                    </Text>
                                    <Text className="text-black text-[13px] leading-[20px]">
                                        1. <strong>Download your free legal document templates</strong> – Get protected now before you need them<br />
                                        2. <strong>Set up your terms and privacy policy</strong> – Essential for any online business<br />
                                        3. <strong>Lock in your protection before you scale</strong> – It's easier to do it right from the start
                                    </Text>
                                </Section>

                                <Section className="text-center mt-[32px] mb-[32px]">
                                    <Button
                                        className="bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
                                        href={dashboardLink}
                                    >
                                        Get My Free Documents
                                    </Button>
                                </Section>
                            </>
                        )}

                        {/* Case Study / Social Proof based on risk level */}
                        {riskLevel === 'High' && (
                            <Section className="bg-gray-50 rounded-lg p-[20px] my-[24px]">
                                <Text className="text-black text-[13px] leading-[20px] italic">
                                    <strong>Real story:</strong> A yoga studio owner with a similar risk profile was sued when a client fell during class. Without a proper waiver, they spent $87,000 in legal fees and settlements. The right documents would have cost $0 and prevented the entire situation.
                                </Text>
                            </Section>
                        )}

                        <Text className="text-black text-[14px] leading-[24px]">
                            If you have questions about your score or what documents you need, just reply to this email. I'm here to help.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px] mt-[24px]">
                            Best,
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px] font-bold mt-[8px]">
                            Chad<br />
                            Conscious Counsel
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Section className="text-center">
                            <Text className="text-[#666666] text-[12px] leading-[24px] mb-[8px]">
                                Need help? Email us at{" "}
                                <Link href="mailto:chad@consciouscounsel.ca" className="text-teal-600 no-underline">
                                    chad@consciouscounsel.ca
                                </Link>
                            </Text>
                            <Text className="text-[#666666] text-[12px] leading-[24px]">
                                © {new Date().getFullYear()} Conscious Counsel. All rights reserved.
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default LegalHealthScoreEmail;
