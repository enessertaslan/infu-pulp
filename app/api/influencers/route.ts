import { NextResponse } from 'next/server';
import { buildExtraCampaignCreateManyData, buildInfluencerWriteData } from '../../../lib/influencer-data';
import prisma from '../../../lib/prisma';

export async function GET() {
  const items = await prisma.influencer.findMany({
    include: { extraCampaigns: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = buildInfluencerWriteData(body);

  if (!data.name || !data.channel) {
    return NextResponse.json({ error: 'name and channel required' }, { status: 400 });
  }

  const created = await prisma.influencer.create({
    data,
  });

  const extraCampaignData = buildExtraCampaignCreateManyData(body.extraCampaigns, created.id);
  if (extraCampaignData.length) {
    await prisma.extraCampaign.createMany({
      data: extraCampaignData,
    });
  }

  const withExtras = await prisma.influencer.findUnique({ where: { id: created.id }, include: { extraCampaigns: true } });
  return NextResponse.json(withExtras);
}
