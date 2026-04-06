-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT,
    "meetingKey" INTEGER NOT NULL,
    "sessionKey" INTEGER,
    "year" INTEGER,
    "trackName" TEXT NOT NULL,
    "circuitKey" INTEGER,
    "sessionType" TEXT NOT NULL,
    "tireCompound" TEXT NOT NULL,
    "trackCondition" TEXT NOT NULL,
    "weatherMode" TEXT NOT NULL,
    "weatherPreset" TEXT,
    "airTemperature" DOUBLE PRECISION,
    "trackTemperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "rainfall" DOUBLE PRECISION,
    "windSpeed" DOUBLE PRECISION,
    "predictedLapTimeSeconds" DOUBLE PRECISION NOT NULL,
    "predictedLapTimeLow" DOUBLE PRECISION NOT NULL,
    "predictedLapTimeHigh" DOUBLE PRECISION NOT NULL,
    "explanation" TEXT NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
