import { NextResponse } from 'next/server';
import { buildExtraCampaignCreateManyData, buildInfluencerWriteData } from '../../../../lib/influencer-data';
import prisma from '../../../../lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const item = await prisma.influencer.findUnique({ where: { id }, include: { extraCampaigns: true } });
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await req.json();
  const data = buildInfluencerWriteData(body);

  if (!data.name || !data.channel) {
    return NextResponse.json({ error: 'name and channel required' }, { status: 400 });
  }

  await prisma.influencer.update({ where: { id }, data });
  // handle extraCampaigns updates simply by replacing
  if (Array.isArray(body.extraCampaigns)) {
    await prisma.extraCampaign.deleteMany({ where: { influencerId: id } });
    const extraCampaignData = buildExtraCampaignCreateManyData(body.extraCampaigns, id);
    if (extraCampaignData.length) {
      await prisma.extraCampaign.createMany({ data: extraCampaignData });
    }
  }
  const withExtras = await prisma.influencer.findUnique({ where: { id }, include: { extraCampaigns: true } });
  return NextResponse.json(withExtras);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  await prisma.extraCampaign.deleteMany({ where: { influencerId: id } });
  // Remove influencer from all lists by deleting join rows in the implicit join table
  await prisma.$executeRaw`DELETE FROM "_ListMembers" WHERE "A" = ${id}`.catch(() => {});
  await prisma.influencer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
