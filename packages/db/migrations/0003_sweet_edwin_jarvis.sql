ALTER TABLE "requests" ADD COLUMN "title" varchar(255) NOT NULL DEFAULT 'Untitled';
ALTER TABLE "requests" ALTER COLUMN "title" DROP DEFAULT;
