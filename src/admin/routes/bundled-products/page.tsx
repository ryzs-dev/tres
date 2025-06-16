import { defineRouteConfig } from "@medusajs/admin-sdk";
import {
  CubeSolid,
  Trash,
  EllipsisHorizontal,
  PencilSquare,
} from "@medusajs/icons";
import {
  Container,
  Heading,
  DataTable,
  useDataTable,
  createDataTableColumnHelper,
  DataTablePaginationState,
  Badge,
  DropdownMenu,
  IconButton,
  usePrompt,
  toast,
  Text,
  Button,
} from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { sdk } from "../../lib/sdk";
import { Link } from "react-router-dom";
import { CreateFlexibleBundle } from "../../components/create-flexible-bundle";

type FlexibleBundle = {
  id: string;
  title: string;
  handle?: string;
  description?: string;
  is_active: boolean;
  min_items: number;
  max_items?: number | null;
  selection_type: "flexible" | "required_all";
  discount_2_items?: number | null;
  discount_3_items?: number | null;
  items?: {
    id: string;
    product: {
      id: string;
      title: string;
    };
    quantity: number;
    is_optional: boolean;
    sort_order: number;
  }[];
  created_at: Date | string;
  updated_at: Date | string;
};

const BundleActionsCell = ({ bundle }: { bundle: FlexibleBundle }) => {
  const queryClient = useQueryClient();
  const prompt = usePrompt();

  const { mutateAsync: deleteBundle, isPending: isDeleting } = useMutation({
    mutationFn: async (bundleId: string) => {
      await sdk.client.fetch(`/admin/bundled-products/${bundleId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flexible-bundles"] });
      toast.success("Bundle deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting bundle:", error);
      toast.error("Failed to delete bundle");
    },
  });

  const handleDelete = async () => {
    try {
      const confirmed = await prompt({
        title: "Delete Bundle",
        description: `Are you sure you want to delete "${bundle.title}"? This action cannot be undone.`,
        confirmText: "Delete",
        cancelText: "Cancel",
        variant: "danger",
      });

      if (confirmed) {
        await deleteBundle(bundle.id);
      }
    } catch (error) {
      console.error("Error in delete confirmation:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <IconButton variant="transparent" className="text-ui-fg-muted">
          <EllipsisHorizontal />
        </IconButton>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end">
        <DropdownMenu.Item className="gap-x-2">
          <PencilSquare className="text-ui-fg-subtle" />
          Edit Bundle
        </DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item
          className="gap-x-2 text-ui-fg-error"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash className="text-ui-fg-error" />
          {isDeleting ? "Deleting..." : "Delete Bundle"}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
};

const columnHelper = createDataTableColumnHelper<FlexibleBundle>();

const columns = [
  columnHelper.accessor("title", {
    header: "Bundle",
    cell: ({ row }) => {
      const bundle = row.original;
      return (
        <div className="flex flex-col gap-1">
          <div className="font-medium text-ui-fg-base">
            {bundle.title || "Untitled"}
          </div>
          {bundle.handle && (
            <div className="text-sm text-ui-fg-muted">/{bundle.handle}</div>
          )}
          {bundle.description && (
            <div className="text-xs text-ui-fg-subtle line-clamp-2 max-w-xs">
              {bundle.description}
            </div>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("selection_type", {
    header: "Type",
    cell: ({ row }) => {
      const selectionType = row.original.selection_type || "flexible";
      return (
        <Badge
          size="small"
          color={selectionType === "flexible" ? "green" : "blue"}
        >
          {selectionType === "flexible" ? "Flexible" : "Required All"}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("min_items", {
    header: "Rules",
    cell: ({ row }) => {
      const bundle = row.original;
      return (
        <div className="text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-ui-fg-muted">Min:</span>
            <span className="font-medium">{bundle.min_items || 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-ui-fg-muted">Max:</span>
            <span className="font-medium">
              {bundle.max_items || "No limit"}
            </span>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("discount_2_items", {
    header: "Discounts",
    cell: ({ row }) => {
      const bundle = row.original;
      const has2ItemDiscount = bundle.discount_2_items;
      const has3ItemDiscount = bundle.discount_3_items;

      // Safe check for discount values
      const hasValidDiscounts =
        (typeof has2ItemDiscount === "number" && has2ItemDiscount !== null) ||
        (typeof has3ItemDiscount === "number" && has3ItemDiscount !== null);

      if (!hasValidDiscounts) {
        return (
          <div className="text-sm text-ui-fg-muted">
            No discounts configured
          </div>
        );
      }

      return (
        <div className="space-y-1">
          {typeof has2ItemDiscount === "number" &&
            has2ItemDiscount !== null && (
              <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                2 items: {has2ItemDiscount}% off
              </div>
            )}
          {typeof has3ItemDiscount === "number" &&
            has3ItemDiscount !== null && (
              <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                3+ items: {has3ItemDiscount}% off
              </div>
            )}
        </div>
      );
    },
  }),
  columnHelper.accessor("items", {
    header: "Products",
    cell: ({ row }) => {
      const items = row.original.items || [];

      if (!Array.isArray(items) || items.length === 0) {
        return (
          <div className="text-sm text-ui-fg-muted">No products configured</div>
        );
      }

      return (
        <div className="space-y-1 max-w-xs">
          {items
            .slice(0, 2)
            .map((item) => {
              if (!item || !item.product) return null;

              return (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <Link
                    to={`/products/${item.product.id}`}
                    className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover truncate"
                  >
                    {item.product.title || "Unknown Product"}
                  </Link>
                  <span className="text-ui-fg-muted shrink-0">
                    ×{item.quantity || 1}
                  </span>
                  {item.is_optional && (
                    <Badge size="small" color="grey">
                      optional
                    </Badge>
                  )}
                </div>
              );
            })
            .filter(Boolean)}

          {items.length > 2 && (
            <div className="text-xs text-ui-fg-muted">
              +{items.length - 2} more products
            </div>
          )}
          <div className="text-xs text-ui-fg-subtle">
            {items.length} total products
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor("is_active", {
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.original.is_active ?? true;
      return (
        <Badge size="small" color={isActive ? "green" : "red"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  }),
  columnHelper.display({
    id: "actions",
    header: "",
    cell: ({ row }) => <BundleActionsCell bundle={row.original} />,
  }),
];

const limit = 15;

const BundledProductsPage = () => {
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: limit,
    pageIndex: 0,
  });

  const offset = useMemo(() => {
    return pagination.pageIndex * limit;
  }, [pagination]);

  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["flexible-bundles", offset, limit],
    queryFn: async () => {
      try {
        type ResponseType = {
          flexible_bundles?: FlexibleBundle[];
          count?: number;
        };

        const response: ResponseType = await sdk.client.fetch(
          "/admin/bundled-products",
          {
            method: "GET",
            query: {
              limit: limit.toString(),
              offset: offset.toString(),
            },
          }
        );

        // Safely extract data
        const bundles = response?.flexible_bundles || [];
        const count = response?.count || 0;

        console.log(`✅ Fetched ${bundles.length} bundles successfully`);

        return {
          flexible_bundles: Array.isArray(bundles) ? bundles : [],
          count: typeof count === "number" ? count : 0,
        };
      } catch (error) {
        console.error("❌ Error fetching bundles:", error);
        throw error;
      }
    },
    staleTime: 30 * 1000,
    retry: 2,
  });

  const table = useDataTable({
    columns,
    data: data?.flexible_bundles ?? [],
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    rowCount: data?.count ?? 0,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["flexible-bundles"] });
    refetch();
  };

  if (error) {
    return (
      <Container className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <Text className="text-ui-fg-error mb-2">
            Failed to load flexible bundles
          </Text>
          <Text className="text-ui-fg-muted text-sm">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </Text>
          <Button onClick={handleRefresh} variant="secondary">
            Try Again
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-start justify-between gap-4 p-6 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <CubeSolid className="text-ui-fg-muted" />
              <Heading level="h1" className="text-ui-fg-base">
                Flexible Bundles
              </Heading>
            </div>
            <Text className="text-ui-fg-muted">
              Create bundles where customers can select individual products with
              automatic discounts
            </Text>
            {data && (
              <Text className="text-sm text-ui-fg-subtle">
                {data.count} total bundles
              </Text>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="small" variant="secondary" onClick={handleRefresh}>
              Refresh
            </Button>
            <CreateFlexibleBundle />
          </div>
        </DataTable.Toolbar>

        {/* Empty State */}
        {!isLoading &&
          (!data?.flexible_bundles || data.flexible_bundles.length === 0) && (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-ui-bg-subtle rounded-full flex items-center justify-center mx-auto">
                  <CubeSolid className="text-ui-fg-muted w-8 h-8" />
                </div>
                <div>
                  <Heading level="h3" className="text-ui-fg-base mb-1">
                    No flexible bundles yet
                  </Heading>
                  <Text className="text-ui-fg-muted text-sm">
                    Create your first flexible bundle to get started
                  </Text>
                </div>
                <CreateFlexibleBundle />
              </div>
            </div>
          )}

        {/* Data Table */}
        {data?.flexible_bundles && data.flexible_bundles.length > 0 && (
          <>
            <DataTable.Table />
            <DataTable.Pagination />
          </>
        )}
      </DataTable>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Flexible Bundles",
  icon: CubeSolid,
});

export default BundledProductsPage;
