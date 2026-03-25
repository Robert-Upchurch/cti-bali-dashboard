// =====================
// CTI-USA Dashboard App
// =====================

// --- THEME TOGGLE ---
(function(){
  const t = document.querySelector('[data-theme-toggle]');
  const r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  r.setAttribute('data-theme', d);
  if (t) {
    updateToggleIcon(t, d);
    t.addEventListener('click', () => {
      d = d === 'dark' ? 'light' : 'dark';
      r.setAttribute('data-theme', d);
      t.setAttribute('aria-label', 'Switch to ' + (d === 'dark' ? 'light' : 'dark') + ' mode');
      updateToggleIcon(t, d);
    });
  }
  function updateToggleIcon(btn, theme) {
    btn.innerHTML = theme === 'dark'
      ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }
})();

// --- VIEW SWITCHER ---
const viewTitles = {
  overview:   'Dashboard Overview',
  calendar:   'Event Calendar',
  ciee:       'CIEE BridgeUSA',
  allianz:    'Alliance Abroad',
  positions:  'Open Positions',
  flights:    'Bali Trip — Flights',
  'todo-ciee':'CIEE — Action Items',
  'todo-aag': 'Alliance Abroad — Action Items',
  mexico:     'Mexico — CIEE SWT 2026',
  'cti-tasks': 'CTI Internal Tasks'
};

function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const targetView = document.getElementById('view-' + viewName);
  if (targetView) targetView.classList.add('active');
  const targetNav = document.querySelector('[data-view="' + viewName + '"]');
  if (targetNav) targetNav.classList.add('active');
  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = viewTitles[viewName] || viewName;
  const main = document.querySelector('.main');
  if (main) main.scrollTop = 0;
}

// --- KEYBOARD NAVIGATION ---
document.addEventListener('keydown', (e) => {
  const views = ['overview','calendar','ciee','allianz','positions','flights','todo-ciee','todo-aag','mexico'];
  const numKeys = ['1','2','3','4','5','6','7','8','9'];
  const idx = numKeys.indexOf(e.key);
  if (idx >= 0) switchView(views[idx]);
});

// --- COUNTDOWN TIMERS ---
function calcDays(targetDate) {
  const today = new Date(); today.setHours(0,0,0,0);
  const target = new Date(targetDate);
  return Math.round((target - today) / 86400000);
}
function updateCountdowns() {
  const aag = calcDays('2026-03-31');
  const ciee = calcDays('2026-04-11');
  const cieePre = calcDays('2026-04-10');
  function fmt(d) { return d < 0 ? 'Past' : d === 0 ? 'Today!' : d + (d===1?' day':' days'); }
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  set('cd-aag', aag >= 0 ? aag : '–');
  set('cd-ciee', ciee >= 0 ? ciee : '–');
  set('aag-days-badge', fmt(aag));
  set('ciee-days-badge', fmt(ciee));
  set('ciee-pre-days-badge', fmt(cieePre));
  set('ciee-kpi-days', ciee);
  set('aag-kpi-days', aag);
}
updateCountdowns();

// --- INTERACTIVE CHECKBOXES (legacy) ---
function toggleAction(item) {
  const check = item.querySelector('.action-check');
  const text = item.querySelector('.action-text');
  if (!check || !text) return;
  if (check.classList.contains('done-check')) {
    check.classList.remove('done-check'); check.classList.add('pending-check');
    text.classList.remove('done-action');
  } else if (check.classList.contains('urgent-check')) {
    check.classList.remove('urgent-check'); check.classList.add('done-check');
    text.classList.add('done-action');
  } else if (check.classList.contains('pending-check')) {
    check.classList.remove('pending-check'); check.classList.add('done-check');
    text.classList.add('done-action');
  } else {
    check.classList.remove('done-check'); check.classList.add('pending-check');
    text.classList.remove('done-action');
  }
}

// --- TODO TOGGLE ---
function todoToggle(el) {
  el.classList.toggle('done');
  updateTodoProgress();
}
function updateTodoProgress() {
  document.querySelectorAll('.todo-section').forEach(section => {
    const prog = section.closest('.view') ? section.closest('.view').querySelector('.todo-progress') : null;
    if (!prog) return;
    const items = section.querySelectorAll('.todo-item');
    const done = section.querySelectorAll('.todo-item.done').length;
    prog.textContent = done + ' / ' + items.length + ' completed';
  });
}
document.addEventListener('DOMContentLoaded', updateTodoProgress);

// --- NOTES SYSTEM ---
const notesStore = {};
function fmtTime(d) { return d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}); }
function fmtDate(d) { return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}); }

