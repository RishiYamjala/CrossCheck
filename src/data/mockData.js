export const SYSTEMS = [
  { id: 'attendance', name: 'Attendance', short: 'ATT', color: '#4f9cf9', soft: 'rgba(79,156,249,.14)' },
  { id: 'gate', name: 'ID Gate', short: 'GATE', color: '#44d18a', soft: 'rgba(68,209,138,.14)' },
  { id: 'wifi', name: 'Campus Wi-Fi', short: 'WIFI', color: '#b183ff', soft: 'rgba(177,131,255,.14)' },
  { id: 'portal', name: 'Student Portal', short: 'PORTAL', color: '#f59b58', soft: 'rgba(245,155,88,.14)' },
  { id: 'library', name: 'Library', short: 'LIB', color: '#f5cd5c', soft: 'rgba(245,205,92,.14)' },
];

export const student = { id: 'S002', name: 'Ravi Kumar', shortName: 'Ravi', campus: 'Amaravati', events: [
  { id: 'ravi-gate-1', system: 'gate', time: '08:45', description: 'Entry · Main Gate', kind: 'entry', building: 'Main Gate' },
  { id: 'ravi-wifi-1', system: 'wifi', time: '08:55', description: 'Ravi-Laptop connected · Block A', kind: 'device', building: 'Block A' },
  { id: 'ravi-portal-1', system: 'portal', time: '09:05', description: 'Login from Hyderabad · 270 km away', kind: 'login', location: 'Hyderabad', distance: 270 },
  { id: 'ravi-gate-2', system: 'gate', time: '09:30', description: 'Exit · Main Gate', kind: 'exit', building: 'Main Gate' },
  { id: 'ravi-att', system: 'attendance', time: '10:00', description: 'Marked Present · CS101 · Block A', kind: 'present', classCode: 'CS101', building: 'Block A' },
  { id: 'ravi-gate-3', system: 'gate', time: '10:45', description: 'Entry · Main Gate', kind: 'entry', building: 'Main Gate' },
  { id: 'ravi-lib', system: 'library', time: '11:00', description: 'ID card swiped · Central Library', kind: 'swipe', building: 'Central Library' },
  { id: 'ravi-wifi-2', system: 'wifi', time: '11:02', description: 'Ravi-Laptop connected · Hostel-B', kind: 'device', building: 'Hostel-B', distanceFromLibrary: 0.8 },
  { id: 'ravi-portal-2', system: 'portal', time: '12:30', description: 'Login from Amaravati', kind: 'login', location: 'Amaravati', distance: 0 },
]};

export const RULES = [
  { number: '01', title: 'Attendance in Your Name', systems: ['Attendance', 'ID Gate'], text: 'A Present mark appears after your ID card scanned out.' },
  { number: '02', title: 'Account Login Check', systems: ['Student Portal', 'ID Gate'], text: 'A login from far away appears right after you entered campus.' },
  { number: '03', title: 'Library Card Check', systems: ['Library', 'Campus Wi-Fi'], text: 'Your card and laptop appear in different buildings at once.' },
];

const minutes = (time) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };

// Cross-system detection intentionally stays plain JavaScript and readable.
export function detectConflicts(currentStudent, enabledSystems) {
  const has = (system) => enabledSystems.includes(system);
  const events = currentStudent.events;
  const conflicts = [];

  // Rule 1: Attendance in Your Name — Attendance + ID Gate.
  if (has('attendance') && has('gate')) {
    const attendance = events.find((event) => event.system === 'attendance' && event.kind === 'present');
    const previousGate = events.filter((event) => event.system === 'gate' && minutes(event.time) <= minutes(attendance.time)).sort((a, b) => minutes(b.time) - minutes(a.time))[0];
    if (attendance && previousGate?.kind === 'exit') conflicts.push({ id: 'attendance-alert', type: 'Attendance in Your Name', severity: 'Medium', title: 'Someone may have marked attendance for you.', explanation: `You’re marked Present in ${attendance.classCode} at ${attendance.time}, but your ID card scanned out of the Main Gate at ${previousGate.time}.`, actionLabel: 'Not me, report it', resolution: 'report', systems: ['Attendance', 'ID Gate'], action: 'Sent to your faculty for review', eventIds: [previousGate.id, attendance.id] });
  }

  // Rule 2: Account Login Check — Student Portal + ID Gate.
  if (has('portal') && has('gate')) {
    const remoteLogin = events.find((event) => event.system === 'portal' && event.kind === 'login' && event.distance > 50);
    const campusEntry = events.filter((event) => event.system === 'gate' && event.kind === 'entry' && minutes(remoteLogin?.time || '00:00') >= minutes(event.time) && minutes(remoteLogin?.time || '00:00') - minutes(event.time) <= 60).sort((a, b) => minutes(b.time) - minutes(a.time))[0];
    if (remoteLogin && campusEntry) conflicts.push({ id: 'account-alert', type: 'Account Login Check', severity: 'High', title: 'Your account may be compromised.', explanation: `Your portal was logged into from ${remoteLogin.location} at ${remoteLogin.time}, just ${minutes(remoteLogin.time) - minutes(campusEntry.time)} minutes after your ID card scanned in at campus.`, actionLabel: 'Not me, reset my password', resolution: 'reset', systems: ['Student Portal', 'ID Gate'], action: 'Reset link sent and MFA enabled (demo)', eventIds: [campusEntry.id, remoteLogin.id] });
  }

  // Rule 3: Library Card Check — Library + Wi-Fi.
  if (has('library') && has('wifi')) {
    const swipe = events.find((event) => event.system === 'library' && event.kind === 'swipe');
    const device = events.find((event) => event.system === 'wifi' && event.kind === 'device' && Math.abs(minutes(event.time) - minutes(swipe?.time || '00:00')) <= 5 && event.building !== swipe?.building);
    if (swipe && device) conflicts.push({ id: 'library-alert', type: 'Library Card Check', severity: 'High', title: 'Your library card may have been used by someone else.', explanation: `Your card was swiped at the ${swipe.building} at ${swipe.time}, but your laptop connected at ${device.building} at ${device.time}.`, actionLabel: 'Not me, block my card', resolution: 'block', systems: ['Library', 'Campus Wi-Fi'], action: 'Card blocked, security notified (demo)', eventIds: [swipe.id, device.id] });
  }
  return conflicts;
}

