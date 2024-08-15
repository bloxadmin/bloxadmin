const DECIMAL_PLACES = 2;

export const formatBytes = (bytes: number): string => {
  if (Math.abs(bytes) < 1024) return bytes + " B";

  const units = ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];

  let u = -1;
  const r = 10 ** DECIMAL_PLACES;

  do {
    bytes /= 1024;
    ++u;
  } while (Math.round(Math.abs(bytes) * r) / r >= 1024 && u < units.length - 1);

  return bytes.toFixed(DECIMAL_PLACES) + " " + units[u];
};

export const formatMilliseconds = (milliseconds: number): string => {
  if (milliseconds < 1000) return milliseconds + "ms";

  return (milliseconds / 1000).toFixed(DECIMAL_PLACES) + "s";
};

// To-do: Format duration
export const formatDuration = (seconds: number): string => {
  let minutes = Math.floor(seconds / 60);
  seconds -= minutes * 60;

  if (minutes < 60) return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);

  const hours = Math.floor(minutes / 60);
  minutes -= hours * 60;

  return hours + ":" + (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds)
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
  style: "narrow",
})

const DIVISIONS: {
  amount: number,
  name: Intl.RelativeTimeFormatUnit,
}[] = [
    { amount: 60, name: "seconds" },
    { amount: 60, name: "minutes" },
    { amount: 24, name: "hours" },
    { amount: 7, name: "days" },
    { amount: 4.34524, name: "weeks" },
    { amount: 12, name: "months" },
    { amount: Number.POSITIVE_INFINITY, name: "years" },
  ]

export function formatTimeAgo(date: number) {
  let duration = (date - new Date().getTime()) / 1000

  for (let i = 0; i < DIVISIONS.length; i++) {
    const division = DIVISIONS[i]
    if (Math.abs(duration) < division.amount) {
      return relativeFormatter.format(Math.round(duration), division.name)
    }
    duration /= division.amount
  }
}
