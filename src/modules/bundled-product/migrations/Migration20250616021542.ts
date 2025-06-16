import { Migration } from '@mikro-orm/migrations';

export class Migration20250616021542 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "bundle_item" add column if not exists "product_id" text not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bundle_item" drop column if exists "product_id";`);
  }

}
