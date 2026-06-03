const ALLOWED_PRODUCTS = new Set([
  'VIIRS_SNPP_NRT',
  'VIIRS_NOAA20_NRT',
  'VIIRS_NOAA21_NRT',
]);

export default async function handler(req, res) {
  const { product, bbox, days } = req.query;

  if (!ALLOWED_PRODUCTS.has(product)) {
    return res.status(400).json({ error: 'Invalid product' });
  }

  const key = process.env.FIRMS_KEY || process.env.VITE_FIRMS_KEY;
  if (!key) {
    return res.status(500).json({ error: 'FIRMS API key not configured' });
  }

  const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${product}/${bbox}/${days}`;

  try {
    const upstream = await fetch(url);
    const text = await upstream.text();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600');
    res.status(upstream.status).send(text);
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch FIRMS data' });
  }
}
