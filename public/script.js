let isTracking = false;
let allRecords = [];
let isExpanded = false;
const INITIAL_ITEMS = 5;

function detectCarrier(code) {
  const ghnPattern = /^[A-Z0-9]{8}$/; // Ví dụ: GYLXD8TU
  const spxDomesticPattern = /^SPXVN/i;
  const spxInternationalPattern = /^VN\d{9,}[A-Z]?$/i; // Ví dụ: VN254978968829V

  if (ghnPattern.test(code)) return "ghn";
  if (spxDomesticPattern.test(code) || spxInternationalPattern.test(code)) return "spx";

  return "unknown";
}


function updateSteps(latestCode) {
    const statusMap = {
    "Preparing to ship": 1,
    "Chuẩn bị hàng": 1,
    "Chờ lấy hàng": 1,
    "In transit": 2,
    "Đang vận chuyển": 2,
    "Đang di chuyển": 2,
    "Out for delivery": 3,
    "Đang giao hàng": 3,
    "Giao hàng": 3,
    "Delivered": 4,
    "Đã giao hàng": 4,
    "Hoàn thành": 4
    };
    
    const currentStep = statusMap[latestCode] || 1;
    const progressWidth = ((currentStep - 1) / 3) * 100;
    
    // Update progress bar
    const progressElement = document.getElementById('stepProgress');
    if (progressElement) {
    progressElement.style.width = `${progressWidth}%`;
    }
    
    // Update step states
    for (let i = 1; i <= 4; i++) {
    const stepElement = document.getElementById(`step-${i}`);
    if (stepElement) {
        stepElement.classList.toggle("active", i <= currentStep);
    }
    }
}

function updateStepsGHN(statusName) {
  const statusMapGHN = {
    "Chờ lấy hàng": 1,
    "Đang lấy hàng": 1,
    "Lấy hàng thành công": 2,
    "Nhập bưu cục lấy": 2,
    "Đang phân loại hàng": 2,
    "Đang trung chuyển hàng": 2,
    "Sẵn sàng giao hàng": 3,
    "Đang giao hàng": 3,
    "Giao hàng thành công": 4
  };

  const step = statusMapGHN[statusName?.trim()] || 1;
  const progress = ((step - 1) / 3) * 100;

  const progressElement = document.getElementById('stepProgress');
  if (progressElement) progressElement.style.width = `${progress}%`;

  for (let i = 1; i <= 4; i++) {
    const stepEl = document.getElementById(`step-${i}`);
    if (stepEl) {
      stepEl.classList.toggle("active", i <= step);
    }
  }
}

function showContainer(containerId) {
    const element = document.getElementById(containerId);
    if (element) {
    element.classList.add('show');
    }
}


function clearResults() {
    ['stepContainer', 'timelineContainer', 'errorContainer'].forEach(id => {
    document.getElementById(id).classList.remove('show');
    });
    document.getElementById('trackingCode').focus();
    allRecords = [];
    isExpanded = false;
}

function setLoadingState(loading) {
    const btn = document.querySelector('.btn-track');
    const btnText = btn.querySelector('.btn-text');
    const trackingInput = document.getElementById('trackingCode');
    
    if (loading) {
    btn.disabled = true;
    trackingInput.disabled = true;
    btnText.innerHTML = '<span class="loading-dots">Đang tra cứu</span>';
    btn.classList.add('loading');
    } else {
    btn.disabled = false;
    trackingInput.disabled = false;
    btnText.innerHTML = 'Tra cứu ngay';
    btn.classList.remove('loading');
    }
}

function formatTimelineItem(record, index) {
    const date = new Date(record.actual_time * 1000);
    const formattedDate = date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
    });

    const isHidden = !isExpanded && index >= INITIAL_ITEMS;

    return `
    <li class="timeline-item ${isHidden ? 'hidden' : ''}">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
        <div class="timeline-description">
            ${record.buyer_description || record.description}
        </div>
        <div class="timeline-time">
            <i class="bi bi-calendar3 me-1"></i>
            ${formattedDate}
            <i class="bi bi-clock ms-2 me-1"></i>
            ${formattedTime}
        </div>
        </div>
    </li>
    `;
}

