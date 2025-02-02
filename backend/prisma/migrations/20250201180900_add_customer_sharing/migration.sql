-- CreateTable
CREATE TABLE "_SharedCustomers" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_SharedCustomers_AB_unique" ON "_SharedCustomers"("A", "B");

-- CreateIndex
CREATE INDEX "_SharedCustomers_B_index" ON "_SharedCustomers"("B");

-- AddForeignKey
ALTER TABLE "_SharedCustomers" ADD CONSTRAINT "_SharedCustomers_A_fkey" FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SharedCustomers" ADD CONSTRAINT "_SharedCustomers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
