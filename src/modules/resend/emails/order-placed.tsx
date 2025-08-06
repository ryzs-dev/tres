import {
  Text,
  Column,
  Container,
  Heading,
  Html,
  Img,
  Row,
  Section,
} from "@react-email/components";
import { BigNumberValue, OrderDTO } from "@medusajs/framework/types";

type OrderPlacedEmailProps = {
  order: OrderDTO;
};

function OrderPlacedEmailComponent({ order }: OrderPlacedEmailProps) {
  const formatter = new Intl.NumberFormat([], {
    style: "currency",
    currencyDisplay: "narrowSymbol",
    currency: order.currency_code,
  });

  const formatPrice = (price: BigNumberValue) => {
    if (typeof price === "number") return formatter.format(price);
    if (typeof price === "string") return formatter.format(parseFloat(price));
    return price?.toString() || "";
  };

  return (
    <Html lang="en">
      <Container style={{ padding: "32px", fontFamily: "Arial, sans-serif" }}>
        <Heading style={{ fontSize: "24px", marginBottom: "12px" }}>
          Thank you for your order!
        </Heading>
        <Text style={{ fontSize: "14px", marginBottom: "24px" }}>
          Here's a summary of your purchase, <strong>{order.email}</strong>:
        </Text>

        {order.items?.map((item) => (
          <Section
            key={item.id}
            style={{
              padding: "20px 0",
              borderTop: "1px solid #eaeaea",
              display: "flex",
            }}
          >
            <Row>
              <Column style={{ width: "100px" }}>
                <Img
                  src={item.thumbnail || "https://via.placeholder.com/100"}
                  alt={item.product_title || "Product image"}
                  width="100"
                  height="auto"
                  style={{
                    borderRadius: "8px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </Column>

              <Column style={{ paddingLeft: "16px", verticalAlign: "top" }}>
                <Text
                  style={{ margin: "0", fontWeight: "600", fontSize: "14px" }}
                >
                  {item.product_title}
                </Text>
                {item.variant_title && (
                  <Text
                    style={{
                      margin: "4px 0 0 0",
                      fontSize: "13px",
                      color: "#666",
                    }}
                  >
                    {item.variant_title}
                  </Text>
                )}
                <Text
                  style={{
                    margin: "8px 0 0",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  {formatPrice(item.total)}
                </Text>
              </Column>
            </Row>
          </Section>
        ))}
      </Container>
    </Html>
  );
}

export const orderPlacedEmail = (props: OrderPlacedEmailProps) => (
  <OrderPlacedEmailComponent {...props} />
);
