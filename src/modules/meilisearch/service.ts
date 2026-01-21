const { Meilisearch } = require("meilisearch")
import { MedusaError } from "@medusajs/framework/utils"

type MeilisearchOptions = {
  host: string;
  apiKey: string;
  productIndexName: string;
}

export type MeilisearchIndexType = "product"

export default class MeilisearchModuleService {
  private client: typeof Meilisearch
  private options: MeilisearchOptions

  constructor({}, options: MeilisearchOptions) {
    if (!options.host || !options.apiKey || !options.productIndexName) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT, 
        "Meilisearch options are required"
      )
    }
    this.client = new Meilisearch({
      host: options.host,
      apiKey: options.apiKey,
    })
    this.options = options
  }

  async getIndexName(type: MeilisearchIndexType) {
    switch (type) {
      case "product":
        return this.options.productIndexName
      default:
        throw new Error(`Invalid index type: ${type}`)
    }
  }

  async indexData(data: Record<string, unknown>[], type: MeilisearchIndexType = "product") {
    const indexName = await this.getIndexName(type)
    const index = this.client.index(indexName)
    
    // Transform data to include id as primary key for Meilisearch
    const documents = data.map((item) => ({
      ...item,
      id: item.id,
    }))

    await index.addDocuments(documents)
  }

  async search(query: string, type: MeilisearchIndexType = "product") {
    const indexName = await this.getIndexName(type)
    const index = this.client.index(indexName)
    
    return await index.search(query)
  }

  async retrieveFromIndex(ids: string[], type: MeilisearchIndexType = "product") {
    const indexName = await this.getIndexName(type)
    const index = this.client.index(indexName)
    
    // Meilisearch allows getting documents by ID
    // We can use getDocuments with a filter or individual gets, but usually getDocuments with filter is best for batch
    // Or we can just try to fetch them. Meilisearch JS client has `getDocuments` with parameters.
    // However, specifically retrieving by IDs can be done via filter `id IN [...]`
    
    const results = await index.getDocuments({
      filter: `id IN [${ids.map(id => `'${id}'`).join(", ")}]`,
      limit: ids.length,
    })
    
    return results.results
  }

  async deleteFromIndex(ids: string[], type: MeilisearchIndexType = "product") {
    const indexName = await this.getIndexName(type)
    const index = this.client.index(indexName)
    
    return await index.deleteDocuments(ids)
  }

}