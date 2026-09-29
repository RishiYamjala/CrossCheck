export const SYSTEMS = [
  { id: 'attendance', name: 'Attendance', short: 'ATT', color: '#4f9cf9', soft: 'rgba(79,156,249,.14)' },
  { id: 'gate', name: 'ID Gate', short: 'GATE', color: '#44d18a', soft: 'rgba(68,209,138,.14)' },
  { id: 'wifi', name: 'Campus Wi-Fi', short: 'WIFI', color: '#b183ff', soft: 'rgba(177,131,255,.14)' },
  { id: 'portal', name: 'Student Portal', short: 'PORTAL', color: '#f59b58', soft: 'rgba(245,155,88,.14)' },
  { id: 'library', name: 'Library', short: 'LIB', color: '#f5cd5c', soft: 'rgba(245,205,92,.14)' },
];

export const students = [
  { id: 'S001', name: 'Priya', note: 'Clean baseline', events: [
    { id: 's1-gate', system: 'gate', time: '09:15', description: 'Entry at North Gate', kind: 'entry', building: 'Campus' },
    { id: 's1-att', system: 'attendance', time: '10:00', description: 'Present · CS101', kind: 'present', classCode: 'CS101' },
    { id: 's1-wifi', system: 'wifi', time: '10:05', description: 'Connected · Block A', kind: 'device', building: 'Block A' },
    { id: 's1-portal', system: 'portal', time: '10:30', description: 'Login from Amaravati', kind: 'login', location: 'Amaravati', distance: 0 },
    { id: 's1-lib', system: 'library', time: '12:00', description: 'Card swipe · Main Library', kind: 'swipe', building: 'Main Library' },
  ]},
  { id: 'S002', name: 'Ravi', note: 'Gate exit contradiction', events: [
    { id: 's2-gate', system: 'gate', time: '09:40', description: 'EXIT at East Gate · no re-entry', kind: 'exit', building: 'Campus' },
    { id: 's2-att', system: 'attendance', time: '10:00', description: 'Present · CS101', kind: 'present', classCode: 'CS101' },
  ]},
  { id: 'S003', name: 'Ananya', note: 'Remote login anomaly', events: [
    { id: 's3-gate', system: 'gate', time: '13:30', description: 'Entry at South Gate', kind: 'entry', building: 'Campus' },
    { id: 's3-portal', system: 'portal', time: '13:50', description: 'Login from Hyderabad · 270 km away', kind: 'login', location: 'Hyderabad', distance: 270 },
    { id: 's3-att', system: 'attendance', time: '14:00', description: 'Present · CS204', kind: 'present', classCode: 'CS204' },
  ]},
  { id: 'S004', name: 'Karthik', note: 'Card and device mismatch', events: [
    { id: 's4-gate', system: 'gate', time: '09:00', description: 'Entry at North Gate', kind: 'entry', building: 'Campus' },
    { id: 's4-lib', system: 'library', time: '11:00', description: 'Card swipe · Central Library', kind: 'swipe', building: 'Central Library' },
    { id: 's4-wifi', system: 'wifi', time: '11:02', description: 'Registered laptop · Hostel-B AP', kind: 'device', building: 'Hostel-B', distanceFromLibrary: 0.8 },
  ]},
];

export const RULES = [
  { number: '01', title: 'Ghost Attendance', systems: ['Attendance', 'ID Gate'], text: 'Marked present after the last gate event was an exit.' },
  { number: '02', title: 'Impossible Travel', systems: ['Student Portal', 'ID Gate'], text: 'A remote login appears too close to a campus gate entry.' },
  { number: '03', title: 'Possible ID Card Misuse', systems: ['Library', 'Campus Wi-Fi'], text: 'A card swipe and registered device disagree on the building.' },
];

const minutes = (time) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };

// Cross-system detection intentionally stays plain JavaScript and readable.
export function detectConflicts(student, enabledSystems) {
  const has = (system) => enabledSystems.includes(system);
  const events = student.events;
  const conflicts = [];

  // Rule 1: Ghost Attendance — Attendance + Gate.
  if (has('attendance') && has('gate')) {
    events.filter((event) => event.system === 'attendance' && event.kind === 'present').forEach((attendance) => {
      const previousGate = events.filter((event) => event.system === 'gate' && minutes(event.time) <= minutes(attendance.time)).sort((a, b) => minutes(b.time) - minutes(a.time))[0];
      if (previousGate?.kind === 'exit') conflicts.push({ id: `${student.id}-ghost`, type: 'Ghost Attendance', severity: 'Medium', systems: ['Attendance', 'ID Gate'], action: 'Flag for faculty review.', explanation: `${student.name} is marked Present for ${attendance.classCode}, but the last gate event before class was an exit.`, eventIds: [previousGate.id, attendance.id] });
    });
  }

  // Rule 2: Impossible Travel — Portal + Gate.
  if (has('portal') && has('gate')) {
    events.filter((event) => event.system === 'portal' && event.kind === 'login' && event.distance > 50).forEach((login) => {
      const campusEntry = events.filter((event) => event.system === 'gate' && event.kind === 'entry' && minutes(login.time) >= minutes(event.time) && minutes(login.time) - minutes(event.time) <= 60).sort((a, b) => minutes(b.time) - minutes(a.time))[0];
      if (campusEntry) conflicts.push({ id: `${student.id}-travel`, type: 'Impossible Travel', severity: 'High', systems: ['Student Portal', 'ID Gate'], action: 'Force password reset and enable MFA.', explanation: `${student.name} logged in from ${login.location}, ${login.distance} km away, only ${minutes(login.time) - minutes(campusEntry.time)} minutes after entering campus.`, eventIds: [campusEntry.id, login.id] });
    });
  }

  // Rule 3: Possible ID Card Misuse — Library + Wi-Fi.
  if (has('library') && has('wifi')) {
    events.filter((event) => event.system === 'library' && event.kind === 'swipe').forEach((swipe) => {
      const device = events.find((event) => event.system === 'wifi' && event.kind === 'device' && Math.abs(minutes(event.time) - minutes(swipe.time)) <= 5 && event.building !== swipe.building);
      if (device) conflicts.push({ id: `${student.id}-card`, type: 'Possible ID Card Misuse', severity: 'High', systems: ['Library', 'Campus Wi-Fi'], action: 'Notify campus security and temporarily block the card.', explanation: `The library card was used at ${swipe.building}, while the registered laptop was active at ${device.building} just ${Math.abs(minutes(device.time) - minutes(swipe.time))} minutes later.`, eventIds: [swipe.id, device.id] });
    });
  }
  return conflicts;
}