function saveNote(id) {
  const ta = document.getElementById('notes-input-' + id);
  const text = (ta.value || '').trim();
  if (!text) return;
  if (!notesStore[id]) notesStore[id] = [];
  const now = new Date();
  notesStore[id].unshift({text, time: fmtTime(now), date: fmtDate(now), id: Date.now()});
  ta.value = '';
  ta.style.height = 'auto';
  renderNotes(id);
}
function deleteNote(clientId, noteId) {
  if (!notesStore[clientId]) return;
  notesStore[clientId] = notesStore[clientId].filter(n => n.id !== noteId);
  renderNotes(clientId);
}
function renderNotes(id) {
  const list = document.getElementById('notes-list-' + id);
  if (!list) return;
  const notes = notesStore[id] || [];
  const counter = document.getElementById('notes-count-' + id);
  if (counter) counter.textContent = notes.length + (notes.length===1?' note':' notes');
  if (notes.length === 0) {
    list.innerHTML = '<div class="notes-empty">No notes yet — type above and click Add Note.</div>';
    return;
  }
  list.innerHTML = notes.map(n =>
    '<div class="notes-entry">' +
      '<div class="notes-entry-meta">' +
        '<span class="notes-entry-time">' + n.time + '</span>' +
        '<span class="notes-entry-date">' + n.date + '</span>' +
      '</div>' +
      '<span class="notes-entry-text">' + n.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>') + '</span>' +
      '<span class="notes-entry-del" onclick="deleteNote(\'' + id + '\',' + n.id + ')" title="Delete">×</span>' +
    '</div>'
  ).join('');
}
function notesKeydown(e, id) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); saveNote(id); }
}

// Live timestamp
function updateLiveTimestamps() {
  const now = new Date();
  const stamp = fmtDate(now) + ' · ' + fmtTime(now);
  document.querySelectorAll('.notes-ts-live').forEach(el => el.textContent = stamp);
}
setInterval(updateLiveTimestamps, 1000);
updateLiveTimestamps();

// =============================================
// TASK TRACKER — Spreadsheet-style grid
// =============================================

const TEAM_MEMBERS = ['Robert', 'Stri Ratna', 'Astra', 'Putu Astra', 'Dewi (MCSI)', 'Eduardo', 'Arya Wiguna', 'Herry Wahyudi', 'Unassigned'];
const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Waiting', 'Completed', 'Cancelled'];

