
async function downloadReportPNG() {
  const dt = document.getElementById('reportCardDate').value;
  
  // Fetch dashboard data
  const res = await fetch(`/api/dashboard?date=${dt}`);
  const data = await res.json();
  
  // Create high-res canvas (1200 x 1650)
  const canvas = document.getElementById('hiddenReportCanvas');
  const width = 1200;
  const height = 1680;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, width, height);

  // Card Outer Shadow / Border Box
  const margin = 30;
  const cardW = width - (margin * 2);
  const cardH = height - (margin * 2);
  
  ctx.fillStyle = "#FFFFFF";
  ctx.strokeStyle = "#C8102E";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(margin, margin, cardW, cardH, 24);
  ctx.fill();
  ctx.stroke();

  // Header Banner (India Post Red)
  const headerH = 200;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(margin, margin, cardW, headerH, [24, 24, 0, 0]);
  ctx.clip();
  ctx.fillStyle = "#C8102E";
  ctx.fillRect(margin, margin, cardW, headerH);

  // Top Pill Badge
  ctx.fillStyle = "#F8B133";
  ctx.beginPath();
  ctx.roundRect(width / 2 - 200, margin + 20, 400, 32, 16);
  ctx.fill();

  ctx.fillStyle = "#1E293B";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DEPARTMENT OF POSTS • INDIA POST", width / 2, margin + 42);

  // Division Title
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 32px sans-serif";
  ctx.fillText("NEW DELHI CENTRAL DIVISION", width / 2, margin + 98);

  // Subtitle
  ctx.font = "600 22px sans-serif";
  ctx.fillText("DAILY SAVINGS & IPPB PERFORMANCE REPORT", width / 2, margin + 135);

  // Date
  // Format date DD.MM.YYYY
  const parts = dt.split('-');
  const displayDate = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : dt;
  ctx.font = "500 18px sans-serif";
  ctx.fillStyle = "#FDE68A";
  ctx.fillText(`Reporting Date: ${displayDate}`, width / 2, margin + 172);
  ctx.restore();

  // KPI Ribbon
  const kpiY = margin + headerH;
  const kpiH = 110;
  ctx.fillStyle = "#FFFBEB";
  ctx.fillRect(margin, kpiY, cardW, kpiH);
  ctx.strokeStyle = "#FDE68A";
  ctx.lineWidth = 2;
  ctx.strokeRect(margin, kpiY, cardW, kpiH);

  const m = data.metrics;
  const colW = cardW / 3;

  // KPI 1: Reported
  ctx.textAlign = "center";
  ctx.fillStyle = "#78350F";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("OFFICES REPORTED", margin + colW * 0.5, kpiY + 38);
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#B45309";
  ctx.fillText(`${m.submitted_count} / ${m.total_offices}`, margin + colW * 0.5, kpiY + 82);

  // KPI 2: Pending
  ctx.fillStyle = "#78350F";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("PENDING OFFICES", margin + colW * 1.5, kpiY + 38);
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = m.pending_count > 0 ? "#DC2626" : "#16A34A";
  ctx.fillText(`${m.pending_count}`, margin + colW * 1.5, kpiY + 82);

  // KPI 3: Completion
  ctx.fillStyle = "#78350F";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("COMPLETION RATE", margin + colW * 2.5, kpiY + 38);
  ctx.font = "bold 34px sans-serif";
  ctx.fillStyle = "#2563EB";
  ctx.fillText(`${m.completion_pct}%`, margin + colW * 2.5, kpiY + 82);

  // Section 1: POSB
  let curY = kpiY + kpiH + 30;
  ctx.fillStyle = "#C8102E";
  ctx.fillRect(margin + 30, curY, 8, 28);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("1. SAVINGS / POSB PERFORMANCE", margin + 48, curY + 22);

  curY += 40;
  // POSB Table Header
  const tableX = margin + 30;
  const tableW = cardW - 60;
  ctx.fillStyle = "#F1F5F9";
  ctx.fillRect(tableX, curY, tableW, 36);
  ctx.fillStyle = "#475569";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("SCHEME / CERTIFICATE", tableX + 20, curY + 24);
  ctx.textAlign = "center";
  ctx.fillText("OPENED", tableX + tableW * 0.65, curY + 24);
  ctx.fillText("CLOSED", tableX + tableW * 0.88, curY + 24);

  curY += 36;
  const savingsProds = data.consolidated_products.filter(p => p.section === 'SAVINGS');
  
  ctx.font = "16px sans-serif";
  savingsProds.forEach((p, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
    ctx.fillRect(tableX, curY, tableW, 32);

    ctx.textAlign = "left";
    ctx.fillStyle = "#1E293B";
    ctx.font = "600 16px sans-serif";
    ctx.fillText(`${p.short_name} - ${p.name.split('(')[0].trim()}`, tableX + 20, curY + 22);

    ctx.textAlign = "center";
    if (p.entry_mode === 'CLOSED_ONLY') {
      ctx.fillStyle = "#94A3B8";
      ctx.fillText("--", tableX + tableW * 0.65, curY + 22);
    } else {
      ctx.fillStyle = "#0F172A";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText(p.total_opened, tableX + tableW * 0.65, curY + 22);
    }

    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText(p.total_closed, tableX + tableW * 0.88, curY + 22);

    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, curY, tableW, 32);
    curY += 32;
  });

  // POSB Total Row
  ctx.fillStyle = "#FFF1F2";
  ctx.fillRect(tableX, curY, tableW, 38);
  ctx.strokeStyle = "#FDA4AF";
  ctx.lineWidth = 2;
  ctx.strokeRect(tableX, curY, tableW, 38);

  ctx.textAlign = "left";
  ctx.fillStyle = "#9E0C24";
  ctx.font = "bold 18px sans-serif";
  ctx.fillText("TOTAL SAVINGS / POSB", tableX + 20, curY + 25);

  ctx.textAlign = "center";
  ctx.font = "bold 20px sans-serif";
  ctx.fillStyle = "#C8102E";
  ctx.fillText(m.total_savings_opened, tableX + tableW * 0.65, curY + 26);
  ctx.fillStyle = "#991B1B";
  ctx.fillText(m.total_savings_closed, tableX + tableW * 0.88, curY + 26);

  // Section 2: IPPB
  curY += 60;
  ctx.fillStyle = "#F59E0B";
  ctx.fillRect(margin + 30, curY, 8, 28);
  ctx.fillStyle = "#0F172A";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("2. IPPB PERFORMANCE", margin + 48, curY + 22);

  curY += 40;
  // IPPB Accounts Table
  ctx.fillStyle = "#F1F5F9";
  ctx.fillRect(tableX, curY, tableW, 34);
  ctx.fillStyle = "#475569";
  ctx.font = "bold 16px sans-serif";
  ctx.fillText("IPPB ACCOUNT TYPE", tableX + 20, curY + 23);
  ctx.textAlign = "center";
  ctx.fillText("OPENED", tableX + tableW * 0.65, curY + 23);
  ctx.fillText("CLOSED", tableX + tableW * 0.88, curY + 23);

  curY += 34;
  const ippbAccounts = data.consolidated_products.filter(p => p.section === 'IPPB' && p.entry_mode === 'OPENED_AND_CLOSED');
  ippbAccounts.forEach((p, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? "#FFFFFF" : "#F8FAFC";
    ctx.fillRect(tableX, curY, tableW, 32);

    ctx.textAlign = "left";
    ctx.fillStyle = "#1E293B";
    ctx.font = "600 16px sans-serif";
    ctx.fillText(p.name, tableX + 20, curY + 22);

    ctx.textAlign = "center";
    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#0F172A";
    ctx.fillText(p.total_opened, tableX + tableW * 0.65, curY + 22);
    ctx.fillText(p.total_closed, tableX + tableW * 0.88, curY + 22);

    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1;
    ctx.strokeRect(tableX, curY, tableW, 32);
    curY += 32;
  });

  // IPPB Total Row
  ctx.fillStyle = "#FEF3C7";
  ctx.fillRect(tableX, curY, tableW, 36);
  ctx.strokeStyle = "#FCD34D";
  ctx.lineWidth = 2;
  ctx.strokeRect(tableX, curY, tableW, 36);

  ctx.textAlign = "left";
  ctx.fillStyle = "#92400E";
  ctx.font = "bold 17px sans-serif";
  ctx.fillText("TOTAL IPPB ACCOUNTS", tableX + 20, curY + 24);

  ctx.textAlign = "center";
  ctx.font = "bold 19px sans-serif";
  ctx.fillStyle = "#B45309";
  ctx.fillText(m.total_ippb_opened, tableX + tableW * 0.65, curY + 25);
  ctx.fillStyle = "#991B1B";
  ctx.fillText(m.total_ippb_closed, tableX + tableW * 0.88, curY + 25);

  // IPPB Services Tiles
  curY += 50;
  ctx.textAlign = "left";
  ctx.fillStyle = "#475569";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("IPPB SERVICES & BUSINESS ACHIEVEMENTS (TRANSACTION COUNT)", tableX, curY);

  curY += 15;
  const ippbServices = data.consolidated_products.filter(p => p.section === 'IPPB' && p.entry_mode === 'ACHIEVEMENT_COUNT');
  const tileW = (tableW - 16) / 2;
  const tileH = 40;

  ippbServices.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const tx = tableX + col * (tileW + 16);
    const ty = curY + row * (tileH + 10);

    ctx.fillStyle = "#F8FAFC";
    ctx.strokeStyle = "#CBD5E1";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(tx, ty, tileW, tileH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font = "600 15px sans-serif";
    ctx.fillStyle = "#1E293B";
    ctx.fillText(s.name, tx + 14, ty + 25);

    ctx.textAlign = "right";
    ctx.font = "bold 18px sans-serif";
    ctx.fillStyle = "#1E40AF";
    ctx.fillText(s.total_achievement, tx + tileW - 16, ty + 26);
  });

  // Footer
  const footerY = height - margin - 40;
  ctx.strokeStyle = "#E2E8F0";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin, footerY);
  ctx.lineTo(margin + cardW, footerY);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = "#64748B";
  ctx.font = "14px sans-serif";
  ctx.fillText("Department of Posts • Administrative Office, New Delhi Central Division • Confidential Internal Report", width / 2, footerY + 25);

  // Trigger Download
  const link = document.createElement('a');
  link.download = `Savings_Performance_NDCD_${dt}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
