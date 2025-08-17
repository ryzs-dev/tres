import { Migration } from '@mikro-orm/migrations';

export class Migration20250817140515 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "bundle" alter column "title" type text using ("title"::text);`);
    this.addSql(`alter table if exists "bundle" alter column "title" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "bundle" alter column "title" type text using ("title"::text);`);
    this.addSql(`alter table if exists "bundle" alter column "title" set not null;`);
  }

}
