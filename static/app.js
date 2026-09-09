
document.addEventListener('DOMContentLoaded', () => {
  // Load cached office and PIN
  const savedOfficeId = localStorage.getItem('ip_office_id');
  const savedPin = localStorage.getItem('ip_office_pin');
  
  if (savedOfficeId) {
    const sel = document.getElementById('officeSelect');
    if (sel) {
      sel.value = savedOfficeId;
      if (savedPin) {
        document.getElementById('officePin').value = savedPin;
      }
      checkExistingSubmission();
    }
  }
});

function handleOfficeChange() {
  const sel = document.getElementById('officeSelect');
  const officeId = sel.value;
  if (!officeId) return;

  // Restore saved PIN if matches
  const savedOfficeId = localStorage.getItem('ip_office_id');
  const savedPin = localStorage.getItem('ip_office_pin');
  if (savedOfficeId === officeId && savedPin) {
    document.getElementById('officePin').value = savedPin;
  }
  
  checkExistingSubmission();
}

function handleDateChange() {
  checkExistingSubmission();
}

function handlePinInput() {
  const remember = document.getElementById('rememberPin').checked;
  const officeId = document.getElementById('officeSelect').value;
  const pin = document.getElementById('officePin').value;
  if (remember && officeId && pin.length >= 4) {
    localStorage.setItem('ip_office_id', officeId);
    localStorage.setItem('ip_office_pin', pin);
  }
}

async function checkExistingSubmission() {
  const officeId = document.getElementById('officeSelect').value;
  const reportDate = document.getElementById('reportDate').value;
  const updateBanner = document.getElementById('updateBanner');
  const updateBannerText = document.getElementById('updateBannerText');
  const submitBtn = document.getElementById('submitBtn');

  if (!officeId || !reportDate) {
    updateBanner.style.display = 'none';
    return;
  }

  try {
    const res = await fetch(`/api/submission?office_id=${officeId}&date=${reportDate}`);
    const data = await res.json();

    if (data.exists) {
      const sub = data.submission;
      updateBannerText.innerHTML = `Entry already recorded by <strong>${sub.submitted_by || 'Staff'}</strong> at <strong>${sub.submitted_at}</strong>. (Last modified: ${sub.updated_at})`;
      updateBanner.style.display = 'block';
      submitBtn.innerHTML = '✏️ Update Daily Performance';
      submitBtn.className = 'btn btn-warning';

      // Pre-fill values
      if (sub.items) {
        for (const [code, item] of Object.entries(sub.items)) {
          const openedInput = document.getElementById(`prod_${code}_opened`);
          const closedInput = document.getElementById(`prod_${code}_closed`);
          const achieveInput = document.getElementById(`prod_${code}_achievement`);

          if (openedInput) openedInput.value = item.opened_count;
          if (closedInput) closedInput.value = item.closed_count;
          if (achieveInput) achieveInput.value = item.achievement_count;
        }
      }
      if (sub.submitted_by) {
        document.getElementById('submittedBy').value = sub.submitted_by;
      }
    } else {
      updateBanner.style.display = 'none';
      submitBtn.innerHTML = '📤 Submit Daily Performance';
      submitBtn.className = 'btn btn-primary';
      resetFormToZeroes();
    }
  } catch (err) {
    console.error('Error checking submission:', err);
  }
}

function resetFormToZeroes() {
  const countFields = document.querySelectorAll('.count-field');
  countFields.forEach(f => f.value = '0');
}

function handleFormSubmit(event) {
  event.preventDefault();

  // Calculate sum of all counts
  const countFields = document.querySelectorAll('.count-field');
  let totalSum = 0;
  for (const f of countFields) {
    const val = parseInt(f.value || 0, 10);
    if (isNaN(val) || val < 0) {
      showAlert('Negative or invalid numbers are not allowed.', 'danger');
      f.focus();
      return;
    }
    totalSum += val;
  }

  if (totalSum === 0) {
    // Show zero confirmation modal
    document.getElementById('zeroModal').style.display = 'flex';
    return;
  }

  executeSubmission(false);
}

function closeZeroModal() {
  document.getElementById('zeroModal').style.display = 'none';
}

async function executeSubmission(isConfirmedZero) {
  closeZeroModal();

  const officeSelect = document.getElementById('officeSelect');
  const officeId = officeSelect.value;
  const officeName = officeSelect.options[officeSelect.selectedIndex].text;
  const pin = document.getElementById('officePin').value.trim();
  const reportDate = document.getElementById('reportDate').value;
  const submittedBy = document.getElementById('submittedBy').value.trim() || 'Staff';

  if (!officeId) {
    showAlert('Please select an Office Name.', 'danger');
    return;
  }
  if (!pin) {
    showAlert('Please enter your 4-digit Office Verification PIN.', 'danger');
    return;
  }

  // Collect items
  const items = {};
  const openedInputs = document.querySelectorAll('[id^="prod_"][id$="_opened"]');
  const closedInputs = document.querySelectorAll('[id^="prod_"][id$="_closed"]');
  const achieveInputs = document.querySelectorAll('[id^="prod_"][id$="_achievement"]');

  openedInputs.forEach(inp => {
    const code = inp.id.replace('prod_', '').replace('_opened', '');
    if (!items[code]) items[code] = {};
    items[code].opened = parseInt(inp.value || 0, 10);
  });

  closedInputs.forEach(inp => {
    const code = inp.id.replace('prod_', '').replace('_closed', '');
    if (!items[code]) items[code] = {};
    items[code].closed = parseInt(inp.value || 0, 10);
  });

  achieveInputs.forEach(inp => {
    const code = inp.id.replace('prod_', '').replace('_achievement', '');
    if (!items[code]) items[code] = {};
    items[code].achievement = parseInt(inp.value || 0, 10);
  });

  const payload = {
    office_id: parseInt(officeId, 10),
    pin: pin,
    report_date: reportDate,
    submitted_by: submittedBy,
    items: items
  };

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Submitting...';

  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok) {
      showAlert(data.detail || 'Submission failed. Please verify your PIN.', 'danger');
    } else {
      // Save PIN in localStorage if remember checked
      if (document.getElementById('rememberPin').checked) {
        localStorage.setItem('ip_office_id', officeId);
        localStorage.setItem('ip_office_pin', pin);
      }

      const actionText = data.action === 'UPDATE' ? 'Updated' : 'Submitted';
      showAlert(`✅ Success! Daily Performance successfully ${actionText} for <strong>${officeName}</strong> (${reportDate}).`, 'success');
      
      // Refresh banner state
      checkExistingSubmission();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } catch (err) {
    console.error('Error:', err);
    showAlert('Network error occurred. Please try again.', 'danger');
  } finally {
    submitBtn.disabled = false;
  }
}

function showAlert(message, type) {
  const alertEl = document.getElementById('statusAlert');
  alertEl.className = `alert alert-${type}`;
  alertEl.innerHTML = message;
  alertEl.style.display = 'block';
}
