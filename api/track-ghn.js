export default async function handler(req, res) {
  const { ghn_code } = req.query;

  if (!ghn_code) {
    return res.status(400).json({ error: 'Thiếu mã vận đơn GHN' });
  }

  try {
    const response = await fetch('https://fe-online-gateway.ghn.vn/order-tracking/public-api/client/tracking-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ order_code: ghn_code })
    });

    const data = await response.json();

    // ✅ Kiểm tra dữ liệu hợp lệ
    if (!data || !data.data || !Array.isArray(data.data.logs)) {
      return res.status(404).json({ error: 'Không tìm thấy mã vận đơn GHN' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    console.error('Lỗi proxy GHN:', error);
    res.status(500).json({ error: 'Lỗi proxy GHN' });
  }
}
