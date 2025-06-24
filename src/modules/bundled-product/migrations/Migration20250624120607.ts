import { Migration } from '@mikro-orm/migrations';

export class Migration20250624120607 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "bundle" add column if not exists "description" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bundle" drop column if exists "description";`);
  }

}
