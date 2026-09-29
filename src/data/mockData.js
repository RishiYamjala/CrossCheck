export const SYSTEMS = [
  { id: 'attendance', name: 'Attendance', short: 'ATT', color: '#d9f15d', soft: 'rgba(217,241,93,.14)' },
  { id: 'gate', name: 'ID Gate', short: 'GATE', color: '#44d18a', soft: 'rgba(68,209,138,.14)' },
  { id: 'wifi', name: 'Campus Wi-Fi', short: 'WIFI', color: '#b183ff', soft: 'rgba(177,131,255,.14)' },
  { id: 'portal', name: 'Student Portal', short: 'PORTAL', color: '#f59b58', soft: 'rgba(245,155,88,.14)' },
  { id: 'library', name: 'Library', short: 'LIB', color: '#f5cd5c', soft: 'rgba(245,205,92,.14)' },
];

export const student = { id: 'S002', name: 'Ravi Kumar', shortName: 'Ravi', campus: 'SRM University–AP · Amaravati', events: [
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

export const campusPlaces = [
  { id: 'main-gate', name: 'SRM AP Main Gate', type: 'Access', detail: 'Open · ID verification available', x: 12, y: 72, color: '#44d18a' },
  { id: 'central-library', name: 'SRM AP Central Library', type: 'Study', detail: 'Open until 22:00 · 2nd floor maintenance', x: 46, y: 30, color: '#f5cd5c' },
  { id: 'academic-block', name: 'SRM AP Academic Block', type: 'Classes', detail: 'Classrooms · lecture halls · labs', x: 72, y: 22, color: '#d9f15d' },
  { id: 'research-labs', name: 'SRM AP Research Labs', type: 'Labs', detail: 'Research and project spaces', x: 84, y: 40, color: '#16aab4' },
  { id: 'hostels', name: 'SRM AP Hostels', type: 'Residence', detail: 'Residential amenities · Hostel-B Wi-Fi maintenance', x: 78, y: 76, color: '#b183ff' },
  { id: 'mess', name: 'SRM AP Student Mess', type: 'Food', detail: 'Lunch served 12:00–14:00', x: 32, y: 75, color: '#f59b58' },
  { id: 'cafeteria', name: 'SRM AP Cafeteria', type: 'Food', detail: 'Coffee, snacks, and quick meals', x: 22, y: 48, color: '#f59b58' },
  { id: 'sports', name: 'SRM AP Sports Arena', type: 'Sports', detail: 'Track · courts · indoor gym', x: 15, y: 24, color: '#44d18a' },
  { id: 'auditorium', name: 'SRM AP Auditorium', type: 'Events', detail: 'Talks, performances, and campus events', x: 36, y: 20, color: '#e58cdb' },
  { id: 'innovation', name: 'SRM AP Innovation Hub', type: 'Student life', detail: 'Clubs, projects, and maker spaces', x: 57, y: 68, color: '#16aab4' },
  { id: 'medical', name: 'SRM AP Medical Centre', type: 'Health', detail: 'Student health support', x: 55, y: 85, color: '#d95050' },
  { id: 'parking', name: 'SRM AP Parking', type: 'Transport', detail: 'Student and visitor parking', x: 90, y: 87, color: '#8196a5' },
];

export const textbookListings = [
  { id: 'book-1', title: 'Data Structures in C', subject: 'CS101', seller: 'Aisha · 2nd year', price: '₹450', condition: 'Good condition', pickup: 'Block A lobby', color: '#4f9cf9' },
  { id: 'book-2', title: 'Computer Networks: A Top-Down Approach', subject: 'CS204', seller: 'Vikram · 3rd year', price: '₹700', condition: 'Like new', pickup: 'Central Library', color: '#b183ff' },
  { id: 'book-3', title: 'Database System Concepts', subject: 'CS212', seller: 'Neha · 4th year', price: '₹520', condition: 'Highlighted notes included', pickup: 'Student Center', color: '#f59b58' },
];

export const studyGroups = [
  { id: 'group-1', subject: 'CS101 · Graphs & Trees', members: 4, max: 6, when: 'Today · 18:30', where: 'Library 2nd floor', host: 'Arjun', color: '#4f9cf9' },
  { id: 'group-2', subject: 'CS204 · TCP Revision', members: 3, max: 5, when: 'Wed · 17:00', where: 'Tech Hall lounge', host: 'Meera', color: '#b183ff' },
  { id: 'group-3', subject: 'CS212 · Exam prep', members: 5, max: 8, when: 'Fri · 16:00', where: 'Block B 118', host: 'Karan', color: '#f59b58' },
];

export const srmapClubs = [
  { id: 'club-1', name: 'Coding Club', category: 'Technology', next: 'Hack Night', members: 86, color: '#4f9cf9' },
  { id: 'club-2', name: 'Dramatics Society', category: 'Culture', next: 'Open Auditions', members: 42, color: '#e58cdb' },
  { id: 'club-3', name: 'E-Cell SRM AP', category: 'Entrepreneurship', next: 'Founder Fireside', members: 64, color: '#f59b58' },
  { id: 'club-4', name: 'Sports Council', category: 'Sports', next: 'Inter-hostel trials', members: 118, color: '#44d18a' },
];

export const srmapEvents = [
  { id: 'event-1', day: 'Mon', date: '12', month: 'OCT', title: 'Coding Club · Hack Night', place: 'Innovation Hub', time: '18:30–20:30', category: 'Club', color: '#d9f15d' },
  { id: 'event-2', day: 'Tue', date: '13', month: 'OCT', title: 'Dramatics · Open Auditions', place: 'SRM AP Auditorium', time: '17:00–19:00', category: 'Culture', color: '#e58cdb' },
  { id: 'event-3', day: 'Wed', date: '14', month: 'OCT', title: 'E-Cell · Founder Fireside', place: 'Student Center', time: '16:00–17:30', category: 'Talk', color: '#f59b58' },
  { id: 'event-4', day: 'Thu', date: '15', month: 'OCT', title: 'Sports Council · Trials', place: 'Sports Arena', time: '16:30–18:30', category: 'Sports', color: '#44d18a' },
  { id: 'event-5', day: 'Fri', date: '16', month: 'OCT', title: 'SRM AP Open Mic', place: 'Cafeteria Courtyard', time: '19:00–21:00', category: 'Campus', color: '#16aab4' },
];

export const shuttleRoutes = [
  { id: 'route-a', name: 'Route A · Main Gate loop', status: 'On time', eta: '4 min', vehicle: 'SRM-AP 08', color: '#d9f15d', stops: ['Main Gate', 'Academic Block', 'Central Library', 'Hostels', 'Student Mess'], nextStop: 'Academic Block', departures: ['07:30', '08:15', '09:00', '10:00', '12:00', '16:30', '18:00'] },
  { id: 'route-b', name: 'Route B · Hostel connector', status: 'Approaching', eta: '2 min', vehicle: 'SRM-AP 12', color: '#b183ff', stops: ['Hostels', 'Sports Arena', 'Innovation Hub', 'Academic Block', 'Main Gate'], nextStop: 'Sports Arena', departures: ['07:45', '08:45', '10:15', '12:30', '15:30', '17:30', '19:00'] },
  { id: 'route-c', name: 'Route C · Evening campus', status: 'Delayed 6 min', eta: '11 min', vehicle: 'SRM-AP 04', color: '#f59b58', stops: ['Student Mess', 'Central Library', 'Auditorium', 'Cafeteria', 'Hostels'], nextStop: 'Central Library', departures: ['16:00', '17:00', '18:00', '19:00', '20:00', '21:00'] },
];
