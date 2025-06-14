// src/workflows/steps/delete-remote-links.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { BUNDLED_PRODUCT_MODULE } from "../../modules/bundled-product";
import { Modules } from "@medusajs/framework/utils";

type DeleteRemoteLinksStepInput = {
  bundle_id: string;
  bundle_item_ids: string[];
};

export const deleteRemoteLinksStep = createStep(
  "delete-remote-links",
  async (
    { bundle_id, bundle_item_ids }: DeleteRemoteLinksStepInput,
    { container }
  ) => {
    try {
      const remoteLink = container.resolve("remoteLink");

      let deletedLinks = 0;

      // Delete bundle item -> product links
      for (const itemId of bundle_item_ids) {
        try {
          const links = (await remoteLink.list(
            {
              [BUNDLED_PRODUCT_MODULE]: {
                bundle_item_id: itemId,
              },
            },
            {}
          )) as Array<{ id: string }>;

          if (links.length > 0) {
            await remoteLink.delete({
              [BUNDLED_PRODUCT_MODULE]: { ids: links.map((link) => link.id) },
            });
            deletedLinks += links.length;
            console.log(
              `Deleted ${links.length} links for bundle item ${itemId}`
            );
          }
        } catch (error) {
          console.warn(
            `Failed to delete links for bundle item ${itemId}:`,
            error
          );
          // Continue with other items even if one fails
        }
      }

      // Delete bundle -> product links
      try {
        const bundleLinks = (await remoteLink.list(
          {
            [BUNDLED_PRODUCT_MODULE]: {
              bundle_id: bundle_id,
            },
          },
          {}
        )) as Array<{ id: string }>;

        if (bundleLinks.length > 0) {
          await remoteLink.delete({
            [BUNDLED_PRODUCT_MODULE]: {
              ids: bundleLinks.map((link: { id: string }) => link.id),
            },
          });
          deletedLinks += bundleLinks.length;
          console.log(
            `Deleted ${bundleLinks.length} links for bundle ${bundle_id}`
          );
        }
      } catch (error) {
        console.warn(`Failed to delete links for bundle ${bundle_id}:`, error);
      }

      return new StepResponse({
        deleted_links: deletedLinks,
        bundle_id,
        bundle_item_ids,
      });
    } catch (error) {
      console.error("Error in deleteRemoteLinksStep:", error);
      // Don't fail the entire workflow if link deletion fails
      return new StepResponse({
        deleted_links: 0,
        bundle_id,
        bundle_item_ids,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
  async (data, { container }) => {
    // Compensation step - this is difficult to reverse since we've deleted the links
    console.warn(
      `Cannot restore deleted remote links for bundle: ${data?.bundle_id}`
    );
  }
);
