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
} from "@medusajs/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { sdk } from "../../lib/sdk";
import { Link } from "react-router-dom";
import { CreateFlexibleBundle } from "../../components/create-flexible-bundle";

type FlexibleBundle = {
  id: string;
  title: string;
  handle: string;
  description?: string;
  is_active: boolean;
  min_items: number;
  max_items?: number;
  selection_type: "flexible" | "required_all";
  discount_2_items?: number;
  discount_3_items?: number;
  items: {
    id: string;
    product: {
      id: string;
      title: string;
    };
    quantity: number;
    is_optional: boolean;
    sort_order: number;
  }[];
  created_at: Date;
  updated_at: Date;
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
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <div className="font-medium text-ui-fg-base">{row.original.title}</div>
        <div className="text-sm text-ui-fg-muted">/{row.original.handle}</div>
        {row.original.description && (
          <div className="text-xs text-ui-fg-subtle line-clamp-2 max-w-xs">
            {row.original.description}
          </div>
        )}
      </div>
    ),
  }),
  columnHelper.accessor("selection_type", {
    header: "Type",
    cell: ({ row }) => (
      <Badge
        size="small"
        color={row.original.selection_type === "flexible" ? "green" : "blue"}
      >
        {row.original.selection_type === "flexible"
          ? "Flexible"
          : "Required All"}
      </Badge>
    ),
  }),
  columnHelper.accessor("min_items", {
    header: "Rules",
    cell: ({ row }) => (
      <div className="text-sm space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-ui-fg-muted">Min:</span>
          <span className="font-medium">{row.original.min_items}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-ui-fg-muted">Max:</span>
          <span className="font-medium">
            {row.original.max_items || "No limit"}
          </span>
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("discount_2_items", {
    header: "Discounts",
    cell: ({ row }) => {
      const has2ItemDiscount = row.original.discount_2_items;
      const has3ItemDiscount = row.original.discount_3_items;

      if (!has2ItemDiscount && !has3ItemDiscount) {
        return <div className="text-sm text-ui-fg-muted">No discounts</div>;
      }

      return (
        <div className="space-y-1">
          {has2ItemDiscount && (
            <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
              2 items: {has2ItemDiscount}% off
            </div>
          )}
          {has3ItemDiscount && (
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
    cell: ({ row }) => (
      <div className="space-y-1 max-w-xs">
        {row.original.items.slice(0, 2).map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-sm">
            <Link
              to={`/products/${item.product.id}`}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover truncate"
            >
              {item.product.title}
            </Link>
            <span className="text-ui-fg-muted shrink-0">×{item.quantity}</span>
            {item.is_optional && (
              <Badge size="small" color="grey">
                optional
              </Badge>
            )}
          </div>
        ))}
        {row.original.items.length > 2 && (
          <div className="text-xs text-ui-fg-muted">
            +{row.original.items.length - 2} more products
          </div>
        )}
        <div className="text-xs text-ui-fg-subtle">
          {row.original.items.length} total products
        </div>
      </div>
    ),
  }),
  columnHelper.accessor("is_active", {
    header: "Status",
    cell: ({ row }) => (
      <Badge size="small" color={row.original.is_active ? "green" : "red"}>
        {row.original.is_active ? "Active" : "Inactive"}
      </Badge>
    ),
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

  const { data, isLoading, error } = useQuery<{
    flexible_bundles: FlexibleBundle[];
    count: number;
  }>({
    queryKey: ["flexible-bundles", offset, limit],
    queryFn: () =>
      sdk.client.fetch("/admin/bundled-products", {
        method: "GET",
        query: {
          limit,
          offset,
        },
      }),
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

  if (error) {
    return (
      <Container className="flex items-center justify-center py-12">
        <div className="text-center">
          <Text className="text-ui-fg-error mb-2">
            Failed to load flexible bundles
          </Text>
          <Text className="text-ui-fg-muted text-sm">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </Text>
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
          <CreateFlexibleBundle />
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
