import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Heading,
  Text,
} from "@react-email/components";

type NewUserEmailProps = {
  user: {
    first_name?: string;
    email: string;
  };
};

export function newUserEmail({ user }: NewUserEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Medusa!</Preview>
      <Body>
        <Container>
          <Heading>Welcome, {user.first_name || user.email}!</Heading>
          <Text>
            Thank you for signing up. We're excited to have you on board.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
