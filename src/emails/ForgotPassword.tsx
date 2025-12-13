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

interface ForgotPasswordEmailProps {
    resetLink?: string;
    userName?: string;
}

export const ForgotPasswordEmail = ({
    resetLink = "{{ .ConfirmationURL }}", // Default for Supabase template
    userName,
}: ForgotPasswordEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Reset your CC Legal password</Preview>
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
                        <Section className="mt-[32px]">
                            {/* Logo - Replace with actual URL if available, or use text */}
                            <Text className="text-black text-[24px] font-bold text-center p-0 my-0 mx-auto">
                                Conscious Counsel
                            </Text>
                        </Section>

                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Reset Your Password
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello{userName ? ` ${userName}` : ""},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            We received a request to reset the password for your Conscious Counsel account. If you didn't make this request, you can safely ignore this email.
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Otherwise, you can reset your password by clicking the button below:
                        </Text>

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-teal-500 rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={resetLink}
                            >
                                Reset Password
                            </Button>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px]">
                            or copy and paste this link into your browser:
                            <br />
                            <Link href={resetLink} className="text-teal-600 no-underline break-all">
                                {resetLink}
                            </Link>
                        </Text>

                        <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

                        <Text className="text-[#666666] text-[12px] leading-[24px] text-center">
                            © {new Date().getFullYear()} Conscious Counsel. All rights reserved.
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default ForgotPasswordEmail;
