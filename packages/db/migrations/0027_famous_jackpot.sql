ALTER TABLE "custom_field_definitions" ALTER COLUMN "transferable" DROP DEFAULT;
ALTER TABLE "custom_field_definitions" ALTER COLUMN "transferable" SET DATA TYPE boolean USING (transferable::int::boolean);
ALTER TABLE "custom_field_definitions" ALTER COLUMN "transferable" SET DEFAULT false;