function updateTimelineStats(records) {
    const statsElement = document.getElementById('timelineStats');
    const statsText = document.getElementById('statsText');
    const totalTimeElement = document.getElementById('totalTime');

    if (records.length > 0) {
        const firstDate = new Date(records[records.length - 1].actual_time * 1000);
        const lastDate = new Date(records[0].actual_time * 1000);
        const diffTime = Math.abs(lastDate - firstDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // ✅ Dựa vào bước cuối cùng để biết đã giao hay chưa
        const lastStatus = (records[0]?.milestone_name || records[0]?.description || '').toLowerCase();
        const deliveredKeywords = ['đã giao hàng', 'hoàn thành', 'delivered', 'giao hàng thành công'];

        const isDelivered = deliveredKeywords.some(keyword =>
        lastStatus.includes(keyword)
        );

        statsText.textContent = `Tổng cộng ${records.length} cập nhật trạng thái`;

        if (isDelivered) {
        totalTimeElement.textContent = `Thời gian vận chuyển: ${diffDays} ngày`;
        } else {
        totalTimeElement.textContent = `Đang vận chuyển`;
        }

        statsElement.style.display = 'flex';
    }
}



function renderTimeline() {
    const timeline = document.getElementById('timeline');
    const showMoreContainer = document.getElementById('showMoreContainer');
    const showMoreText = document.getElementById('showMoreText');
    const showMoreIcon = document.querySelector('.btn-show-more i');
    
    timeline.innerHTML = allRecords.map((record, index) => 
    formatTimelineItem(record, index)
    ).join('');

    // Show/hide "show more" button
    if (allRecords.length > INITIAL_ITEMS) {
    showMoreContainer.classList.add('visible');
    if (isExpanded) {
        showMoreText.textContent = 'Ẩn bớt';
        showMoreIcon.className = 'bi bi-chevron-up me-2';
    } else {
        showMoreText.textContent = `Xem thêm (${allRecords.length - INITIAL_ITEMS})`;
        showMoreIcon.className = 'bi bi-chevron-down me-2';
    }
    } else {
    showMoreContainer.classList.remove('visible');
    }
}

function toggleTimeline() {
    isExpanded = !isExpanded;
    
    const hiddenItems = document.querySelectorAll('.timeline-item.hidden');
    const showMoreText = document.getElementById('showMoreText');
    const showMoreIcon = document.querySelector('.btn-show-more i');
    
    if (isExpanded) {
    // Show all items
    hiddenItems.forEach((item, index) => {
        setTimeout(() => {
        item.classList.remove('hidden');
        }, index * 100);
    });
    showMoreText.textContent = 'Ẩn bớt';
    showMoreIcon.className = 'bi bi-chevron-up me-2';
    } else {
    // Hide extra items
    const allItems = document.querySelectorAll('.timeline-item');
    allItems.forEach((item, index) => {
        if (index >= INITIAL_ITEMS) {
        item.classList.add('hidden');
        }
    });
    showMoreText.textContent = `Xem thêm (${allRecords.length - INITIAL_ITEMS})`;
    showMoreIcon.className = 'bi bi-chevron-down me-2';
    }
}

async function handleSPX(code) {
  const res = await fetch(`https://shopee-track.vercel.app/api/track?spx_tn=${code}`);
  const json = await res.json();
  const records = json?.data?.sls_tracking_info?.records || [];
  const container = document.getElementById('senderReceiverContainer');

  if (container) container.innerHTML = '';

  if (records.length === 0) throw new Error('Không tìm thấy đơn SPX');

  allRecords = records;
  isExpanded = false;
  showContainer('stepContainer');
  updateSteps(records[0].milestone_name || records[0].buyer_description || records[0].description);

  setTimeout(() => {
    showContainer('timelineContainer');
    updateTimelineStats(records);
    renderTimeline();
    renderCarrierInfo('spx');
  }, 300);
}

async function handleGHN(code) {
  const res = await fetch(`https://shopee-track.vercel.app/api/track-ghn?ghn_code=${code}`); // thay bằng API thật nếu có
  const json = await res.json();
  const data = json?.data;

  if (!data?.order_info || !data.tracking_logs) throw new Error('Không tìm thấy đơn GHN');

  allRecords = data.tracking_logs
    .map(log => ({
      description: log.status_name + ' - ' + log.location?.address,
      actual_time: new Date(log.action_at).getTime() / 1000
    }))
    .sort((a, b) => b.actual_time - a.actual_time); // Mới nhất đầu tiên

  isExpanded = false;

  showContainer('stepContainer');
  updateStepsGHN(data.order_info.status_name);

  setTimeout(() => {
    showContainer('timelineContainer');
    updateTimelineStats(allRecords);
    renderTimeline();
    renderSenderReceiver(data.order_info);
    renderCarrierInfo('ghn');
  }, 300);
}

function renderSenderReceiver(info) {
  const container = document.getElementById('senderReceiverContainer');
  container.innerHTML = `
    <div class="row sender-receiver-info bg-light border rounded p-3">
      <div class="col-md-6 mb-2 mb-md-0">
        <h6><i class="bi bi-person-fill me-1"></i>Người gửi</h6>
        <p class="mb-1">${info.from_name || ''}</p>
        <p class="mb-1">${info.from_phone || ''}</p>
        <p class="mb-0">${info.from_address || ''}</p>
      </div>
      <div class="col-md-6">
        <h6><i class="bi bi-person-lines-fill me-1"></i>Người nhận</h6>
        <p class="mb-1">${info.to_name || ''}</p>
        <p class="mb-1">${info.to_phone || ''}</p>
        <p class="mb-0">${info.to_address || ''}</p>
      </div>
    </div>
  `;
}


async function trackOrder() {
  const code = document.getElementById("trackingCode").value.trim();

  if (!code) return document.getElementById('trackingCode').focus();
  if (isTracking) return;

  isTracking = true;
  clearResults();
  setLoadingState(true);

  try {
    const carrier = detectCarrier(code);

    if (carrier === "spx") {
      await handleSPX(code);
    } else if (carrier === "ghn") {
      await handleGHN(code);
    } else {
      throw new Error('Không nhận diện được đơn vị vận chuyển');
    }
  } catch (err) {
    console.error(err);
    showContainer('errorContainer');
  } finally {
    setLoadingState(false);
    isTracking = false;
  }
}


// Enter key support
document.getElementById('trackingCode').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
    trackOrder();
    }
});

