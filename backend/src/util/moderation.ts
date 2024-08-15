
function plural(num: number, singular: string) {
  return num === 1 ? singular : singular + "s";
}

/**
 * Translates seconds into human readable format of seconds, minutes, hours, days, and years
 * 
 * @param  {number} seconds The number of seconds to be processed
 * @return {string}         The phrase describing the amount of time
 */
function forHumans(date: Date) {
  const seconds = Math.floor(Math.abs(new Date().getTime() - date.getTime()) / 1000);

  const levels: [number, string][] = [
    [Math.floor(seconds / 31536000), 'year'],
    [Math.floor((seconds % 31536000) / 86400), 'day'],
    [Math.floor(((seconds % 31536000) % 86400) / 3600), 'hour'],
    [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'minute'],
    [(((seconds % 31536000) % 86400) % 3600) % 60, 'second'],
  ];

  return levels.filter((level) => level[0] !== 0).slice(0, 2).map((level) => {
    return `${level[0]} ${plural(level[0], level[1])}`;
  }).join(' and ');
}

export function banKickMessage(until?: Date | null | -1, reason?: string | null) {
  const time = until && until !== -1 ? ` for ${forHumans(until)}` : " permanently";
  return reason ? `Banned${time}: ${reason}` : `You are banned from this game${time}`;
}
