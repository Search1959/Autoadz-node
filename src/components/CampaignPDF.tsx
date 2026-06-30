import { Campaign, Driver } from "../types";

export function exportCampaignPDF(campaign: Campaign, drivers: Driver[]) {
  // Use browser print dialog with a styled print page — no external lib needed
  const assignedDrivers = drivers.filter(d => d.currentCampaignId === campaign.id);
  const budget = Number(campaign.budget).toLocaleString("en-IN");
  const kms = Number(campaign.kmsCovered).toLocaleString("en-IN", { maximumFractionDigits: 1 });
  const reach = (campaign.autosCount * 30 * 40000).toLocaleString("en-IN");
  const progress = campaign.budget > 0
    ? Math.min(100, Math.round((campaign.kmsCovered / (campaign.autosCount * 30 * 100)) * 100))
    : 0;
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Campaign Report — ${campaign.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Poppins', sans-serif; color: #1e293b; background: #fff; padding: 40px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1B3A6B; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 22px; font-weight: 800; color: #1B3A6B; }
    .brand span { color: #16A34A; }
    .meta { text-align: right; color: #64748b; font-size: 11px; }
    .title { font-size: 18px; font-weight: 700; color: #1B3A6B; margin-bottom: 4px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .badge-active { background: #dcfce7; color: #15803d; }
    .badge-pending { background: #fef9c3; color: #a16207; }
    .badge-completed { background: #e0e7ff; color: #4338ca; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
    .stat { background: #f0f4f8; border-radius: 12px; padding: 16px; }
    .stat-value { font-size: 22px; font-weight: 800; color: #1B3A6B; }
    .stat-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 4px; }
    .section { margin: 20px 0; }
    .section-title { font-size: 12px; font-weight: 700; color: #1B3A6B; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 12px; }
    .progress-bar { background: #e2e8f0; border-radius: 6px; height: 10px; overflow: hidden; margin: 8px 0; }
    .progress-fill { background: linear-gradient(90deg, #1B3A6B, #16A34A); height: 100%; border-radius: 6px; width: ${progress}%; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #1B3A6B; color: white; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; }
    td { padding: 8px 12px; border-bottom: 1px solid #f1f5f9; }
    tr:nth-child(even) td { background: #f8fafc; }
    .info-row { display: flex; gap: 24px; margin: 12px 0; flex-wrap: wrap; }
    .info-item { flex: 1; min-width: 150px; }
    .info-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; }
    .info-value { font-weight: 600; color: #1e293b; margin-top: 2px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 10px; display: flex; justify-content: space-between; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Auto<span>Adz</span>.in</div>
      <div style="color:#64748b;font-size:11px;margin-top:4px;">India's GPS-Tracked Transit Advertising Platform</div>
    </div>
    <div class="meta">
      <div style="font-weight:700;color:#1B3A6B;font-size:14px;">Campaign Report</div>
      <div>Generated: ${today}</div>
      <div>Report ID: RPT-${campaign.id.slice(-6).toUpperCase()}</div>
    </div>
  </div>

  <div class="title">${campaign.title}</div>
  <div style="margin-top:6px;">
    <span class="badge badge-${campaign.status}">${campaign.status.toUpperCase()}</span>
    &nbsp;<span style="color:#64748b;font-size:11px;">${campaign.client} &bull; ${campaign.city}, ${campaign.area}</span>
  </div>

  <div class="grid">
    <div class="stat">
      <div class="stat-value">₹${budget}</div>
      <div class="stat-label">Campaign Budget</div>
    </div>
    <div class="stat">
      <div class="stat-value">${campaign.autosCount}</div>
      <div class="stat-label">Autos Deployed</div>
    </div>
    <div class="stat">
      <div class="stat-value">${kms} KM</div>
      <div class="stat-label">Total KMs Covered</div>
    </div>
    <div class="stat">
      <div class="stat-value">${campaign.qrScans}</div>
      <div class="stat-label">QR Scans</div>
    </div>
    <div class="stat">
      <div class="stat-value">${reach}</div>
      <div class="stat-label">Est. Impressions</div>
    </div>
    <div class="stat">
      <div class="stat-value">${progress}%</div>
      <div class="stat-label">Campaign Progress</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Campaign Progress</div>
    <div class="progress-bar"><div class="progress-fill"></div></div>
    <div style="font-size:11px;color:#64748b;margin-top:4px;">${progress}% of estimated mileage target completed</div>
  </div>

  <div class="section">
    <div class="section-title">Campaign Details</div>
    <div class="info-row">
      <div class="info-item"><div class="info-label">Start Date</div><div class="info-value">${campaign.startDate}</div></div>
      <div class="info-item"><div class="info-label">End Date</div><div class="info-value">${campaign.endDate}</div></div>
      <div class="info-item"><div class="info-label">Creative Status</div><div class="info-value">${campaign.creativeStatus || "pending"}</div></div>
      <div class="info-item"><div class="info-label">Target Area</div><div class="info-value">${campaign.area}</div></div>
    </div>
  </div>

  ${assignedDrivers.length > 0 ? `
  <div class="section">
    <div class="section-title">Assigned Drivers (${assignedDrivers.length})</div>
    <table>
      <thead><tr><th>Driver Name</th><th>Auto Number</th><th>Location</th><th>Status</th><th>Earnings</th></tr></thead>
      <tbody>
        ${assignedDrivers.map(d => `
        <tr>
          <td>${d.name}</td>
          <td>${d.autoNumber}</td>
          <td>${d.location}</td>
          <td>${d.state}</td>
          <td>₹${Number(d.totalEarnings).toLocaleString("en-IN")}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <div class="footer">
    <div>AutoAdz.in &bull; apex7tech@gmail.com &bull; +91 98361-30393</div>
    <div>Confidential Campaign Report &bull; M/s Deinrim Solutionss (P) ltd., Kolkata</div>
  </div>

  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
