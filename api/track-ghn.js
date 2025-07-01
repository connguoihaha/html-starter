export default async function handler(req, res) {
  const { ghn_code } = req.query;

  if (!ghn_code) {
    return res.status(400).json({ error: 'Thiếu mã vận đơn GHN' });
  }

  try {
    const response = await fetch('https://fe-online-gateway.ghn.vn/order-tracking/public-api/client/tracking-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0', // Thêm để tránh bị chặn
        'Accept': 'application/json' // An toàn hơn
      },
      body: JSON.stringify({ order_code: ghn_code })
    });

    const data = await response.json();

    // Trả về kể cả khi logs rỗng
    if (!data || typeof data !== 'object') {
      return res.status(502).json({ error: 'Phản hồi không hợp lệ từ GHN' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    console.error('Lỗi proxy GHN:', error);
    res.status(500).json({ error: 'Lỗi proxy GHN' });
  }
}
