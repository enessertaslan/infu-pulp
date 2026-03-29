import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function GET() {
  const items = await prisma.influencer.findMany({
    include: { extraCampaigns: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    name,
    link,
    channel,
    geo,
    lang,
    followers,
    campaign,
    avgviews,
    erpost,
    vrpost,
    erview,
    price1,
    price3,
    price5,
    extraCampaigns,
  } = body;

  const created = await prisma.influencer.create({
    data: {
      name,
      link,
      channel,
      geo,
      lang,
      followers: followers ? Number(followers) : null,
      campaign,
      avgviews: avgviews ? Number(avgviews) : null,
      erpost: erpost ? Number(erpost) : null,
      vrpost: vrpost ? Number(vrpost) : null,
      erview: erview ? Number(erview) : null,
      price1: price1 ? Number(price1) : null,
      price3: price3 ? Number(price3) : null,
      price5: price5 ? Number(price5) : null,
    },
  });

  if (Array.isArray(extraCampaigns) && extraCampaigns.length) {
    await prisma.extraCampaign.createMany({
      data: extraCampaigns.map((c: any) => ({ name: c.name, price: c.price ? Number(c.price) : null, influencerId: created.id })),
    });
  }

  const withExtras = await prisma.influencer.findUnique({ where: { id: created.id }, include: { extraCampaigns: true } });
  return NextResponse.json(withExtras);
}
