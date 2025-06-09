import { defineRouteConfig } from "@medusajs/admin-sdk";
import { CubeSolid } from "@medusajs/icons";
import {
  Container,
  Heading,
  DataTable,
  useDataTable,
  createDataTableColumnHelper,
} from "@medusajs/ui";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { sdk } from "../../lib/sdk";
import { CreateBundle } from "../../components/create-bundle";

type Bundle = {
  id: string;
  title: string;
  bundle_type: string;
  items_to_pick?: number;
  pricing_type: string;
  is_active: boolean;
  items: Array<{
    id: string;
    product: {
      title: string;
    };
  }>;
};

const columnHelper = createDataTableColumnHelper<Bundle>();

const columns = [
  columnHelper.accessor("title", {
    header: "Bundle Name",
  }),
  columnHelper.accessor("bundle_type", {
    header: "Type",
    cell: ({ row }) => {
      const type = row.original.bundle_type;
      const itemsToPick = row.original.items_to_pick;

      switch (type) {
        case "fixed":
          return "Fixed Bundle";
        case "pick_any":
          return "Pick Any";
        case "pick_x_from_y":
          return `Pick ${itemsToPick} from ${row.original.items.length}`;
        default:
          return type;
      }
    },
  }),
  columnHelper.accessor("pricing_type", {
    header: "Pricing",
    cell: ({ row }) => {
      switch (row.original.pricing_type) {
        case "sum_prices":
          return "Sum Prices";
        case "fixed_price":
          return "Fixed Price";
        case "percentage_off":
          return "Percentage Off";
        default:
          return row.original.pricing_type;
      }
    },
  }),
  columnHelper.accessor("items", {
    header: "Items",
    cell: ({ row }) => `${row.original.items.length} products`,
  }),
  columnHelper.accessor("is_active", {
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded text-xs ${
          row.original.is_active
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-700"
        }`}
      >
        {row.original.is_active ? "Active" : "Inactive"}
      </span>
    ),
  }),
];

const BundlesPage = () => {
  const [pagination, setPagination] = useState({
    pageSize: 15,
    pageIndex: 0,
  });

  const { data, isLoading } = useQuery<{
    bundles: Bundle[];
    count: number;
  }>({
    queryKey: ["bundles", pagination],
    queryFn: () =>
      sdk.client.fetch("/admin/bundles", {
        method: "GET",
        query: {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
        },
      }),
  });

  const table = useDataTable({
    columns,
    data: data?.bundles ?? [],
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    rowCount: data?.count ?? 0,
  });

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex items-start justify-between gap-2 md:flex-row md:items-center">
          <Heading>Bundle Management</Heading>
          <CreateBundle />
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Bundles",
  icon: CubeSolid,
});

export default BundlesPage;
