import { Migration } from '@mikro-orm/migrations';

export class Migration20250628132234 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "bundle_item" add column if not exists "optional" boolean not null default false;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bundle_item" drop column if exists "optional";`);
  }

}
