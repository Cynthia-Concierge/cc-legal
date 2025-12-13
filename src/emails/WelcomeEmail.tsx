
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

interface WelcomeEmailProps {
    name?: string;
    dashboardLink?: string;
}

export const WelcomeEmail = ({
    name,
    dashboardLink = "https://cynthiaconcierge.com/dashboard",
}: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to Conscious Counsel! 🛡️</Preview>
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
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px] bg-white">
                        <Section className="mt-[32px] mb-[32px]">
                            <Text className="text-black text-[24px] font-bold text-center p-0 my-0 mx-auto">
                                Conscious Counsel
                            </Text>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hi {name || 'there'},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            We're thrilled you're here! Your account is all set up, and you're just a few steps away from having bulletproof legal protection for your wellness business.
                        </Text>

                        <Section>
                            <Text className="text-black text-[14px] leading-[24px] font-bold">
                                Here's what you can do right now:
                            </Text>
                            <ul className="text-black text-[14px] leading-[24px] pl-5 mt-0">
                                <li className="mb-2"><strong>Complete your business profile</strong> – Tell us about your services so we can personalize everything for you</li>
                                <li className="mb-2"><strong>Scan your website</strong> – We'll analyze your site and identify any legal gaps or risks</li>
                                <li className="mb-2"><strong>Generate personalized documents</strong> – Get custom legal documents tailored to your business</li>
                                <li className="mb-2"><strong>Check your legal health score</strong> – See how protected your business is and what to improve</li>
                            </ul>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Everything is designed to be simple and straightforward. No legal jargon, no confusion—just clear protection for your business so you can focus on what you do best.
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-teal-500 rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={dashboardLink}
                            >
                                Go to Your Dashboard
                            </Button>
                        </Section>

                        <Section className="bg-gray-50 p-4 rounded-md border border-gray-100 mb-[24px]">
                            <Text className="text-black text-[14px] leading-[24px] m-0">
                                <strong>💡 Quick tip:</strong><br />
                                Start by completing your business profile. The more we know about your business, the better we can protect you with personalized legal documents.
                            </Text>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            If you have any questions or need help getting started, please email us{" "}
                            <Link href="mailto:chad@consciouscounsel.ca" className="text-teal-600 underline">
                                here
                            </Link>
                            . We're here to help you every step of the way.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px] mt-[24px]">
                            Welcome aboard!
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px] font-bold">
                            The Conscious Counsel Team
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
                            Need help? <Link href="mailto:chad@consciouscounsel.ca" className="text-teal-600 underline">Email us here</Link> (chad@consciouscounsel.ca)
                        </Text>

                        <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
                            © 2025 Conscious Counsel. All rights reserved.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default WelcomeEmail;