const STATUS_COLORS = {
  'Not Started': { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' },
  'In Progress': { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6' },
  'Waiting':     { bg: '#fefce8', text: '#854d0e', dot: '#eab308' },
  'Completed':   { bg: '#f0fdf4', text: '#166534', dot: '#22c55e' },
  'Cancelled':   { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' }
};

// Task data store — keyed by client id
const taskData = {
  ciee: [
    // BALI SECTION
    { id: 1, task: 'Prepare Bali candidates for CIEE Hiring Event', category: 'Bali', status: 'In Progress', assigned: 'Stri Ratna', priority: 'High', startDate: '2026-03-17', dueDate: '2026-04-09', completedDate: '', notes: 'Submit Beacon applications before event', attachments: [{name:'CIEE Bali J1 Order',url:'files/CIEE-Bali-J1-Order-Apr11-2026.pdf',type:'pdf'},{name:'FY26 Pre-LOA Memo',url:'files/FY26-BridgeUSA-Intern-Trainee-Pre-LOA-Memo.pdf',type:'pdf'}] },
    { id: 2, task: 'Schedule follow-up call with Maggie Mullin team', category: 'Bali', status: 'Not Started', assigned: 'Robert', priority: 'High', startDate: '', dueDate: '2026-04-11', completedDate: '', notes: 'HS program, WAT/Lifeguard, growth strategy', attachments: [] },
    { id: 3, task: 'Develop growth proposal — Mexico, Brazil, South Africa', category: 'Bali', status: 'Not Started', assigned: 'Robert', priority: 'Normal', startDate: '', dueDate: '2026-04-11', completedDate: '', notes: 'Include 2027 RS planning', attachments: [] },
    // MEXICO SWT SECTION
    { id: 4, task: 'Submit ALL Mexico SWT compliance docs to Pier Pennoyer', category: 'Mexico SWT', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: '9 required docs — all items below', attachments: [{name:'SWT Program Dates 2026',url:'files/SWT-Program-Date-Chart-2026.pdf',type:'pdf'}] },
    { id: 5, task: 'Complete CIEE Foreign Entity Report (Mexico office addresses)', category: 'Mexico SWT', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'All agency office addresses & contacts for Mexico', attachments: [{name:'Foreign Entity Report Template',url:'files/CIEE-Foreign-Entity-Report-2026.xlsx',type:'xlsx'}] },
    { id: 6, task: 'Complete WAT Fee Disclosure Form 2026', category: 'Mexico SWT', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Fill with highest possible pricing', attachments: [{name:'WAT Fee Disclosure Form 2026',url:'files/WAT-Fee-Disclosure-Form-2026.pdf',type:'pdf'}] },
    { id: 7, task: 'Complete Retail Pricing Template 2026', category: 'Mexico SWT', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Annual retail pricing — highest possible pricing', attachments: [{name:'Retail Pricing Template 2026',url:'files/Retail-Pricing-Template-2026.xlsx',type:'xlsx'}] },
    { id: 8, task: 'Complete Beacon Emergency Contact Sheet SWT 2026', category: 'Mexico SWT', status: 'Not Started', assigned: 'Stri Ratna', priority: 'Urgent', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Primary & Secondary Emergency Contact required', attachments: [{name:'Beacon Emergency Contact Sheet',url:'files/Beacon-Emergency-Contact-Sheet-SWT-2026.xlsm',type:'xlsx'}] },
    { id: 9, task: 'Complete Third-Party Relationship Declaration', category: 'Mexico SWT', status: 'Not Started', assigned: 'Robert', priority: 'High', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Skip if no third parties', attachments: [{name:'Third-Party Declaration Template',url:'files/Third-Party-Relationship-Declaration-2025.xlsx',type:'xlsx'}] },
    { id: 10, task: 'Prepare Bankruptcy Disclosure (Mexico letterhead)', category: 'Mexico SWT', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'No pending bankruptcy/legal actions. Dated within past year.', attachments: [] },
    { id: 11, task: 'Obtain Mexico Business License / Registration proof', category: 'Mexico SWT', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Original + unofficial English translation', attachments: [] },
    { id: 12, task: 'Obtain Criminal Background Checks — all owners/officers', category: 'Mexico SWT', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Within past year. Original + official English translation.', attachments: [] },
    { id: 13, task: 'Prepare notarized Financial Statement', category: 'Mexico SWT', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Balance sheet + income statement. Unofficial English translation.', attachments: [] },
    { id: 14, task: 'Submit Refund Policy for Mexico SWT program', category: 'Mexico SWT', status: 'Not Started', assigned: 'Robert', priority: 'High', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Include original + English translation', attachments: [] },
    // COMPLETED
    // HIGH SCHOOL PROGRAM — from email Mar 24, 2026
    { id: 18, task: 'Reschedule call with Andrew Clifton (CIEE HS Program Director) — after Asia return', category: 'HS Program', status: 'Waiting', assigned: 'Robert', priority: 'High', startDate: '2026-03-24', dueDate: '2026-04-21', completedDate: '', notes: 'Pier offered: Tue Mar 31 at 11am EST or Wed Apr 1 at 10:30am EST. Robert replied: in transit on those dates — heading to Asia Friday Mar 28 for ~3 weeks. Reschedule after Asia return (~Apr 20).', attachments: [] },
    { id: 19, task: 'Send CTI-CIEE Partner Onboarding Form to Pier for feedback', category: 'HS Program', status: 'Completed', assigned: 'Robert', priority: 'High', startDate: '2026-03-24', dueDate: '2026-03-24', completedDate: '2026-03-24', notes: 'Robert sent consolidated 6-section onboarding form (combining CIEE spreadsheets into one streamlined format). IT team still in beta — expect more iterations. Robert: "If cruise agents see all those separate spreadsheets they will roll their eyes."', attachments: [] },
    { id: 20, task: 'IT team: continue building consolidated CIEE onboarding form (beta)', category: 'HS Program', status: 'In Progress', assigned: 'Stri Ratna', priority: 'Normal', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Combining CIEE Mexico compliance spreadsheets into a single 6-section form that compiles data into a spreadsheet. Robert working on this while in Asia. Several more iterations expected before publishing.', attachments: [] },
    { id: 21, task: 'Mexico agent discussion — one cruise agent raised concern about current Mexico partner', category: 'Mexico', status: 'Waiting', assigned: 'Robert', priority: 'Normal', startDate: '2026-03-24', dueDate: '2026-04-21', completedDate: '', notes: 'Robert to Pier: "One agent raised a discussion point about the current partner in Mexico and wants to talk it through once I return from Asia — so I will have to put that on hold for the moment." Follow up after Asia trip (~Apr 20).', attachments: [] },

    { id: 15, task: 'CIEE Recap Meeting attended', category: 'Program', status: 'Completed', assigned: 'Robert', priority: 'Normal', startDate: '2026-03-04', dueDate: '2026-03-05', completedDate: '2026-03-05', notes: 'Mar 4-5, 2026', attachments: [] },
    { id: 16, task: 'Wire payment $12,732 sent to CIEE', category: 'Finance', status: 'Completed', assigned: 'Robert', priority: 'Normal', startDate: '2025-06-23', dueDate: '2025-06-23', completedDate: '2025-06-23', notes: 'INV356135, INV355789, INV355793, INV356130', attachments: [] },
    { id: 17, task: 'Signed Intern & Trainee Program Contract 2026', category: 'Admin', status: 'Completed', assigned: 'Robert', priority: 'Normal', startDate: '2026-02-19', dueDate: '2026-02-19', completedDate: '2026-02-19', notes: 'AAG — Feb 19, 2026', attachments: [{name:'Program Contract 2026',url:'files/InternTrainee-Program-Contract-CTI-2026.pdf',type:'pdf'}] }
  ],
  aag: [
    { id: 1, task: 'Recruit candidates for Bali Mini Fair (Mar 31)', category: 'Bali', status: 'In Progress', assigned: 'Stri Ratna', priority: 'Urgent', startDate: '2026-03-17', dueDate: '2026-03-31', completedDate: '', notes: '24 positions — Culinary & Front Desk', attachments: [{name:'AAG Bali Positions',url:'files/AAG-Bali-Positions-Mar15.pdf',type:'pdf'}] },
    { id: 2, task: 'Screen Culinary Kitchen Rotation candidates', category: 'Bali', status: 'Completed', assigned: 'Stri Ratna', priority: 'Urgent', startDate: '2026-03-17', dueDate: '2026-03-29', completedDate: '2026-03-24', notes: '14 demanded, 15 current (+1 overfilled) — Putu Astra update Mar 24', attachments: [] },
    { id: 3, task: 'Screen Front Desk Rotation candidates — 4 more needed', category: 'Bali', status: 'In Progress', assigned: 'Stri Ratna', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-29', completedDate: '', notes: 'Only 3 current + 3 pipeline vs 10 demanded. Excellent English.', attachments: [{name:'AAG Eligibility Rules',url:'files/AAG-Candidate-Eligibility-Rules.pdf',type:'pdf'}] },
    { id: 4, task: 'Confirm Bali logistics with Lindsay Bongi', category: 'Bali', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '', dueDate: '2026-03-29', completedDate: '', notes: 'WhatsApp: 845.664.4127 — candidate list, interview schedule, venue', attachments: [{name:'Bali Confirmation Email',url:'files/AAG-Bali-Confirmation-Mar16.pdf',type:'pdf'}] },
    { id: 5, task: 'Send advertising materials & recruitment videos to Lindsay', category: 'Bali', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '', dueDate: '2026-03-27', completedDate: '', notes: 'Raquel Webb video: youtube.com/watch?v=Ia8AkID9Bl4', attachments: [] },
    { id: 6, task: 'Arrange arrival logistics Mar 29-30 (Bali hotel)', category: 'Bali', status: 'Not Started', assigned: 'Stri Ratna', priority: 'Urgent', startDate: '', dueDate: '2026-03-25', completedDate: '', notes: 'CTI team arrives 1-2 days before Mar 31 fair', attachments: [] },
    { id: 7, task: 'Verify candidate eligibility per AAG rules', category: 'Bali', status: 'In Progress', assigned: 'Stri Ratna', priority: 'High', startDate: '2026-03-24', dueDate: '2026-03-29', completedDate: '', notes: 'Intern: min 3-4 relevant courses. U.S. experience does NOT count.', attachments: [{name:'AAG Eligibility Rules',url:'files/AAG-Candidate-Eligibility-Rules.pdf',type:'pdf'},{name:'AAG Pricing by Country',url:'files/AAG-Pricing-by-Country.pdf',type:'pdf'}] },
    { id: 8, task: 'Confirm date at Jakarta University', category: 'Jakarta', status: 'Waiting', assigned: 'Stri Ratna', priority: 'Normal', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Grand Hyatt Vail — coordinate with Lindsay Bongi. — Robert & Ratna', attachments: [] },
    { id: 9, task: 'Confirm time/date for AAG school visit & number of interviews', category: 'Jakarta', status: 'Waiting', assigned: 'Stri Ratna', priority: 'Normal', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: '— Robert & Ratna, Mar 24', attachments: [] },
    { id: 10, task: 'Upload AAG open positions to CTI website', category: 'Marketing', status: 'Not Started', assigned: 'Stri Ratna', priority: 'Normal', startDate: '', dueDate: '', completedDate: '', notes: 'Request asset bank from AAG: photos, job descriptions, locations', attachments: [{name:'AAG Bali Positions',url:'files/AAG-Bali-Positions-Mar15.pdf',type:'pdf'}] },
    { id: 11, task: 'Create Hanover CRM login', category: 'Admin', status: 'Not Started', assigned: 'Robert', priority: 'Normal', startDate: '', dueDate: '', completedDate: '', notes: 'https://aag.hanovercrm.com/ — use email as username', attachments: [] },
    { id: 12, task: 'Recruitment Partner Agreement signed', category: 'Admin', status: 'Completed', assigned: 'Robert', priority: 'Normal', startDate: '2026-02-19', dueDate: '2026-02-19', completedDate: '2026-02-19', notes: 'Robert Upchurch + Adam Cooper (President, AAG)', attachments: [] },
    { id: 13, task: 'Partnership kickoff meeting with Lindsay & Crystal', category: 'Admin', status: 'Completed', assigned: 'Robert', priority: 'Normal', startDate: '2026-03-11', dueDate: '2026-03-11', completedDate: '2026-03-11', notes: 'Hosted at CTI offices', attachments: [] },
    { id: 14, task: 'Confirmed Bali mini fair participation', category: 'Bali', status: 'Completed', assigned: 'Robert', priority: 'High', startDate: '2026-03-16', dueDate: '2026-03-16', completedDate: '2026-03-16', notes: '"Yes, we accept the challenge for Bali."', attachments: [{name:'Bali Confirmation Email',url:'files/AAG-Bali-Confirmation-Mar16.pdf',type:'pdf'}] }
  ],
  cti: [
    // BALI MAR 31 — from WhatsApp 3/24/2026
    { id: 1, task: 'Confirm interview time with Lindsay — morning or afternoon on Mar 31?', category: 'Bali Mar 31', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-25', completedDate: '', notes: 'Lindsay: "I am thinking of starting around 10am but will know tomorrow." Interviews at Nusa Dua area (possibly Westin). Lindsay will confirm venue by Mar 25.', attachments: [] },
    { id: 2, task: 'Confirm venue — Nusa Dua / Westin or current hotel for Mar 31 interviews', category: 'Bali Mar 31', status: 'Not Started', assigned: 'Stri Ratna', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-25', completedDate: '', notes: 'Lindsay: "Might be moving next door to the Westin. Will know for sure by tomorrow." OTC school is ~2 hrs from Nusa Dua — doing interviews at hotel instead.', attachments: [] },
    { id: 3, task: 'Create candidate profiles in Hanover CRM with AAG ID numbers', category: 'Bali Mar 31', status: 'Not Started', assigned: 'Stri Ratna', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-29', completedDate: '', notes: 'Lindsay: "Can we get profiles created in Hanover for the candidates and resumes uploaded? Makes it smoother for interviews — names can be similar. Need AAG ID numbers." URL: https://aag.hanovercrm.com/', attachments: [] },
    { id: 4, task: 'Upload all candidate resumes to Hanover CRM', category: 'Bali Mar 31', status: 'Not Started', assigned: 'Stri Ratna', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-29', completedDate: '', notes: 'Must be done before Mar 31 fair. Lindsay needs resumes uploaded for smooth interview process.', attachments: [] },
    { id: 5, task: 'Advise all candidates of specific interview time slot for Mar 31', category: 'Bali Mar 31', status: 'Not Started', assigned: 'Stri Ratna', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-30', completedDate: '', notes: 'Lindsay: "Need to have a specific time for everyone." Likely starting 10am. Confirm with Lindsay and notify candidates.', attachments: [] },
    { id: 6, task: 'Prepare CTI partner presentation for Mar 31 event (5–10 min)', category: 'Bali Mar 31', status: 'Not Started', assigned: 'Robert', priority: 'High', startDate: '2026-03-24', dueDate: '2026-03-30', completedDate: '', notes: 'Lindsay: "Typically the company does a brief presentation, then I do a presentation, and you do a presentation as the partner — all less than 5-10 min each. Then interviews."', attachments: [] },

    // JAKARTA — from WhatsApp 3/24/2026
    { id: 7, task: 'Confirm Grand Hyatt Jakarta virtual interview day — week of April 6', category: 'Jakarta', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-25', completedDate: '', notes: 'Lindsay (5:41pm): "Grand Hyatt is good for virtual the week of April 6. What day works best for the school?" Robert: "Let us confirm tonight and come back to you tomorrow with a definite." Grand Hyatt — virtual/online only at this stage.', attachments: [] },
    { id: 8, task: 'Coordinate with Jakarta school — confirm best day week of Apr 6 for virtual Grand Hyatt interviews', category: 'Jakarta', status: 'Not Started', assigned: 'Stri Ratna', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-25', completedDate: '', notes: 'Robert: "arranged with Ratna." Eduardo: "Grand Hyatt only online at this time." Need to confirm day with school and report back to Lindsay by Mar 25.', attachments: [] },
    { id: 9, task: 'Have Astra connect with Devi — ensure Jakarta students are in system (Zoho)', category: 'Jakarta', status: 'Not Started', assigned: 'Astra', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-26', completedDate: '', notes: 'Eduardo (10:11pm): "Have Astra connect with Devi and ensure they are in the system so Ratna can invite for calls." Students must be in Zoho before virtual interviews can be scheduled.', attachments: [] },
    { id: 10, task: 'Confirm Devi has access to Zoho — check if Jakarta students are enrolled', category: 'Jakarta', status: 'Not Started', assigned: 'Eduardo', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-26', completedDate: '', notes: 'Eduardo (10:10pm): "It\'s more about having them all in Zoho first. Does Devi have access? They need to be in our system so Ratna can invite for calls."', attachments: [] },
    { id: 11, task: 'Talk to Devi about April 4th — confirm date', category: 'Jakarta', status: 'Not Started', assigned: 'Eduardo', priority: 'High', startDate: '2026-03-24', dueDate: '2026-03-25', completedDate: '', notes: 'Eduardo (9:58pm): "Are you talking to Devi for April 4th?" Needs clarification — is Apr 4 a proposed virtual interview date?', attachments: [] },
    { id: 12, task: 'Screen and orient 15 Jakarta culinary candidates before virtual Grand Hyatt interview', category: 'Jakarta', status: 'Not Started', assigned: 'Stri Ratna', priority: 'High', startDate: '2026-03-24', dueDate: '2026-04-05', completedDate: '', notes: 'Eduardo: "The students need to be lined up online first from screening and orientation." 15 culinary candidates at Jakarta school. Do virtual first, then plan in-person event Mid-May.', attachments: [] },
    { id: 13, task: 'Plan in-person Jakarta school event — target Mid-May 2026', category: 'Jakarta', status: 'Not Started', assigned: 'Stri Ratna', priority: 'Normal', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Lindsay: "Can we do some virtual in the next week or so for those candidates that want to move quickly and then plan an in person event Mid-May?" Ratna in Asia region for next couple months.', attachments: [] },
    { id: 14, task: 'Coordinate Lindsay visit to Jakarta school — Apr 1 or 2 (morning of Apr 2)', category: 'Jakarta', status: 'Not Started', assigned: 'Robert', priority: 'Normal', startDate: '2026-03-24', dueDate: '2026-03-26', completedDate: '', notes: 'Lindsay: "I will be in Jakarta for the day on the 1st/2nd… maybe I can visit then?" Robert: "I am sure that can be arranged." Lindsay confirmed: "Just a visit — probably in the morning of the 2nd."', attachments: [] },

    // NEW OPPORTUNITY — Ritz Carlton Amelia Island
    { id: 15, task: 'Follow up on Ritz Carlton Amelia Island — Thailand recruitment in the Fall', category: 'New Opportunity', status: 'Not Started', assigned: 'Robert', priority: 'High', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Lindsay (2:00pm): "Ritz Carlton Amelia Island wants Thailand in the fall. They are an amazing employer." Eduardo: "I will talk to them about it." Plan Thailand recruitment event / fair for Fall 2026.', attachments: [] },
    { id: 16, task: 'Evaluate The Broadmoor (Forbes 5-star) as potential employer', category: 'New Opportunity', status: 'Not Started', assigned: 'Eduardo', priority: 'Normal', startDate: '2026-03-24', dueDate: '', completedDate: '', notes: 'Lindsay offered The Broadmoor for culinary candidate interviews. Eduardo: "Not under candidate expectations — bad reviews, lower pay, 6 J1 there want to find other HC." Decision: Hold. Focus on Hyatt, W, or other brands.', attachments: [] },

    // HANOVER CRM
    // JAKARTA — MCSI / PRADITA SCHOOL — from WhatsApp 3/24/2026 with Devi
    { id: 22, task: 'Sign and return updated MOU to Dewi (MCSI) and Johann — DONE', category: 'Jakarta', status: 'Completed', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-24', completedDate: '2026-03-24', notes: 'Robert (9:06pm): "I sent the updated MOU to you and Johann." Dewi confirmed receipt.', attachments: [] },
    { id: 23, task: 'Confirm Grand Hyatt virtual interview day — week of April 6 — with Dewi/Rachmat (Pradita)', category: 'Jakarta', status: 'Waiting', assigned: 'Stri Ratna', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-26', completedDate: '', notes: 'Dewi (6:59pm): "Need to check with Rahmat (Pradita) on the exact date for the week of April 6." Dewi to revert. Robert: Grand Hyatt confirmed virtual week of Apr 6. Awaiting school date confirmation.', attachments: [] },
    { id: 24, task: 'Confirm April 2 school visit — Pradita (Rachmat confirmed possible)', category: 'Jakarta', status: 'In Progress', assigned: 'Robert', priority: 'High', startDate: '2026-03-24', dueDate: '2026-03-25', completedDate: '', notes: 'Dewi (9:24pm): "Rachmat said April 2 is possible." Lindsay arriving Jakarta Apr 1/2 (morning of Apr 2). Visit only — no interviews. Robert to confirm with Lindsay (sponsor) and revert to Dewi ASAP.', attachments: [] },
    { id: 25, task: 'Confirm with Lindsay (AAG) — Apr 2 school visit agenda at Pradita', category: 'Jakarta', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-25', completedDate: '', notes: 'Dewi offered: "If you want to add an agenda to socialize the program to the students it can be arranged — visit will not only see facilities." Robert: "I will check with the sponsor and revert ASAP." Check with Lindsay (AAG) and Grand Hyatt whether Apr 2 program socialization suits them.', attachments: [] },
    { id: 26, task: 'Decide: Add program socialization agenda to Apr 2 Pradita school visit?', category: 'Jakarta', status: 'Waiting', assigned: 'Robert', priority: 'High', startDate: '2026-03-24', dueDate: '2026-03-25', completedDate: '', notes: 'Dewi suggestion: extend Apr 2 visit beyond just facilities tour — add a program presentation to students. Need to confirm suitability with Grand Hyatt and Lindsay. If yes, coordinate agenda with Dewi/Rachmat.', attachments: [] },
    { id: 27, task: 'Revert to Dewi (MCSI) with decision on Apr 2 visit + socialization', category: 'Jakarta', status: 'Not Started', assigned: 'Robert', priority: 'Urgent', startDate: '2026-03-24', dueDate: '2026-03-25', completedDate: '', notes: 'Robert promised to check with sponsor and revert ASAP. Dewi is waiting for confirmation. WhatsApp: respond to Devi MCSI.', attachments: [] },

    // CIEE HIGH SCHOOL PROGRAM — from email Mar 24, 2026
    { id: 18, task: 'Reschedule call with Andrew Clifton — CIEE High School Program Director', category: 'HS Program', status: 'Waiting', assigned: 'Robert', priority: 'High', startDate: '2026-03-24', dueDate: '2026-04-21', completedDate: '', notes: 'Pier Pennoyer offered Mar 31 or Apr 1 — Robert in transit to Asia (departs Mar 28). Reschedule after Asia return (~Apr 20). Cc: Stri Ratna, Eduardo Ferraz.', attachments: [] },
    { id: 19, task: 'Get Pier feedback on CTI-CIEE Partner Onboarding Form (6-section beta)', category: 'HS Program', status: 'Waiting', assigned: 'Robert', priority: 'Normal', startDate: '2026-03-24', dueDate: '2026-04-21', completedDate: '', notes: 'Robert sent consolidated form combining all CIEE Mexico spreadsheets into 6 sections. Designed to collect all data, compile into spreadsheet, return to CIEE. IT team working on it while Robert is in Asia.', attachments: [] },
    { id: 20, task: 'Follow up on Mexico agent concern — cruise line rep raised issue about current Mexico partner', category: 'Mexico', status: 'Waiting', assigned: 'Robert', priority: 'Normal', startDate: '2026-03-24', dueDate: '2026-04-21', completedDate: '', notes: 'One cruise agent showed interest but raised concern about current partner in Mexico. Robert: "Wants to talk it through once I return from Asia — putting on hold for now."', attachments: [] },
    { id: 17, task: 'Set up Hanover CRM — ensure all team has access and candidates are being entered', category: 'Admin', status: 'Not Started', assigned: 'Stri Ratna', priority: 'High', startDate: '2026-03-24', dueDate: '2026-03-29', completedDate: '', notes: 'Lindsay needs Hanover profiles before Mar 31 fair. URL: https://aag.hanovercrm.com/ — use email as username. Candidates must have AAG ID numbers assigned.', attachments: [] },
  ]

};

let taskSortCol = {};
let taskFilter = {};

function renderTaskGrid(clientId) {
  const container = document.getElementById('task-grid-' + clientId);
  if (!container) return;
  const tasks = taskData[clientId] || [];
  const filter = taskFilter[clientId] || 'All';

  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.status === filter);

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const counter = document.getElementById('task-counter-' + clientId);
  if (counter) counter.textContent = completedCount + ' / ' + tasks.length + ' completed';

  const cols = [
    { key: 'check',         label: '',              width: '40px' },
    { key: 'task',          label: 'Task',          width: '28%' },
    { key: 'category',      label: 'Category',      width: '9%' },
    { key: 'priority',      label: 'Priority',      width: '8%' },
    { key: 'status',        label: 'Status',        width: '11%' },
    { key: 'assigned',      label: 'Assigned To',   width: '11%' },
    { key: 'startDate',     label: 'Start Date',    width: '9%' },
    { key: 'dueDate',       label: 'Due Date',      width: '9%' },
    { key: 'completedDate', label: 'Completed',     width: '9%' },
    { key: 'notes',         label: 'Notes',         width: '14%' }
  ];

  let html = '<table class="task-table"><thead><tr>';
  cols.forEach(c => {
    html += `<th style="width:${c.width}">${c.label}</th>`;
  });
  html += '</tr></thead><tbody>';

  filtered.forEach((t, idx) => {
    const sc = STATUS_COLORS[t.status] || STATUS_COLORS['Not Started'];
    const isDone = t.status === 'Completed';
    const isCancelled = t.status === 'Cancelled';
    const rowClass = isDone ? 'tr-done' : (isCancelled ? 'tr-cancelled' : (t.priority === 'Urgent' ? 'tr-urgent' : ''));

    html += `<tr class="${rowClass}" data-id="${t.id}" data-client="${clientId}">`;

    // Checkbox
    html += `<td class="td-check"><div class="task-cb ${isDone ? 'task-cb-done' : ''}" onclick="toggleTaskDone('${clientId}',${t.id})"></div></td>`;

    // Task name (editable)
    html += `<td class="td-task"><span class="task-text ${isDone ? 'task-text-done' : ''}" contenteditable="true" onblur="updateTaskField('${clientId}',${t.id},'task',this.textContent.trim())">${escH(t.task)}</span></td>`;

    // Category (editable)
    html += `<td><span class="task-chip" contenteditable="true" onblur="updateTaskField('${clientId}',${t.id},'category',this.textContent.trim())">${escH(t.category)}</span></td>`;

    // Priority dropdown
    html += `<td>${priorityBadge(t.priority, clientId, t.id)}</td>`;

    // Status dropdown
    html += `<td><select class="task-select task-status-sel" style="background:${sc.bg};color:${sc.text}" onchange="updateStatus('${clientId}',${t.id},this.value)">`;
    STATUS_OPTIONS.forEach(s => {
      html += `<option value="${s}" ${t.status===s?'selected':''}>${s}</option>`;
    });
    html += '</select></td>';

    // Assigned dropdown
    html += `<td><select class="task-select task-assign-sel" onchange="updateTaskField('${clientId}',${t.id},'assigned',this.value)">`;
    TEAM_MEMBERS.forEach(m => {
      html += `<option value="${m}" ${t.assigned===m?'selected':''}>${m}</option>`;
    });
    html += '</select></td>';

    // Start Date
    html += `<td><input type="date" class="task-date" value="${t.startDate}" onchange="updateTaskField('${clientId}',${t.id},'startDate',this.value)"></td>`;

    // Due Date
    html += `<td><input type="date" class="task-date" value="${t.dueDate}" onchange="updateTaskField('${clientId}',${t.id},'dueDate',this.value)"></td>`;

    // Completed Date (auto or manual)
    html += `<td><input type="date" class="task-date" value="${t.completedDate}" onchange="updateTaskField('${clientId}',${t.id},'completedDate',this.value)"></td>`;

    // Notes + Attachments
    let attachHtml = '';
    if (t.attachments && t.attachments.length > 0) {
      attachHtml = '<div class="task-attach-list">' +
        t.attachments.map(a => {
          const icon = a.type === 'pdf' ? '📄' : '📊';
          return `<a class="task-attach-link" href="${a.url}" target="_blank" rel="noopener">${icon} ${escH(a.name)}</a>`;
        }).join('') +
        '</div>';
    }
    html += `<td><span class="task-notes-cell" contenteditable="true" onblur="updateTaskField('${clientId}',${t.id},'notes',this.textContent.trim())">${escH(t.notes)}</span>${attachHtml}</td>`;

    html += '</tr>';
  });

  // Add new row button
  html += `<tr class="tr-add-row"><td colspan="10"><button class="add-task-btn" onclick="addTask('${clientId}')">＋ Add Task</button></td></tr>`;
  html += '</tbody></table>';
  container.innerHTML = html;
}

function priorityBadge(priority, clientId, taskId) {
  const opts = ['Urgent','High','Normal','Low'];
  const colors = { Urgent:'#fef2f2:#991b1b', High:'#fef9c3:#854d0e', Normal:'#f0f9ff:#075985', Low:'#f1f5f9:#475569' };
  let sel = '<select class="task-select task-priority-sel" style="';
  const c = colors[priority] || colors['Normal'];
  const [bg, col] = c.split(':');
  sel += `background:${bg};color:${col}" onchange="updateTaskField('${clientId}',${taskId},'priority',this.value)">`;
  opts.forEach(o => sel += `<option value="${o}" ${priority===o?'selected':''}>${o}</option>`);
  return sel + '</select>';
}

function escH(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function updateStatus(clientId, taskId, newStatus) {
  const tasks = taskData[clientId];
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  const oldStatus = task.status;
  task.status = newStatus;
  // Auto-set completed date
  if (newStatus === 'Completed' && !task.completedDate) {
    task.completedDate = new Date().toISOString().split('T')[0];
  }
  if (newStatus !== 'Completed') { task.completedDate = ''; }
  renderTaskGrid(clientId);
}

function updateTaskField(clientId, taskId, field, value) {
  const tasks = taskData[clientId];
  const task = tasks.find(t => t.id === taskId);
  if (task) { task[field] = value; renderTaskGrid(clientId); }
}

function toggleTaskDone(clientId, taskId) {
  const tasks = taskData[clientId];
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  if (task.status === 'Completed') {
    task.status = 'In Progress';
    task.completedDate = '';
  } else {
    task.status = 'Completed';
    if (!task.completedDate) task.completedDate = new Date().toISOString().split('T')[0];
    if (!task.startDate) task.startDate = new Date().toISOString().split('T')[0];
  }
  renderTaskGrid(clientId);
}

function addTask(clientId) {
  const tasks = taskData[clientId];
  const newId = Math.max(...tasks.map(t => t.id), 0) + 1;
  tasks.push({ id: newId, task: 'New task — click to edit', category: '', status: 'Not Started', assigned: 'Unassigned', priority: 'Normal', startDate: new Date().toISOString().split('T')[0], dueDate: '', completedDate: '', notes: '' });
  renderTaskGrid(clientId);
}

function filterTasks(clientId, status) {
  taskFilter[clientId] = status;
  // Update filter button active state
  document.querySelectorAll(`[data-filter-client="${clientId}"]`).forEach(btn => {
    btn.classList.toggle('filter-btn-active', btn.dataset.filterVal === status);
  });
  renderTaskGrid(clientId);
}

function exportTasksCSV(clientId) {
  const tasks = taskData[clientId] || [];
  const headers = ['Task','Category','Priority','Status','Assigned To','Start Date','Due Date','Completed Date','Notes'];
  const rows = tasks.map(t => [t.task,t.category,t.priority,t.status,t.assigned,t.startDate,t.dueDate,t.completedDate,t.notes].map(v => '"'+(v||'').replace(/"/g,'""')+'"').join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const a = document.createElement('a');
  a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
  a.download = 'CTI-Tasks-' + clientId.toUpperCase() + '-' + new Date().toISOString().split('T')[0] + '.csv';
  a.click();
}

// Initialize grids on load
document.addEventListener('DOMContentLoaded', () => {
  renderTaskGrid('ciee');
  renderTaskGrid('aag');
  renderTaskGrid('cti');
});
