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

interface WebsiteScanReminderEmailProps {
    name?: string;
    scanLink?: string;
}

export const WebsiteScanReminderEmail = ({
    name,
    scanLink = "https://free.consciouscounsel.ca/wellness/dashboard",
}: WebsiteScanReminderEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Found something on your website...</Preview>
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

                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Found something on your website...
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hi {name || 'there'},
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Great news—your business profile is complete! Now it's time for the next step: scanning your website to identify any legal gaps or compliance issues.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            <strong>What we'll check:</strong>
                        </Text>

                        <Section className="my-[24px]">
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                <li style={{ marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>Missing legal documents</strong> – Privacy policies, terms of service, disclaimers, and more
                                </li>
                                <li style={{ marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>Compliance gaps</strong> – Issues with existing policies or missing required clauses
                                </li>
                                <li style={{ marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>Legal risks</strong> – Marketing claims, testimonial usage, and other potential liabilities
                                </li>
                                <li style={{ marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>Actionable recommendations</strong> – Clear next steps to protect your business
                                </li>
                            </ul>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            The scan takes about 2 minutes and shows you exactly what's missing or needs attention on your website. No guesswork—just clear, actionable insights.
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
                                href={scanLink}
                            >
                                Scan My Website
                            </Button>
                        </Section>

                        <Section className="bg-gray-50 rounded-lg p-[20px] my-[24px]">
                            <Text className="text-black text-[14px] font-semibold mb-[12px]">
                                💡 Quick tip:
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px]">
                                After the scan, you'll get a detailed report showing exactly what legal documents you need. We'll even help you generate them personalized for your business.
                            </Text>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            If you have any questions, <Link href="mailto:chad@consciouscounsel.ca" className="text-teal-600 no-underline">email us here</Link>. We're here to help.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px] mt-[24px]">
                            Best,
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px] font-bold mt-[8px]">
                            The Conscious Counsel Team
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

export default WebsiteScanReminderEmail;

