
function handleAdminDateChange() {
  const dt = document.getElementById('adminDateSelect').value;
  if (dt) {
    window.location.href = `/admin?date=${dt}`;
  }
}

function filterMatrix() {
  const search = document.getElementById('matrixSearch').value.toLowerCase();
  const hpo = document.getElementById('hpoFilter').value;
  const status = document.getElementById('statusFilter').value;

  const rows = document.querySelectorAll('.matrix-row');
  rows.forEach(r => {
    const offName = r.getAttribute('data-office');
    const offHpo = r.getAttribute('data-hpo');
    const offStatus = r.getAttribute('data-status');

    let matches = true;
    if (search && !offName.includes(search)) matches = false;
    if (hpo !== 'ALL' && offHpo !== hpo) matches = false;
    if (status !== 'ALL' && offStatus !== status) matches = false;

    r.style.display = matches ? '' : 'none';
  });
}

async function copyPendingForWhatsApp() {
  const dt = document.getElementById('adminDateSelect').value;
  // Format date DD.MM.YYYY
  const parts = dt.split('-');
  const displayDate = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : dt;

  const pendingBadges = document.querySelectorAll('.badge-danger');
  const pendingNames = [];
  
  // Get all pending office rows from matrix
  const rows = document.querySelectorAll('.matrix-row[data-status="PENDING"]');
  rows.forEach((r, idx) => {
    const nameEl = r.querySelector('strong');
    const hpoEl = r.querySelector('small');
    if (nameEl) {
      pendingNames.push(`${idx + 1}. *${nameEl.innerText.trim()}* (${hpoEl ? hpoEl.innerText : ''})`);
    }
  });

  if (pendingNames.length === 0) {
    alert('No pending offices found! All offices have submitted for this date.');
    return;
  }

  const text = `⚠️ *PENDING DAILY SAVINGS REPORT ALERT*
Department of Posts – India Post
New Delhi Central Division
📅 *Date: ${displayDate}*

The following *${pendingNames.length} offices* have NOT submitted today's Daily Savings Performance figures:

${pendingNames.join('\n')}

Kindly submit the day's figures immediately through the official portal link:
🔗 [Division Reporting Link]

_Administrative Office, New Delhi Central Division_`;

  try {
    await navigator.clipboard.writeText(text);
    alert(`📋 Successfully copied ${pendingNames.length} pending offices to clipboard! You can now paste this alert directly into the WhatsApp group.`);
  } catch (err) {
    // Fallback prompt
    window.prompt('Copy pending list below:', text);
  }
}

function downloadCSV() {
  const dt = document.getElementById('adminDateSelect').value;
  window.location.href = `/api/export/csv?date=${dt}`;
}

