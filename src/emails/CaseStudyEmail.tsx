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

interface CaseStudyEmailProps {
    name?: string;
    businessName?: string;
    businessType?: string;
    dashboardLink?: string;
    calendlyLink?: string;
}

export const CaseStudyEmail = ({
    name,
    businessName = "your business",
    businessType = "wellness business",
    dashboardLink = "https://free.consciouscounsel.ca/wellness/dashboard",
    calendlyLink = "https://calendly.com/chad-consciouscounsel/connection-call-with-chad",
}: CaseStudyEmailProps) => {
    // Extract first name from full name if available
    const getFirstName = () => {
        if (!name) return 'there';
        const firstName = name.trim().split(' ')[0];
        return firstName || 'there';
    };

    const firstName = getFirstName();

    return (
        <Html>
            <Head />
            <Preview>How a {businessType} avoided a $50K lawsuit with proper legal protection</Preview>
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
                            💡 How a {businessType} avoided a $50K lawsuit
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hi {firstName},
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Last year, a yoga studio owner almost lost her business over a single class.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            A client claimed they were injured, threatened to sue for $75,000, and told her to "expect papers." Overnight, she went from running classes to wondering if she'd have to shut everything down.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            What saved her wasn't luck.
                        </Text>

                        {/* What Saved Her */}
                        <Section
                            style={{
                                backgroundColor: '#f0fdfa',
                                borderRadius: '12px',
                                padding: '24px',
                                margin: '24px 0',
                                border: '2px solid #0d9488',
                            }}
                        >
                            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#0d9488', margin: '0 0 16px 0' }}>
                                🛡️ What Saved Her
                            </Text>
                            <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    She had a <strong>real liability waiver</strong> written for her business.
                                </li>
                                <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    Her <strong>agreements clearly outlined the risks</strong>.
                                </li>
                                <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    And her <strong>insurance actually matched what she was doing</strong>.
                                </li>
                            </ul>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Her lawyer reviewed everything — and the case was dropped.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            She paid $0 in legal fees or settlements.
                        </Text>

                        {/* Cost Warning */}
                        <Section className="bg-red-50 rounded-lg p-[20px] my-[24px] border-l-4" style={{ borderLeftColor: '#dc2626' }}>
                            <Text className="text-black text-[14px] font-bold mb-[8px]">
                                ⚠️ Without Those Documents
                            </Text>
                            <Text className="text-black text-[13px] leading-[20px]">
                                Without those documents, her attorney told her she would've been looking at:
                            </Text>
                            <ul style={{ margin: '12px 0 0 0', paddingLeft: '20px' }}>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    $50,000–$150,000 in legal costs
                                </li>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    Months of stress
                                </li>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    A very real risk of closing her studio
                                </li>
                            </ul>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Most wellness owners think their waivers and contracts are "good enough."
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            That's exactly what she thought too.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            If you run a {businessType}, you likely have the same exposure — you just don't know it yet.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            That's why we offer a free legal protection review for wellness businesses. On a short call, we'll walk through what you're doing, identify gaps, and tell you exactly what needs to be fixed (and what doesn't).
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            No pressure. No obligation. Just clarity.
                        </Text>

                        {/* CTA Section */}
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Text className="text-black text-[14px] leading-[24px] mb-[16px]">
                                👉 Book your free legal protection review here:
                            </Text>
                            <Button
                                className="bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
                                href={calendlyLink}
                            >
                                Book Free Legal Protection Review
                            </Button>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px] mt-[24px]">
                            Talk soon,
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

export default CaseStudyEmail;

