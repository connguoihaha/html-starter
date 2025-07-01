export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Phương thức không được hỗ trợ' });
  }

  const { order_code } = req.query;

  if (!order_code) {
    return res.status(400).json({ error: 'Thiếu mã vận đơn GHN' });
  }

  try {
    const response = await fetch('https://fe-online-gateway.ghn.vn/order-tracking/public-api/client/tracking-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ order_code })
    });

    const data = await response.json();

    if (!data || !data.data || !Array.isArray(data.data.logs)) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin đơn hàng GHN' });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(data);
  } catch (error) {
    console.error('Lỗi GHN proxy:', error);
    res.status(500).json({ error: 'Lỗi máy chủ proxy GHN' });
  }
}
