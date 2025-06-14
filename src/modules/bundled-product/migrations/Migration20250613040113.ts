import { Migration } from '@mikro-orm/migrations';

export class Migration20250613040113 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "bundle" drop constraint if exists "bundle_selection_type_check";`);

    this.addSql(`drop index if exists "IDX_bundle_handle_unique";`);
    this.addSql(`alter table if exists "bundle" drop column if exists "handle", drop column if exists "description", drop column if exists "metadata";`);

    this.addSql(`alter table if exists "bundle" add column if not exists "discount" integer null, add column if not exists "discount_2_items" integer null default 10, add column if not exists "discount_3_items" integer null default 15;`);
    this.addSql(`alter table if exists "bundle" alter column "min_items" type integer using ("min_items"::integer);`);
    this.addSql(`alter table if exists "bundle" alter column "min_items" drop not null;`);
    this.addSql(`alter table if exists "bundle" alter column "selection_type" type text using ("selection_type"::text);`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bundle" drop column if exists "discount", drop column if exists "discount_2_items", drop column if exists "discount_3_items";`);

    this.addSql(`alter table if exists "bundle" add column if not exists "handle" text not null, add column if not exists "description" text null, add column if not exists "metadata" jsonb null;`);
    this.addSql(`alter table if exists "bundle" alter column "min_items" type integer using ("min_items"::integer);`);
    this.addSql(`alter table if exists "bundle" alter column "min_items" set not null;`);
    this.addSql(`alter table if exists "bundle" add constraint "bundle_selection_type_check" check("selection_type" in ('flexible', 'required_all'));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_bundle_handle_unique" ON "bundle" (handle) WHERE deleted_at IS NULL;`);
  }

}
