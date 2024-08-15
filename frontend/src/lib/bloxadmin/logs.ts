import { API_BASE, encodePath } from "./api";

export interface Log {
  message: string;
  messageType: 'MessageOutput' | 'MessageInfo' | 'MessageWarning' | 'MessageError';
  time: string;
};

export const getLogsEventSource = (gameIdentifier: string, serverIdentifier: string): EventSource => {
  return new EventSource(API_BASE + encodePath`/games/${gameIdentifier}/servers/${serverIdentifier}/logs`, {
    withCredentials: true
  });
};
