import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const prediction = await prisma.prediction.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!prediction) {
    return NextResponse.json({ error: "Prediction not found." }, { status: 404 });
  }

  return NextResponse.json(prediction);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const prediction = await prisma.prediction.findFirst({
    where: {
      id,
      userId: user.id,
    },
    select: { id: true },
  });

  if (!prediction) {
    return NextResponse.json({ error: "Prediction not found." }, { status: 404 });
  }

  await prisma.prediction.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}