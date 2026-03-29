-- CreateTable
CREATE TABLE "Influencer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "link" TEXT,
    "channel" TEXT NOT NULL,
    "geo" TEXT,
    "lang" TEXT,
    "followers" INTEGER,
    "campaign" TEXT,
    "avgviews" INTEGER,
    "erpost" REAL,
    "vrpost" REAL,
    "erview" REAL,
    "price1" REAL,
    "price3" REAL,
    "price5" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "List" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ExtraCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "price" REAL,
    "influencerId" TEXT NOT NULL,
    CONSTRAINT "ExtraCampaign_influencerId_fkey" FOREIGN KEY ("influencerId") REFERENCES "Influencer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ListMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ListMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "Influencer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ListMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "List" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_ListMembers_AB_unique" ON "_ListMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_ListMembers_B_index" ON "_ListMembers"("B");
