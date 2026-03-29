import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const list = await prisma.list.findUnique({ where: { id }, include: { members: true } });
  if (!list) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(list);
}

export async function PUT(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await req.json();
  // body may contain members: string[]
  const data: any = {};
  if (body.name) data.name = body.name;
  if (Array.isArray(body.members)) {
    // set members relation
    data.members = { set: body.members.map((m: string) => ({ id: m })) };
  }
  const updated = await prisma.list.update({ where: { id }, data, include: { members: true } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.list.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