export const timetable = [
  { day: 'Mon', subject: 'Data Structures', code: 'CS101', room: 'Block A · 204', time: '10:00–11:00', color: '#4f9cf9' },
  { day: 'Tue', subject: 'Computer Networks', code: 'CS204', room: 'Tech Hall · 302', time: '09:00–10:00', color: '#b183ff' },
  { day: 'Wed', subject: 'Database Systems', code: 'CS212', room: 'Block B · 118', time: '11:00–12:00', color: '#f59b58' },
  { day: 'Thu', subject: 'Operating Systems', code: 'CS305', room: 'Innovation Lab', time: '14:00–15:30', color: '#44d18a' },
  { day: 'Fri', subject: 'Software Engineering', code: 'CS318', room: 'Block A · 110', time: '10:00–11:00', color: '#f5cd5c' },
];

export const attendanceSummary = [
  { code: 'CS101', subject: 'Data Structures', attended: 21, total: 24, color: '#4f9cf9' },
  { code: 'CS204', subject: 'Computer Networks', attended: 18, total: 20, color: '#b183ff' },
  { code: 'CS212', subject: 'Database Systems', attended: 16, total: 19, color: '#f59b58' },
  { code: 'CS305', subject: 'Operating Systems', attended: 20, total: 22, color: '#44d18a' },
];

export const messMenu = [
  { day: 'Mon', lunch: 'Rajma rice · Curd', dinner: 'Roti · Paneer curry' },
  { day: 'Tue', lunch: 'Veg biryani · Raita', dinner: 'Dal khichdi · Salad' },
  { day: 'Wed', lunch: 'Lemon rice · Sambar', dinner: 'Noodles · Manchurian' },
  { day: 'Thu', lunch: 'Chole · Jeera rice', dinner: 'Dosa · Coconut chutney' },
  { day: 'Fri', lunch: 'Fried rice · Soup', dinner: 'Chapati · Mixed veg' },
  { day: 'Sat', lunch: 'Pulao · Dal fry', dinner: 'Pizza · Sweet corn' },
  { day: 'Sun', lunch: 'Special thali', dinner: 'Idli · Sambar' },
];

export const maintenanceAlerts = [
  { id: 'maint-1', place: 'Hostel-B Wi-Fi', message: 'Scheduled maintenance tonight', time: '22:00–23:30', level: 'planned' },
  { id: 'maint-2', place: 'Central Library · 2nd floor', message: 'Study zone lights being repaired', time: 'Until 16:00 today', level: 'notice' },
  { id: 'maint-3', place: 'Main Gate', message: 'Normal access · no issues reported', time: 'Updated 09:15', level: 'clear' },
];

export const classTopics = [
  { subject: 'Data Structures', code: 'CS101', topic: 'Graph traversal: BFS and DFS', taught: 'Today · 10:00', teacher: 'Dr. Meera Rao' },
  { subject: 'Computer Networks', code: 'CS204', topic: 'Transport layer and TCP flow control', taught: 'Yesterday · 09:00', teacher: 'Prof. Arjun Singh' },
  { subject: 'Database Systems', code: 'CS212', topic: 'Normalization and functional dependencies', taught: 'Mon · 11:00', teacher: 'Dr. Kavya Nair' },
];

export const examMaterials = [
  { subject: 'Data Structures', code: 'CS101', type: 'Revision notes', detail: 'Trees, graphs, and complexity cheat sheet', size: '2.4 MB' },
  { subject: 'Computer Networks', code: 'CS204', type: 'Practice paper', detail: 'Mid-semester mock questions with answers', size: '1.8 MB' },
  { subject: 'Database Systems', code: 'CS212', type: 'Formula sheet', detail: 'SQL patterns and normalization examples', size: '920 KB' },
];
