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

interface ProfileCompletionReminderEmailProps {
    name?: string;
    profileLink?: string;
}

export const ProfileCompletionReminderEmail = ({
    name,
    profileLink = "https://cynthiaconcierge.com/wellness/dashboard/profile",
}: ProfileCompletionReminderEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Quick question about your business...</Preview>
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
                            Quick question about your business...
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hi {name || 'there'},
                        </Text>
                        
                        <Text className="text-black text-[14px] leading-[24px]">
                            We noticed you haven't finished setting up your business profile yet. Don't worry—completing it only takes about 2 minutes, and it unlocks personalized legal documents tailored specifically to your business.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            <strong>Here's what you'll get when you complete it:</strong>
                        </Text>

                        <Section className="my-[24px]">
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                <li style={{ marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>Personalized legal documents</strong> – Waivers, contracts, and policies customized with your business name and details
                                </li>
                                <li style={{ marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>Customized recommendations</strong> – Get document suggestions based on your specific business type and services
                                </li>
                                <li style={{ marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>Your legal health score</strong> – See how protected your business is and what to improve
                                </li>
                                <li style={{ marginBottom: '12px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    <strong>Access to your document vault</strong> – Store and manage all your legal documents in one place
                                </li>
                            </ul>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            <strong>Why it matters:</strong>
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            The more we know about your business, the better we can protect you. Your profile helps us generate documents with your business name, services, and details already filled in—saving you time and ensuring everything is accurate.
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-teal-500 rounded text-white text-[14px] font-semibold no-underline text-center px-6 py-3"
                                href={profileLink}
                            >
                                Complete My Business Profile
                            </Button>
                        </Section>

                        <Section className="bg-gray-50 rounded-lg p-[20px] my-[24px]">
                            <Text className="text-black text-[14px] font-semibold mb-[12px]">
                                💡 Quick tip:
                            </Text>
                            <Text className="text-black text-[14px] leading-[24px]">
                                Start with just your business name—you can add more details later. Even a basic profile unlocks document generation, so you can get started right away.
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

export default ProfileCompletionReminderEmail;

