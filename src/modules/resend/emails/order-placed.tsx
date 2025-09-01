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

  // Group items by bundle
  const groupedItems = order.items?.reduce(
    (acc, item) => {
      const isBundle = item.metadata?.is_from_bundle === true;

      if (isBundle) {
        const bundleId = item.metadata?.bundle_id as string;
        if (!acc.bundles[bundleId]) {
          acc.bundles[bundleId] = {
            bundle_id: bundleId,
            bundle_title: item.metadata?.bundle_title as string,
            items: [],
            total: 0,
          };
        }
        acc.bundles[bundleId].items.push(item);
        acc.bundles[bundleId].total +=
          typeof item.total === "number"
            ? item.total
            : parseFloat(item.total?.toString() || "0");
      } else {
        acc.individual.push(item);
      }

      return acc;
    },
    { bundles: {} as Record<string, any>, individual: [] as any[] }
  ) || { bundles: {}, individual: [] };

  return (
    <Html lang="en">
      <Container style={{ padding: "32px", fontFamily: "Arial, sans-serif" }}>
        <Heading style={{ fontSize: "24px", marginBottom: "12px" }}>
          Thank you for your order!
        </Heading>
        <Text style={{ fontSize: "14px", marginBottom: "24px" }}>
          Here's a summary of your purchase, <strong>{order.email}</strong>:
        </Text>

        {/* Render Bundle Items */}
        {Object.values(groupedItems.bundles).map((bundle: any) => (
          <Section
            key={bundle.bundle_id}
            style={{
              padding: "16px",
              borderTop: "1px solid #eaeaea",
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              marginBottom: "16px",
            }}
          >
            <Text
              style={{
                margin: "0 0 12px 0",
                fontWeight: "700",
                fontSize: "16px",
                color: "#333",
              }}
            >
              {bundle.bundle_title} (Bundle)
            </Text>

            {bundle.items.map((item: any) => (
              <Row key={item.id} style={{ marginBottom: "12px" }}>
                <Column style={{ width: "80px" }}>
                  <Img
                    src={item.thumbnail || "/images/placeholder.png"}
                    alt={item.product_title || "Product image"}
                    width="80"
                    height="auto"
                    style={{
                      borderRadius: "6px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </Column>
                <Column style={{ paddingLeft: "12px", verticalAlign: "top" }}>
                  <Text
                    style={{ margin: "0", fontWeight: "500", fontSize: "13px" }}
                  >
                    {item.product_title}
                  </Text>
                  {item.variant_title && (
                    <Text
                      style={{
                        margin: "2px 0 0 0",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      {item.variant_title}
                    </Text>
                  )}
                  <Text
                    style={{
                      margin: "4px 0 0",
                      fontSize: "12px",
                      color: "#888",
                    }}
                  >
                    Qty: {item.quantity}
                  </Text>
                </Column>
              </Row>
            ))}

            <Text
              style={{
                margin: "12px 0 0",
                fontSize: "15px",
                fontWeight: "600",
                textAlign: "right",
                color: "#333",
              }}
            >
              Bundle Total: {formatPrice(bundle.total)}
            </Text>
          </Section>
        ))}

        {/* Render Individual Items */}
        {groupedItems.individual.map((item) => (
          <Section
            key={item.id}
            style={{
              padding: "20px 0",
              borderTop: "1px solid #eaeaea",
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
                    margin: "4px 0 0",
                    fontSize: "13px",
                    color: "#888",
                  }}
                >
                  Qty: {item.quantity}
                </Text>
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

        <Section
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "2px solid #333",
          }}
        >
          <Text
            style={{
              fontSize: "16px",
              fontWeight: "700",
              textAlign: "right",
              margin: "0",
            }}
          >
            Order Total: {formatPrice(order.total)}
          </Text>
        </Section>
      </Container>
    </Html>
  );
}

export const orderPlacedEmail = (props: OrderPlacedEmailProps) => (
  <OrderPlacedEmailComponent {...props} />
);
