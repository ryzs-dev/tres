import { Migration } from '@mikro-orm/migrations';

export class Migration20250615111940 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "bundle" alter column "discount_2_items" drop default;`);
    this.addSql(`alter table if exists "bundle" alter column "discount_2_items" type integer using ("discount_2_items"::integer);`);
    this.addSql(`alter table if exists "bundle" alter column "discount_3_items" drop default;`);
    this.addSql(`alter table if exists "bundle" alter column "discount_3_items" type integer using ("discount_3_items"::integer);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bundle" alter column "discount_2_items" type integer using ("discount_2_items"::integer);`);
    this.addSql(`alter table if exists "bundle" alter column "discount_2_items" set default 10;`);
    this.addSql(`alter table if exists "bundle" alter column "discount_3_items" type integer using ("discount_3_items"::integer);`);
    this.addSql(`alter table if exists "bundle" alter column "discount_3_items" set default 15;`);
  }

}
