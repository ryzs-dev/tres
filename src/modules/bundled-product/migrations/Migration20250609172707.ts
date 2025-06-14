import { Migration } from "@mikro-orm/migrations";

export class Migration20250609172707 extends Migration {
  override async up(): Promise<void> {
    // Drop the table completely first to avoid conflicts
    this.addSql(`drop table if exists "bundle_item" cascade;`);
    this.addSql(`drop table if exists "bundle" cascade;`);

    // Create bundle table with all columns
    this.addSql(
      `create table "bundle" ("id" text not null, "title" text not null, "handle" text not null, "description" text null, "is_active" boolean not null default true, "min_items" integer not null default 1, "max_items" integer null, "selection_type" text check ("selection_type" in ('flexible', 'required_all')) not null default 'flexible', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "bundle_pkey" primary key ("id"));`
    );

    // Create indexes after table is created
    this.addSql(
      `CREATE UNIQUE INDEX "IDX_bundle_handle_unique" ON "bundle" (handle) WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX "IDX_bundle_deleted_at" ON "bundle" (deleted_at) WHERE deleted_at IS NULL;`
    );

    // Create bundle_item table
    this.addSql(
      `create table "bundle_item" ("id" text not null, "quantity" integer not null default 1, "is_optional" boolean not null default true, "sort_order" integer not null default 0, "bundle_id" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "bundle_item_pkey" primary key ("id"));`
    );

    // Create indexes for bundle_item
    this.addSql(
      `CREATE INDEX "IDX_bundle_item_bundle_id" ON "bundle_item" (bundle_id) WHERE deleted_at IS NULL;`
    );
    this.addSql(
      `CREATE INDEX "IDX_bundle_item_deleted_at" ON "bundle_item" (deleted_at) WHERE deleted_at IS NULL;`
    );

    // Add foreign key constraint
    this.addSql(
      `alter table "bundle_item" add constraint "bundle_item_bundle_id_foreign" foreign key ("bundle_id") references "bundle" ("id") on update cascade;`
    );
  }

  override async down(): Promise<void> {
    this.addSql(
      `alter table if exists "bundle_item" drop constraint if exists "bundle_item_bundle_id_foreign";`
    );
    this.addSql(`drop table if exists "bundle" cascade;`);
    this.addSql(`drop table if exists "bundle_item" cascade;`);
  }
}