async function openEditModal(officeId, officeName) {
  const dt = document.getElementById('adminDateSelect').value;
  const modal = document.getElementById('adminEditModal');
  const title = document.getElementById('modalOfficeTitle');
  const loading = document.getElementById('modalLoading');
  const form = document.getElementById('adminModalForm');
  const inputsContainer = document.getElementById('modalFormInputs');

  document.getElementById('modalOfficeId').value = officeId;
  title.innerText = `Edit: ${officeName} (${dt})`;
  modal.style.display = 'flex';
  loading.style.display = 'block';
  form.style.display = 'none';

  try {
    // Fetch products and existing submission
    const [prodRes, subRes] = await Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch(`/api/submission?office_id=${officeId}&date=${dt}`).then(r => r.json())
    ]);

    const products = prodRes.products;
    const subItems = (subRes.exists && subRes.submission.items) ? subRes.submission.items : {};

    let html = '<div style="display:grid; grid-template-columns: 1fr; gap: 12px;">';
    
    html += '<h4 style="color:var(--primary); margin-top:8px;">Savings Schemes</h4><div class="grid-2">';
    products.filter(p => p.section === 'SAVINGS').forEach(p => {
      const cur = subItems[p.code] || { opened_count: 0, closed_count: 0, achievement_count: 0 };
      if (p.entry_mode === 'OPENED_AND_CLOSED') {
        html += `
          <div style="border: 1px solid var(--border); padding: 8px; border-radius: 6px;">
            <label style="margin-bottom:4px;">${p.name}</label>
            <div style="display:flex; gap:8px;">
              <div><small>Opened:</small><input type="number" min="0" class="form-control admin-modal-input" data-code="${p.code}" data-field="opened" value="${cur.opened_count}"></div>
              <div><small>Closed:</small><input type="number" min="0" class="form-control admin-modal-input" data-code="${p.code}" data-field="closed" value="${cur.closed_count}"></div>
            </div>
          </div>`;
      } else if (p.entry_mode === 'CLOSED_ONLY') {
        html += `
          <div style="border: 1px solid var(--border); padding: 8px; border-radius: 6px;">
            <label style="margin-bottom:4px;">${p.name} (Discontinued)</label>
            <div><small>Closed:</small><input type="number" min="0" class="form-control admin-modal-input" data-code="${p.code}" data-field="closed" value="${cur.closed_count}"></div>
          </div>`;
      }
    });
    html += '</div>';

    html += '<h4 style="color:#B45309; margin-top:16px;">IPPB Products & Services</h4><div class="grid-2">';
    products.filter(p => p.section === 'IPPB').forEach(p => {
      const cur = subItems[p.code] || { opened_count: 0, closed_count: 0, achievement_count: 0 };
      if (p.entry_mode === 'OPENED_AND_CLOSED') {
        html += `
          <div style="border: 1px solid var(--border); padding: 8px; border-radius: 6px;">
            <label style="margin-bottom:4px;">${p.name}</label>
            <div style="display:flex; gap:8px;">
              <div><small>Opened:</small><input type="number" min="0" class="form-control admin-modal-input" data-code="${p.code}" data-field="opened" value="${cur.opened_count}"></div>
              <div><small>Closed:</small><input type="number" min="0" class="form-control admin-modal-input" data-code="${p.code}" data-field="closed" value="${cur.closed_count}"></div>
            </div>
          </div>`;
      } else if (p.entry_mode === 'ACHIEVEMENT_COUNT') {
        html += `
          <div style="border: 1px solid var(--border); padding: 8px; border-radius: 6px;">
            <label style="margin-bottom:4px;">${p.name}</label>
            <div><small>Count:</small><input type="number" min="0" class="form-control admin-modal-input" data-code="${p.code}" data-field="achievement" value="${cur.achievement_count}"></div>
          </div>`;
      }
    });
    html += '</div></div>';

    inputsContainer.innerHTML = html;
    loading.style.display = 'none';
    form.style.display = 'block';
  } catch (err) {
    loading.innerText = 'Failed to load submission data: ' + err.message;
  }
}

function closeAdminEditModal() {
  document.getElementById('adminEditModal').style.display = 'none';
}

async function handleAdminModalSubmit(event) {
  event.preventDefault();
  const officeId = document.getElementById('modalOfficeId').value;
  const dt = document.getElementById('adminDateSelect').value;
  const adminNotes = document.getElementById('modalAdminNotes').value.trim();

  const inputs = document.querySelectorAll('.admin-modal-input');
  const items = {};

  inputs.forEach(inp => {
    const code = inp.getAttribute('data-code');
    const field = inp.getAttribute('data-field');
    if (!items[code]) items[code] = {};
    items[code][field] = parseInt(inp.value || 0, 10);
  });

  const payload = {
    office_id: parseInt(officeId, 10),
    report_date: dt,
    submitted_by: 'Divisional Admin Override',
    items: items,
    is_admin: true,
    admin_notes: adminNotes || 'Modified via Admin Dashboard'
  };

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok) {
      alert('Office submission updated successfully!');
      location.reload();
    } else {
      alert('Error updating: ' + (data.detail || 'Unknown error'));
    }
  } catch (err) {
    alert('Network error: ' + err.message);
  }
}
