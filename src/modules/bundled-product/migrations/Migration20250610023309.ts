import { Migration } from '@mikro-orm/migrations';

export class Migration20250610023309 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "bundle" add column if not exists "metadata" jsonb null;`);

    this.addSql(`alter table if exists "bundle_item" add column if not exists "metadata" jsonb null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bundle" drop column if exists "metadata";`);

    this.addSql(`alter table if exists "bundle_item" drop column if exists "metadata";`);
  }

}
