import { Migration } from '@mikro-orm/migrations';

export class Migration20250814092706 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "bundle" add column if not exists "discount_2_items_amount" integer null, add column if not exists "discount_3_items_amount" integer null, add column if not exists "discount_type" text not null default 'fixed';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bundle" drop column if exists "discount_2_items_amount", drop column if exists "discount_3_items_amount", drop column if exists "discount_type";`);
  }

}
