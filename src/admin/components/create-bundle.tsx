import {
  Button,
  FocusModal,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  toast,
} from "@medusajs/ui";
import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { sdk } from "../lib/sdk";

export const CreateBundle = () => {
  const [open, setOpen] = useState(false);
  const [bundle, setBundle] = useState({
    title: "",
    description: "",
    bundle_type: "fixed",
    items_to_pick: null as number | null,
    pricing_type: "sum_prices",
    fixed_price: null as number | null,
    discount_percentage: null as number | null,
    is_active: true,
  });
  const [items, setItems] = useState<
    Array<{
      id: string;
      product_id: string;
      default_quantity: number;
      is_required: boolean;
      sort_order: number;
      custom_price: number | null;
      item_discount: number | null;
    }>
  >([]);

  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () => sdk.admin.product.list({ limit: 100 }),
  });

  const { mutateAsync: createBundle, isPending } = useMutation({
    mutationFn: async (data: any) => {
      return sdk.client.fetch("/admin/bundles", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      toast.success("Bundle created successfully");
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      setOpen(false);
      // Reset form
      setBundle({
        title: "",
        description: "",
        bundle_type: "fixed",
        items_to_pick: null,
        pricing_type: "sum_prices",
        fixed_price: null,
        discount_percentage: null,
        is_active: true,
      });
      setItems([]);
    },
    onError: () => {
      toast.error("Failed to create bundle");
    },
  });

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `temp_${Date.now()}`,
        product_id: "",
        default_quantity: 1,
        is_required: bundle.bundle_type === "fixed",
        sort_order: prev.length,
        custom_price: null,
        item_discount: null,
      },
    ]);
  };

  const handleSubmit = () => {
    createBundle({
      ...bundle,
      items: items.filter((item) => item.product_id), // Only include items with products selected
    });
  };

  return (
    <FocusModal open={open} onOpenChange={setOpen}>
      <FocusModal.Trigger asChild>
        <Button>Create Bundle</Button>
      </FocusModal.Trigger>
      <FocusModal.Content>
        <FocusModal.Header>
          <Heading>Create Bundle Configuration</Heading>
        </FocusModal.Header>
        <FocusModal.Body>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>Bundle Title</Label>
                <Input
                  value={bundle.title}
                  onChange={(e) =>
                    setBundle((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g., Custom Skincare Kit"
                />
              </div>

              <div>
                <Label>Description (Optional)</Label>
                <Input
                  value={bundle.description}
                  onChange={(e) =>
                    setBundle((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Brief description of the bundle"
                />
              </div>
            </div>

            {/* Bundle Type */}
            <div>
              <Label>Bundle Type</Label>
              <Select
                value={bundle.bundle_type}
                onValueChange={(value) =>
                  setBundle((prev) => ({ ...prev, bundle_type: value }))
                }
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="fixed">
                    Fixed Bundle - Customer gets all items
                  </Select.Item>
                  <Select.Item value="pick_any">
                    Pick Any - Customer chooses any items
                  </Select.Item>
                  <Select.Item value="pick_x_from_y">
                    Pick X from Y - Customer picks specific number
                  </Select.Item>
                </Select.Content>
              </Select>

              {bundle.bundle_type === "pick_x_from_y" && (
                <div className="mt-2">
                  <Label>Items Customer Must Pick</Label>
                  <Input
                    type="number"
                    value={bundle.items_to_pick || ""}
                    onChange={(e) =>
                      setBundle((prev) => ({
                        ...prev,
                        items_to_pick: parseInt(e.target.value) || null,
                      }))
                    }
                    placeholder="e.g., 3"
                  />
                </div>
              )}
            </div>

            {/* Pricing Strategy */}
            <div>
              <Label>Pricing Strategy</Label>
              <Select
                value={bundle.pricing_type}
                onValueChange={(value) =>
                  setBundle((prev) => ({ ...prev, pricing_type: value }))
                }
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="sum_prices">
                    Sum of Selected Item Prices
                  </Select.Item>
                  <Select.Item value="fixed_price">
                    Fixed Bundle Price
                  </Select.Item>
                  <Select.Item value="percentage_off">
                    Percentage Discount
                  </Select.Item>
                </Select.Content>
              </Select>

              {bundle.pricing_type === "fixed_price" && (
                <div className="mt-2">
                  <Label>Bundle Price ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bundle.fixed_price ? bundle.fixed_price / 100 : ""}
                    onChange={(e) =>
                      setBundle((prev) => ({
                        ...prev,
                        fixed_price: parseFloat(e.target.value) * 100 || null,
                      }))
                    }
                  />
                </div>
              )}

              {bundle.pricing_type === "percentage_off" && (
                <div className="mt-2">
                  <Label>Discount Percentage</Label>
                  <Input
                    type="number"
                    value={bundle.discount_percentage || ""}
                    onChange={(e) =>
                      setBundle((prev) => ({
                        ...prev,
                        discount_percentage: parseFloat(e.target.value) || null,
                      }))
                    }
                    placeholder="15"
                  />
                </div>
              )}
            </div>

            {/* Bundle Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label>Bundle Items</Label>
                <Button type="button" variant="secondary" onClick={addItem}>
                  Add Product
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border rounded p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Product</Label>
                        <Select
                          value={item.product_id}
                          onValueChange={(value) => {
                            setItems((prev) =>
                              prev.map((i, idx) =>
                                idx === index ? { ...i, product_id: value } : i
                              )
                            );
                          }}
                        >
                          <Select.Trigger>
                            <Select.Value placeholder="Select Product" />
                          </Select.Trigger>
                          <Select.Content>
                            {products?.products?.map((product) => (
                              <Select.Item key={product.id} value={product.id}>
                                {product.title}
                              </Select.Item>
                            ))}
                          </Select.Content>
                        </Select>
                      </div>

                      <div>
                        <Label>Default Quantity</Label>
                        <Input
                          type="number"
                          value={item.default_quantity}
                          onChange={(e) => {
                            setItems((prev) =>
                              prev.map((i, idx) =>
                                idx === index
                                  ? {
                                      ...i,
                                      default_quantity:
                                        parseInt(e.target.value) || 1,
                                    }
                                  : i
                              )
                            );
                          }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {bundle.bundle_type !== "fixed" && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={item.is_required}
                            onCheckedChange={(checked) => {
                              setItems((prev) =>
                                prev.map((i, idx) =>
                                  idx === index
                                    ? { ...i, is_required: checked }
                                    : i
                                )
                              );
                            }}
                          />
                          <Label>Required</Label>
                        </div>
                      )}

                      <div>
                        <Label>Custom Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={
                            item.custom_price ? item.custom_price / 100 : ""
                          }
                          onChange={(e) => {
                            setItems((prev) =>
                              prev.map((i, idx) =>
                                idx === index
                                  ? {
                                      ...i,
                                      custom_price: e.target.value
                                        ? parseFloat(e.target.value) * 100
                                        : null,
                                    }
                                  : i
                              )
                            );
                          }}
                          placeholder="Use product price"
                        />
                      </div>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setItems((prev) =>
                              prev.filter((_, idx) => idx !== index)
                            )
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div className="flex items-center space-x-2">
              <Switch
                checked={bundle.is_active}
                onCheckedChange={(checked) =>
                  setBundle((prev) => ({ ...prev, is_active: checked }))
                }
              />
              <Label>Active Bundle</Label>
            </div>
          </div>
        </FocusModal.Body>
        <FocusModal.Footer>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} isLoading={isPending}>
              Create Bundle
            </Button>
          </div>
        </FocusModal.Footer>
      </FocusModal.Content>
    </FocusModal>
  );
};
