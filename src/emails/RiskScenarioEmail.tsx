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

interface RiskScenarioEmailProps {
    name?: string;
    businessType?: string;
    hasPhysicalMovement?: boolean;
    hostsRetreats?: boolean;
    hiresStaff?: boolean;
    collectsOnline?: boolean;
    dashboardLink?: string;
    calendlyLink?: string;
}

export const RiskScenarioEmail = ({
    name,
    businessType = "wellness business",
    hasPhysicalMovement = false,
    hostsRetreats = false,
    hiresStaff = false,
    collectsOnline = false,
    dashboardLink = "https://free.consciouscounsel.ca/wellness/dashboard",
    calendlyLink = "https://calendly.com/chad-consciouscounsel/connection-call-with-chad",
}: RiskScenarioEmailProps) => {
    // Extract first name from full name if available
    const getFirstName = () => {
        if (!name) return 'there';
        const firstName = name.trim().split(' ')[0];
        return firstName || 'there';
    };

    const firstName = getFirstName();

    // Select relevant scenario based on business type
    const getScenario = () => {
        if (hostsRetreats) {
            return {
                title: "What happens if a client gets injured at your retreat?",
                scenario: `Imagine you're hosting a wellness retreat in Costa Rica. During a morning yoga session, a participant slips on a wet mat and breaks their wrist. They're upset, in pain, and now they're threatening to sue you for medical expenses, lost wages, and "emotional distress."`,
                costs: [
                    "Medical expenses: $15,000-$30,000",
                    "Legal fees to defend yourself: $50,000-$100,000",
                    "Potential settlement: $25,000-$75,000",
                    "Travel insurance may not cover it if you don't have proper waivers",
                ],
                protection: [
                    "A proper liability waiver signed before the retreat",
                    "Terms of service that clearly outline risks",
                    "Travel insurance verification",
                    "Emergency contact forms",
                ],
            };
        }
        if (hasPhysicalMovement) {
            return {
                title: "What happens if a client gets injured during class?",
                scenario: `A client at your business claims they were injured during a session. They say you didn't warn them about the risks, and now they're demanding compensation for medical bills, lost income, and pain and suffering.`,
                costs: [
                    "Medical expenses: $10,000-$50,000",
                    "Legal defense costs: $40,000-$120,000",
                    "Potential settlement: $20,000-$100,000",
                    "Business interruption and reputation damage",
                ],
                protection: [
                    "A liability waiver signed before each session",
                    "Clear terms of service outlining risks",
                    "Proper insurance coverage",
                    "Incident documentation procedures",
                ],
            };
        }
        if (collectsOnline) {
            return {
                title: "What happens if a client disputes a charge?",
                scenario: `A client books an online course through your business, completes it, then disputes the charge with their credit card company. They claim the course wasn't as described, and now you're facing a chargeback plus potential legal action.`,
                costs: [
                    "Chargeback fees: $25-$100 per dispute",
                    "Lost revenue from refunded course",
                    "Legal fees if they escalate: $5,000-$25,000",
                    "Damage to your payment processor relationship",
                ],
                protection: [
                    "Clear terms of service and refund policy",
                    "Detailed course descriptions",
                    "Purchase agreements",
                    "Privacy policy for data collection",
                ],
            };
        }
        // Default scenario
        return {
            title: "What happens if something goes wrong?",
            scenario: `Imagine a situation where a client is unhappy with your services. They feel they didn't get what they paid for, or something didn't go as expected. Without proper legal protection, you could be vulnerable.`,
            costs: [
                "Legal fees: $5,000-$50,000",
                "Potential settlements or refunds",
                "Time and stress dealing with disputes",
                "Damage to your business reputation",
            ],
            protection: [
                "Clear terms of service",
                "Proper contracts and agreements",
                "Privacy policy (if you collect data)",
                "Refund and cancellation policies",
            ],
        };
    };

    const scenario = getScenario();

    return (
        <Html>
            <Head />
            <Preview>{scenario.title}</Preview>
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

                        <Heading className="text-black text-[22px] font-bold p-0 my-[30px] mx-0">
                            {scenario.title}
                        </Heading>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Hi {firstName},
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            I want to share a scenario that could happen to any {businessType} owner—including you.
                        </Text>

                        {/* Scenario */}
                        <Text className="text-black text-[14px] leading-[24px] mt-[24px]">
                            {scenario.scenario}
                        </Text>

                        {/* Costs Section */}
                        <Text className="text-black text-[14px] font-bold mt-[24px] mb-[12px]">
                            What this could cost you:
                        </Text>
                        <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px' }}>
                            {scenario.costs.map((cost, index) => (
                                <li key={index} style={{ marginBottom: '6px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    {cost}
                                </li>
                            ))}
                        </ul>
                        <Text className="text-black text-[14px] leading-[24px] mb-[24px]">
                            <strong>Total potential cost:</strong> $50,000–$200,000+ (even if you're not at fault)
                        </Text>

                        {/* Protection Section */}
                        <Text className="text-black text-[14px] font-bold mt-[24px] mb-[12px]">
                            How to protect yourself:
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px] mb-[12px]">
                            With the right legal documents, you can:
                        </Text>
                        <ul style={{ margin: '0 0 16px 0', paddingLeft: '20px' }}>
                            {scenario.protection.map((item, index) => (
                                <li key={index} style={{ marginBottom: '6px', color: '#1f2937', fontSize: '14px', lineHeight: '1.6' }}>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Text className="text-black text-[14px] leading-[24px] mb-[24px]">
                            <strong style={{ color: '#059669' }}>Cost to get protected: $0</strong> (we provide free templates)
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            The scary part? This scenario happens to wellness businesses every single day. The good news? It's completely preventable with proper legal protection.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Don't wait until something goes wrong. Get protected now—before you need it.
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
                                Or <Link href={calendlyLink} className="text-teal-600 no-underline">book a free call</Link> to discuss your specific risks
                            </Text>
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px] mt-[24px]">
                            The scary part? This scenario happens to wellness businesses every single day. The good news? It's completely preventable with proper legal protection.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px]">
                            Don't wait until something goes wrong. Get protected now—before you need it.
                        </Text>

                        <Text className="text-black text-[14px] leading-[24px] mt-[24px]">
                            I'm here to help you protect your business. Let's make sure you're covered.
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

export default RiskScenarioEmail;


