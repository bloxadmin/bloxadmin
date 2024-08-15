import { formatBytes, formatMilliseconds } from "../format";
import { encodePath, request } from "./api";

export type Interval =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "3h"
  | "6h"
  | "12h"
  | "1d";

export type StackIdentifier =
  | "memory"
  | "network"
  | "primitives"
  | "playerJoins"
  | "playerRetention";

export interface Duration {
  text: string,
  interval: [number, number],
  getStart: (stop: Date) => Date
}

export interface ChartOptions {
  name: string,
  stat: StatisticIdentifier,
  interval: Interval,
  start: string,
  stop: string,
  serverId?: string,
  fillEmpty?: "zero" | "last"
}

export type Unit = "players" | "servers" | "seconds" | "kbps" | "count" | "bytes";

export interface Series {
  name: string,
  data?: [number, number][];
  unit?: Unit;
  displayValue?: number;
}

export interface Annotation {
  id: number;
  start: string;
  stop?: string;
  title: string;
  description: string;
  link: string;
  type: "roblox_down" | "insight" | "event" | "error" | "holiday" | "other";
}

export interface StatisticNormalized {
  identifier: StatisticIdentifier,
  text: string,
  formatY: (y: number, unit?: Unit) => string,
  stackIdentifier?: StackIdentifier
}

export interface Statistic {
  identifier: StatisticIdentifier,
  text: string,
  formatY?: (y: number) => string,
  stackIdentifier?: StackIdentifier
}

export interface Stack {
  identifier: StackIdentifier,
  text: string,
  formatY?: (y: number) => string,
  format: (text: string) => string
}

export type StatisticIdentifier =
  | "onlinePlayers.onlinePlayers"
  | "activeServers.activeServers"
  // | "heartbeat.heartbeatTimeMs"
  // | "physicsStep.physicsStepTime"
  // | "primitives.movingPrimitivesCount"
  // | "primitives.primitivesCount"
  // | "network.dataReceive"
  // | "network.dataSend"
  // | "network.physicsReceive"
  // | "network.physicsSend"
  // | "contacts.contactsCount"
  // | "instances.instanceCount"
  // | "memory.animation"
  // | "memory.geometryCsg"
  // | "memory.graphicsMeshParts"
  // | "memory.graphicsParticles"
  // | "memory.graphicsParts"
  // | "memory.graphicsSolidModels"
  // | "memory.graphicsSpatialHash"
  // | "memory.graphicsTerrain"
  // | "memory.graphicsTextureCharacter"
  // | "memory.graphicsTexture"
  // | "memory.gui"
  // | "memory.httpCache"
  // | "memory.instances"
  // | "memory.internal"
  // | "memory.luaHeap"
  // | "memory.navigation"
  // | "memory.physicsCollision"
  // | "memory.physicsParts"
  // | "memory.script"
  // | "memory.signals"
  // | "memory.sounds"
  // | "memory.streamingSounds"
  // | "memory.terrainVoxels"
  // | "memory.total"
  | "playerJoins.playerJoins"
  | "playerJoins.desktop"
  | "playerJoins.mobile"
  | "playerJoins.console"
  | "playerJoins.unknown"
  | "playerRetention.new"
  | "playerRetention.returning";

export const intervals: Interval[] = ["1m", "5m", "15m", "30m", "1h", "2h", "3h", "6h", "12h", "1d"];

export const durations: Duration[] = [
  {
    text: "Last hour",
    interval: [0, 2],
    getStart: (stop: Date) => {
      const start: Date = new Date(stop);
      start.setHours(start.getHours() - 1);
      return start;
    }
  },
  {
    text: "Last day",
    interval: [3, 6],
    getStart: (stop: Date) => {
      const start: Date = new Date(stop);
      start.setDate(start.getDate() - 1);
      return start;
    }
  },
  {
    text: "Last week",
    interval: [7, 10],
    getStart: (stop: Date) => {
      const start: Date = new Date(stop);
      start.setDate(start.getDate() - 7);
      return start;
    }
  },
  {
    text: "Last month",
    interval: [7, 10],
    getStart: (stop: Date) => {
      const start: Date = new Date(stop);
      start.setMonth(start.getMonth() - 1);
      return start;
    }
  }
];

export const DEFAULT_INTERVAL = "1m";
export const DEFAULT_DURATION = durations[0];

