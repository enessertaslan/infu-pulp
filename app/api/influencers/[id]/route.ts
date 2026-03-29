import { NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const item = await prisma.influencer.findUnique({ where: { id }, include: { extraCampaigns: true } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const updated = await prisma.influencer.update({ where: { id }, data: { ...body } });
  // handle extraCampaigns updates simply by replacing
  if (Array.isArray(body.extraCampaigns)) {
    await prisma.extraCampaign.deleteMany({ where: { influencerId: id } });
    if (body.extraCampaigns.length) {
      await prisma.extraCampaign.createMany({ data: body.extraCampaigns.map((c: any) => ({ name: c.name, price: c.price ? Number(c.price) : null, influencerId: id })) });
    }
  }
  const withExtras = await prisma.influencer.findUnique({ where: { id }, include: { extraCampaigns: true } });
  return NextResponse.json(withExtras);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  await prisma.extraCampaign.deleteMany({ where: { influencerId: id } });
  await prisma.list.updateMany({ where: {}, data: { members: { set: [] } } }).catch(() => {});
  await prisma.influencer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
