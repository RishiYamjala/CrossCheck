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
