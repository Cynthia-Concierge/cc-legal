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

interface SocialProofEmailProps {
    name?: string;
    businessType?: string;
    totalProtected?: number;
    recentSignups?: number;
    dashboardLink?: string;
    calendlyLink?: string;
}

export const SocialProofEmail = ({
    name,
    businessType = "wellness business",
    totalProtected = 1247,
    recentSignups = 34,
    dashboardLink = "https://free.consciouscounsel.ca/wellness/dashboard",
    calendlyLink = "https://calendly.com/chad-consciouscounsel/connection-call-with-chad",
}: SocialProofEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>{totalProtected}+ wellness businesses trust Conscious Counsel for legal protection</Preview>
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
                            🎉 Join {totalProtected}+ Protected Wellness Businesses
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hi {name || 'there'},
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            I wanted to share something exciting with you: <strong>{totalProtected} wellness businesses</strong> have chosen Conscious Counsel to protect their businesses.
                        </Text>

                        {/* Stats Card */}
                        <Section
                            style={{
                                backgroundColor: '#f0fdfa',
                                borderRadius: '12px',
                                padding: '24px',
                                margin: '24px 0',
                                border: '2px solid #0d9488',
                                textAlign: 'center',
                            }}
                        >
                            <Text style={{ fontSize: '48px', fontWeight: 'bold', color: '#0d9488', margin: '0', lineHeight: '1' }}>
                                {totalProtected}
                            </Text>
                            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#0d9488', margin: '12px 0 0 0' }}>
                                Wellness Businesses Protected
                            </Text>
                            <Text style={{ fontSize: '14px', color: '#059669', margin: '16px 0 0 0', fontWeight: '600' }}>
                                +{recentSignups} joined this week
                            </Text>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            These aren't just numbers—they're real yoga studios, retreat leaders, coaches, and wellness professionals who decided to protect their businesses from legal risks.
                        </Text>

                        {/* Business Type Breakdown */}
                        <Section className="bg-gray-50 rounded-lg p-[20px] my-[24px]">
                            <Text className="text-black text-[14px] font-bold mb-[12px]">
                                👥 Who's Using Conscious Counsel:
                            </Text>
                            <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    <strong>127 yoga studios</strong> protecting their classes and retreats
                                </li>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    <strong>89 retreat leaders</strong> covering international events
                                </li>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    <strong>203 coaches</strong> protecting their online programs
                                </li>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    <strong>156 gyms and fitness studios</strong> covering physical activities
                                </li>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    <strong>And hundreds more</strong> wellness businesses just like yours
                                </li>
                            </ul>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            They all have one thing in common: <strong>they decided not to wait until something went wrong.</strong>
                        </Text>

                        {/* Testimonials */}
                        <Section className="bg-emerald-50 rounded-lg p-[20px] my-[24px]">
                            <Text className="text-black text-[13px] leading-[20px] italic mb-[12px]">
                                <strong>"I almost didn't get the documents because I thought I didn't need them. Thank goodness I did—they literally saved my business when a client threatened to sue."</strong>
                            </Text>
                            <Text className="text-black text-[12px] leading-[18px]" style={{ color: '#059669' }}>
                                — Sarah, Yoga Studio Owner
                            </Text>
                        </Section>

                        <Section className="bg-emerald-50 rounded-lg p-[20px] my-[24px]">
                            <Text className="text-black text-[13px] leading-[20px] italic mb-[12px]">
                                <strong>"The peace of mind is worth everything. I know my retreat business is protected, and I can focus on creating amazing experiences for my clients."</strong>
                            </Text>
                            <Text className="text-black text-[12px] leading-[18px]" style={{ color: '#059669' }}>
                                — Maria, Retreat Leader
                            </Text>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Your business deserves the same protection. Join the {totalProtected}+ wellness businesses who chose legal peace of mind.
                        </Text>

                        {/* CTA Section */}
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
                                href={dashboardLink}
                            >
                                Get My Free Legal Protection
                            </Button>
                            <Text className="text-[#666666] text-[12px] leading-[20px] mt-[12px]">
                                Or <Link href={calendlyLink} className="text-teal-600 no-underline">book a free call</Link> to see how we can help
                            </Text>
                        </Section>

                        <Section className="bg-gray-50 rounded-lg p-[20px] my-[24px]">
                            <Text className="text-black text-[13px] leading-[20px]">
                                <strong>💡 Why they chose Conscious Counsel:</strong>
                            </Text>
                            <ul style={{ margin: '12px 0 0 0', paddingLeft: '20px' }}>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    Free legal document templates
                                </li>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    Personalized recommendations based on their business
                                </li>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    Expert support when they need it
                                </li>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    Simple, no-legal-jargon approach
                                </li>
                            </ul>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Don't be the one business that wasn't protected. Join the movement today.
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

export default SocialProofEmail;


