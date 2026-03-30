type InfluencerBody = Record<string, unknown>;

const toRequiredString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const toNullableString = (value: unknown) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const toNullableNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const buildInfluencerWriteData = (body: InfluencerBody) => ({
  name: toRequiredString(body.name),
  link: toNullableString(body.link),
  channel: toRequiredString(body.channel),
  geo: toNullableString(body.geo),
  lang: toNullableString(body.lang),
  followers: toNullableNumber(body.followers),
  campaign: toNullableString(body.campaign),
  avgviews: toNullableNumber(body.avgviews),
  erpost: toNullableNumber(body.erpost),
  vrpost: toNullableNumber(body.vrpost),
  erview: toNullableNumber(body.erview),
  price1: toNullableNumber(body.price1),
  price3: toNullableNumber(body.price3),
  price5: toNullableNumber(body.price5),
});

export const buildExtraCampaignCreateManyData = (value: unknown, influencerId: string) => {
  if (!Array.isArray(value)) return [];

  return value.reduce<{ name: string; price: number | null; influencerId: string }[]>(
    (acc, item) => {
      if (!item || typeof item !== "object") return acc;

      const campaign = item as { name?: unknown; price?: unknown };
      if (typeof campaign.name !== "string") return acc;

      const name = campaign.name.trim();
      if (!name) return acc;

      acc.push({
        name,
        price: toNullableNumber(campaign.price),
        influencerId,
      });

      return acc;
    },
    [],
  );
};