// Auto-focus on input
document.getElementById('trackingCode').focus();

// Auto-clear on input change
document.getElementById('trackingCode').addEventListener('input', function() {
    if (this.value.trim() === '') {
    clearResults();
    }
});
function renderCarrierInfo(carrier) {
  const logoElement = document.getElementById('carrierLogo');
  const nameElement = document.getElementById('carrierName');
  const container = document.getElementById('carrierInfo');

  const carriers = {
    spx: {
      name: 'Shopee Express',
      logo: 'https://deo.shopeemobile.com/shopee/shopee-spx-live-vn/static/media/spx-express.f30236392.svg'
    },
    ghn: {
      name: 'Giao Hàng Nhanh (GHN)',
      logo: 'https://cdn.ghn.vn/online-static/tracking/1.12.5/media/Giao_Hang_Nhanh_Toan_Quoc_color.7d901c9c.png'
    }
  };

  const info = carriers[carrier];
  if (info) {
    logoElement.src = info.logo;
    nameElement.textContent = info.name;
    container.style.display = 'flex';
  } else {
    container.style.display = 'none';
  }
}
function clearSenderReceiverInfo() {
  const container = document.getElementById("senderReceiverInfo");
  if (container) {
    container.style.display = 'none';
    document.getElementById("senderInfo").textContent = '';
    document.getElementById("receiverInfo").textContent = '';
  }
}