export const statistics: Statistic[] = [
  {
    identifier: "onlinePlayers.onlinePlayers",
    text: "Online players",
  },
  {
    identifier: "activeServers.activeServers",
    text: "Active servers",
  },
  // {
  //   identifier: "heartbeat.heartbeatTimeMs",
  //   text: "Heartbeat time",
  //   formatY: formatMilliseconds
  // },
  // {
  //   identifier: "physicsStep.physicsStepTime",
  //   text: "Physics step time",
  //   formatY: formatMilliseconds
  // },
  // {
  //   identifier: "primitives.movingPrimitivesCount",
  //   text: "Moving",
  //   stackIdentifier: "primitives"
  // },
  // {
  //   identifier: "primitives.primitivesCount",
  //   text: "Total",
  //   stackIdentifier: "primitives"
  // },
  // {
  //   identifier: "network.dataReceive",
  //   text: "Data received",
  //   stackIdentifier: "network"
  // },
  // {
  //   identifier: "network.dataSend",
  //   text: "Data sent",
  //   stackIdentifier: "network"
  // },
  // {
  //   identifier: "network.physicsReceive",
  //   text: "Physics received",
  //   stackIdentifier: "network"
  // },
  // {
  //   identifier: "network.physicsSend",
  //   text: "Physics sent",
  //   stackIdentifier: "network"
  // },
  // {
  //   identifier: "contacts.contactsCount",
  //   text: "Contacts",
  // },
  // {
  //   identifier: "instances.instanceCount",
  //   text: "Instances",
  // },
  // {
  //   identifier: "memory.animation",
  //   text: "Animation",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.geometryCsg",
  //   text: "Geometry CSG",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.graphicsMeshParts",
  //   text: "Graphics mesh parts",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.graphicsParticles",
  //   text: "Graphics particles",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.graphicsParts",
  //   text: "Graphic parts",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.graphicsSolidModels",
  //   text: "Graphics solid models",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.graphicsSpatialHash",
  //   text: "Graphics spatial hash",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.graphicsTerrain",
  //   text: "Graphics terrain",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.graphicsTextureCharacter",
  //   text: "Graphics texture character",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.graphicsTexture",
  //   text: "Graphics texture",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.gui",
  //   text: "GUI",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.httpCache",
  //   text: "HTTP cache",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.instances",
  //   text: "Instances",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.internal",
  //   text: "Internal",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.luaHeap",
  //   text: "Lua heap",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.navigation",
  //   text: "Navigation",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.physicsCollision",
  //   text: "Physics collision",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.physicsParts",
  //   text: "Physics parts",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.script",
  //   text: "Script",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.signals",
  //   text: "Signals",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.sounds",
  //   text: "Sounds",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.streamingSounds",
  //   text: "Streaming sounds",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.terrainVoxels",
  //   text: "Terrain voxels",
  //   stackIdentifier: "memory"
  // },
  // {
  //   identifier: "memory.total",
  //   text: "Total",
  //   stackIdentifier: "memory"
  // },
  {
    identifier: "playerJoins.playerJoins",
    text: "Total",
    stackIdentifier: "playerJoins"
  },
  {
    identifier: "playerJoins.desktop",
    text: "Desktop",
    stackIdentifier: "playerJoins"
  },
  {
    identifier: "playerJoins.mobile",
    text: "Mobile",
    stackIdentifier: "playerJoins"
  },
  {
    identifier: "playerJoins.console",
    text: "Console",
    stackIdentifier: "playerJoins"
  },
  {
    identifier: "playerJoins.unknown",
    text: "Unknown",
    stackIdentifier: "playerJoins"
  },
  {
    identifier: "playerRetention.new",
    text: "New",
    stackIdentifier: "playerRetention",
  },
  {
    identifier: "playerRetention.returning",
    text: "Returning",
    stackIdentifier: "playerRetention",
  }
];

export const defaultFormatY = (y: number) => y?.toLocaleString() ?? 0;

export const getStatistic = (statisticIdentifier: StatisticIdentifier): StatisticNormalized => {
  let statistic = statistics.find(statistic => statistic.identifier === statisticIdentifier) as Statistic;
  if (!statistic) {
    return {
      formatY: defaultFormatY,
      identifier: statisticIdentifier,
      text: "Unknown statistic",
    }
  }

  if (statistic.stackIdentifier) {
    const { formatY } = getStack(statistic.stackIdentifier);
    statistic = { formatY, ...statistic };
  }

  statistic.formatY = statistic.formatY || defaultFormatY;

  return statistic as StatisticNormalized;
};

export const getStack = (stackIdentifier: StackIdentifier): Stack => {
  return stacks.find(stack => stack.identifier === stackIdentifier) as Stack;
};

export const stacks: Stack[] = [
  // {
  //   identifier: "memory",
  //   text: "Memory",
  //   formatY: formatBytes,
  //   format(text: string): string {
  //     return text + " memory";
  //   }
  // },
  // {
  //   identifier: "network",
  //   text: "Network",
  //   // To-do: formatY
  //   format(text: string): string {
  //     return "Network " + text.toLowerCase();
  //   }
  // },
  // {
  //   identifier: "primitives",
  //   text: "Primitives",
  //   format(text: string): string {
  //     return text + " primitives";
  //   }
  // },
  {
    identifier: "playerJoins",
    text: "Player joins",
    format(text: string): string {
      return text + " players joins";
    }
  },
  {
    identifier: "playerRetention",
    text: "Players",
    format(text: string): string {
      return text + " players";
    }
  }
];

export interface Chart {
  identifier: string;
  series: Series[];
  annotations: Annotation[];
}

export const getCharts = async (gameIdentifier: string, charts: ChartOptions[]) => {
  return await request<{
    charts: Series[]
    annotations: Annotation[]
  }>(encodePath`games/${gameIdentifier}/graphs`, {
    method: "POST",
    body: { graphs: charts }
  });
};
