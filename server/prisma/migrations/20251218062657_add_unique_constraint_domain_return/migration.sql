/*
  Warnings:

  - A unique constraint covering the columns `[DomainID,ConfigurationName,ReturnMethodID]` on the table `DomainReturn` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DomainReturn_DomainID_ConfigurationName_ReturnMethodID_key" ON "DomainReturn"("DomainID", "ConfigurationName", "ReturnMethodID");
