import { Migration } from '@mikro-orm/migrations';

export class Migration20250823191310 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "promo_code" ("id" text not null, "code" text not null, "customer_id" text not null, "customer_email" text not null, "discount_type" text check ("discount_type" in ('percentage', 'fixed')) not null default 'percentage', "discount_value" integer not null, "is_used" boolean not null default false, "used_at" timestamptz null, "expires_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "promo_code_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_promo_code_deleted_at" ON "promo_code" (deleted_at) WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "promo_code" cascade;`);
  }

}
