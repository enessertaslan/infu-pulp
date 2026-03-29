import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET() {
  const lists = await prisma.list.findMany({ include: { members: true }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(lists);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name } = body;
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
  const created = await prisma.list.create({ data: { name } });
  return NextResponse.json(created);
}
