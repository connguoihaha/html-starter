export default async function handler(req, res) {
  const { spx_tn } = req.query;

  if (!spx_tn) {
    return res.status(400).json({ error: 'Thiếu mã vận đơn' });
  }

  try {
    const response = await fetch(`https://spx.vn/shipment/order/open/order/get_order_info?spx_tn=${spx_tn}&language_code=vi`);
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi proxy' });
  }
}
