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

interface FinalReminderEmailProps {
    name?: string;
    businessType?: string;
    dashboardLink?: string;
    calendlyLink?: string;
}

export const FinalReminderEmail = ({
    name,
    businessType = "wellness business",
    dashboardLink = "https://free.consciouscounsel.ca/wellness/dashboard",
    calendlyLink = "https://calendly.com/chad-consciouscounsel/connection-call-with-chad",
}: FinalReminderEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Last chance: Free consultation expires in 48 hours</Preview>
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
                            ⏰ Last Chance: Free Consultation Expires Soon
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hi {name || 'there'},
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            I wanted to reach out one more time because your <strong>free legal consultation offer expires in 48 hours</strong>.
                        </Text>

                        {/* Urgency Card */}
                        <Section
                            style={{
                                backgroundColor: '#fef2f2',
                                borderRadius: '12px',
                                padding: '24px',
                                margin: '24px 0',
                                border: '2px solid #dc2626',
                                textAlign: 'center',
                            }}
                        >
                            <Text style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626', margin: '0 0 8px 0' }}>
                                48 Hours Left
                            </Text>
                            <Text style={{ fontSize: '14px', color: '#991b1b', margin: '0' }}>
                                Your free consultation offer expires soon
                            </Text>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            I know you're busy running your business, but I don't want you to miss out on this opportunity to get personalized legal protection—completely free.
                        </Text>

                        {/* What You Get */}
                        <Section className="bg-emerald-50 rounded-lg p-[20px] my-[24px]">
                            <Text className="text-black text-[14px] font-bold mb-[12px]">
                                🎁 What You Get (Free):
                            </Text>
                            <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>15-30 minute consultation</strong> with a legal expert
                                </li>
                                <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>Personalized risk assessment</strong> for your business
                                </li>
                                <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>Custom document recommendations</strong> based on your business
                                </li>
                                <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>Free legal document templates</strong> to get started immediately
                                </li>
                                <li style={{ marginBottom: '8px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>No obligation</strong>—just honest advice
                                </li>
                            </ul>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            <strong>After 48 hours, this offer expires.</strong> Regular consultations cost $200, but you can book yours for free right now.
                        </Text>

                        {/* Why Now */}
                        <Section className="bg-gray-50 rounded-lg p-[20px] my-[24px]">
                            <Text className="text-black text-[14px] font-bold mb-[8px]">
                                ⚡ Why book now?
                            </Text>
                            <ul style={{ margin: '0', paddingLeft: '20px' }}>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    <strong>Free consultation</strong> (normally $200)
                                </li>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    <strong>Limited spots available</strong> this week
                                </li>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    <strong>Get protected before something goes wrong</strong>
                                </li>
                                <li style={{ marginBottom: '6px', color: '#1f2937', fontSize: '13px', lineHeight: '1.5' }}>
                                    <strong>No obligation</strong>—just get expert advice
                                </li>
                            </ul>
                        </Section>

                        {/* CTA Section */}
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
                                href={calendlyLink}
                            >
                                Book My Free Consultation Now
                            </Button>
                            <Text className="text-[#666666] text-[12px] leading-[20px] mt-[12px]">
                                Or <Link href={dashboardLink} className="text-teal-600 no-underline">access your dashboard</Link> to get started on your own
                            </Text>
                        </Section>

                        <Section className="bg-red-50 rounded-lg p-[20px] my-[24px] border-l-4" style={{ borderLeftColor: '#dc2626' }}>
                            <Text className="text-black text-[13px] leading-[20px]">
                                <strong>⚠️ Don't wait until it's too late.</strong> Every day you delay is another day your business is exposed to legal risks. Get protected today—it's free and takes just 15 minutes.
                            </Text>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            I'd love to help you protect your business. Book your free consultation before the offer expires.
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

export default FinalReminderEmail;


