/**
 * FORMATTING + SCHEDULING HELPERS
 * Pure functions shared by the booking slip and the role screens.
 */

const SLOT_MINUTES = 30;
const BOOKING_WINDOW_DAYS = 14;

/** YYYY-MM-DD in local time (what the API's dateSchema expects). */
export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * The API returns DATE columns as ISO timestamps (pg converts them to JS Dates).
 * Read either form back into a local calendar date.
 */
export function parseApiDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function formatDate(value, options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = value instanceof Date ? value : parseApiDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('en-PH', options);
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-PH', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

/** "14:30:00" -> "2:30 PM" */
export function formatTime(value) {
  if (!value) return '—';
  const [h, m] = value.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatFee(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 'Fee not listed';
  return `₱${amount.toLocaleString('en-PH', { maximumFractionDigits: 0 })}`;
}

export function doctorName(doctor) {
  return `Dr. ${doctor.first_name} ${doctor.last_name}`;
}

/** Appointment serial printed on slips and stubs, derived from the record's UUID. */
export function serialFor(id) {
  return id ? `SC-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}` : 'SC-······';
}

function minutesOf(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function timeOf(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

/**
 * Open days for a doctor's weekly schedule over the booking window.
 * Each day carries its 30-minute slots; slots already in the past are dropped.
 */
export function openDays(schedule, now = new Date()) {
  const days = [];
  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const blocks = schedule.filter((row) => row.day_of_week === date.getDay());
    const slots = [];
    for (const block of blocks) {
      for (let t = minutesOf(block.start_time); t + SLOT_MINUTES <= minutesOf(block.end_time); t += SLOT_MINUTES) {
        const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), Math.floor(t / 60), t % 60);
        if (slotStart > now) slots.push(timeOf(t));
      }
    }
    if (slots.length) days.push({ date, iso: toISODate(date), slots });
  }
  return days;
}

export function isUpcoming(appointment, now = new Date()) {
  const date = parseApiDate(appointment.appointment_date);
  if (!date) return false;
  const [h, m] = appointment.appointment_time.split(':').map(Number);
  date.setHours(h, m);
  return date >= now;
}

export const STATUS_LABEL = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show'
};

/** Pull the first useful message out of an API error response. */
export function apiError(error, fallback) {
  const data = error?.response?.data;
  if (data?.details?.length) return data.details.map((d) => d.message).join('. ');
  return data?.error || fallback;
}
