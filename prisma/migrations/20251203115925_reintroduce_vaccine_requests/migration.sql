-- DropForeignKey
ALTER TABLE "VaccineRequest" DROP CONSTRAINT "VaccineRequest_childId_fkey";

-- AddForeignKey
ALTER TABLE "VaccineRequest" ADD CONSTRAINT "VaccineRequest_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Children"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
