import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
  Img,
  Section,
  Button,
  Hr,
} from "@react-email/components";

type NewUserEmailProps = {
  user: {
    first_name?: string;
    email: string;
  };
  promoCode?: string;
  imageUrl?: string;
};

export function NewUserEmail({
  user,
  promoCode = "FIRSTORDER",
  imageUrl = "https://storage.tres.my/Hero_Image/DSCF2829.jpg",
}: NewUserEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Tres! Get 10% off your first order 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header Image */}
          <Section style={imageSection}>
            <Img
              src={imageUrl}
              alt="Welcome to Tres"
              width="100%"
              height="250"
              style={image}
            />
          </Section>

          {/* Welcome Heading */}
          <Section style={content}>
            <Heading style={heading}>
              Welcome to Tres, {user.first_name || "Friend"}! 👋
            </Heading>

            {/* Welcome Message */}
            <Text style={welcomeText}>
              We're absolutely thrilled to have you join our community! You've
              just taken the first step into an amazing shopping experience
              where quality meets convenience.
            </Text>

            <Text style={text}>
              As a special welcome gift, we'd like to offer you an exclusive
              discount on your first purchase:
            </Text>

            {/* Promo Code Section */}
            <Section style={promoSection}>
              <Text style={promoTitle}>Your Exclusive Promo Code:</Text>
              <Text style={promoCodeText}>{promoCode}</Text>
              <Text style={promoDescription}>
                Use this code at checkout to get <strong>10% off</strong> your
                first order!
              </Text>
            </Section>

            {/* Call to Action Button */}
            <Section style={buttonSection}>
              <Button style={button} href="https://tres.my/my/bundles">
                Start Shopping Now
              </Button>
            </Section>

            <Hr style={hr} />

            {/* Additional Information */}
            <Text style={text}>
              Here's what you can expect as a Tres member:
            </Text>
            <Text style={benefitsList}>
              • Exclusive access to new products and sales
              <br />
              • Fast and reliable shipping
              <br />
              • 24/7 customer support
              <br />• Easy returns and exchanges
            </Text>

            <Text style={text}>
              If you have any questions or need assistance, don't hesitate to
              reach out to our support team. We're here to help!
            </Text>

            <Text style={signature}>
              Happy shopping!
              <br />
              Tres
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const imageSection = {
  padding: "0",
};

const image = {
  borderRadius: "8px 8px 0 0",
  objectFit: "cover" as const,
  objectPosition: "50% 28%", // can be 'top', 'center', 'bottom', 'left', 'right' or percentages like '50% 20%'
};

const content = {
  padding: "0 48px",
};

const heading = {
  fontSize: "32px",
  lineHeight: "1.3",
  fontWeight: "700",
  color: "#484848",
  textAlign: "center" as const,
  margin: "32px 0 24px",
};

const welcomeText = {
  fontSize: "18px",
  lineHeight: "1.4",
  color: "#484848",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const text = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#484848",
  margin: "16px 0",
};

const promoSection = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "24px",
  margin: "32px 0",
  textAlign: "center" as const,
  border: "2px dashed #6366f1",
};

const promoTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#484848",
  margin: "0 0 12px",
};

const promoCodeText = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#6366f1",
  letterSpacing: "2px",
  margin: "8px 0 16px",
  fontFamily: "monospace",
};

const promoDescription = {
  fontSize: "16px",
  color: "#484848",
  margin: "0",
};

const buttonSection = {
  textAlign: "center" as const,
  margin: "32px 0 24px",
};

const button = {
  backgroundColor: "#6366f1",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "16px 32px",
  cursor: "pointer",
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "32px 0",
};

const benefitsList = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#484848",
  margin: "16px 0",
  paddingLeft: "16px",
};

const signature = {
  fontSize: "16px",
  lineHeight: "1.4",
  color: "#484848",
  textAlign: "center" as const,
  margin: "32px 0 16px",
  fontStyle: "italic",
};

// // @ts-ignore
// npm run dev:email
// export default () => (
//   <NewUserEmail user={{ first_name: "John", email: "john@example.com" }} />
// );
