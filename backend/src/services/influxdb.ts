import postgres from "../util/postgres.ts";

export type Measurements = {
  onlinePlayers: "onlinePlayers";
  activeServers: "activeServers";
  playerJoins:
  | "playerJoins"
  | "desktop"
  | "mobile"
  | "console"
  | "unknown";
  playerRetention:
  | "new"
  | "returning";
  heartbeat: "heartbeatTimeMs";
  physicsStep: "physicsStepTime";
  primitives:
  | "movingPrimitivesCount"
  | "primitivesCount";
  network:
  | "dataReceive"
  | "dataSend"
  | "physicsReceive"
  | "physicsSend";
  contacts: "contactsCount";
  instances: "instanceCount";
  memory:
  | "animation"
  | "geometryCsg"
  | "graphicsMeshParts"
  | "graphicsParticles"
  | "graphicsParts"
  | "graphicsSolidModels"
  | "graphicsSpatialHash"
  | "graphicsTerrain"
  | "graphicsTextureCharacter"
  | "graphicsTexture"
  | "gui"
  | "httpCache"
  | "instances"
  | "internal"
  | "luaHeap"
  | "navigation"
  | "physicsCollision"
  | "physicsParts"
  | "script"
  | "signals"
  | "sounds"
  | "streamingSounds"
  | "terrainVoxels"
  | "total";
};

export type MeasurementString<M extends keyof Measurements> = `${M}.${Measurements[M]}`;
export type Measurement =
  | MeasurementString<'activeServers'>
  | MeasurementString<'onlinePlayers'>
  | MeasurementString<'playerJoins'>
  | MeasurementString<'heartbeat'>
  | MeasurementString<'physicsStep'>
  | MeasurementString<'primitives'>
  | MeasurementString<'network'>
  | MeasurementString<'contacts'>
  | MeasurementString<'instances'>
  | MeasurementString<'memory'>;

export type Unit = "players" | "servers" | "seconds" | "kbps" | "count" | "bytes";

export const measurementInfo: {
  [M in keyof Measurements]: {
    type: "int" | "float";
    unit: Unit;
    gameQuery: (statsQuery: StatsQuery<M>) => string;
    serverQuery?: (statsQuery: StatsQuery<M>) => string;
    displayValue: (data: [string, number][]) => number;
    /**
     * What aggregation to use when querying one server
     */
    serverAggregation: Aggregate;
    fillEmpty: "last" | "zero";
  }
} = {
  activeServers: {
    type: "int",
    unit: "servers",
    gameQuery: gameQuery("max"),
    displayValue: (data) => data[data.length - 1]?.[1],
    serverAggregation: "last",
    fillEmpty: "zero",
  },
  contacts: {
    type: "float",
    unit: "count",
    gameQuery: gameQuery("mean"),
    displayValue: (data) => data[data.length - 1]?.[1],
    serverAggregation: "last",
    fillEmpty: "zero",
  },
  heartbeat: {
    type: "float",
    unit: "seconds",
    gameQuery: gameQuery("mean"),
    displayValue: (data) => data[data.length - 1]?.[1],
    serverAggregation: "last",
    fillEmpty: "zero",
  },
  instances: {
    type: "float",
    unit: "count",
    gameQuery: gameQuery("mean"),
    displayValue: (data) => data[data.length - 1]?.[1],
    serverAggregation: "last",
    fillEmpty: "zero",
  },
  memory: {
    type: "float",
    unit: "bytes",
    gameQuery: gameQuery("mean"),
    displayValue: (data) => data[data.length - 1]?.[1],
    serverAggregation: "last",
    fillEmpty: "zero",
  },
  network: {
    type: "float",
    unit: "kbps",
    gameQuery: gameQuery("mean"),
    displayValue: (data) => data[data.length - 1]?.[1],
    serverAggregation: "last",
    fillEmpty: "zero",
  },
  onlinePlayers: {
    type: "int",
    unit: "players",
    gameQuery: gameQuery("max"),
    displayValue: (data) => data[data.length - 1]?.[1],
    serverAggregation: "last",
    fillEmpty: "zero",
  },
  physicsStep: {
    type: "float",
    unit: "seconds",
    gameQuery: gameQuery("mean"),
    displayValue: (data) => data[data.length - 1]?.[1],
    serverAggregation: "last",
    fillEmpty: "zero",
  },
  playerJoins: {
    type: "int",
    unit: "count",
    gameQuery: ({
      name,
      measurement, stat,
      start, stop, interval,
      gameId,
    }) => {
      const filters: string[] = [];

      if (stat.includes('desktop'))
        filters.push('r["platform"] == "desktop"');

      if (stat.includes('mobile'))
        filters.push('r["platform"] == "mobile"');

      if (stat.includes('console'))
        filters.push('r["platform"] == "console"');

      if (stat.includes('unknown')) {
        filters.push('r["platform"] == "unknown"');
        filters.push(`not exists r["platform"]`);
      }

      return fromBucket(Deno.env.get("INFLUX_GAME_BUCKET") || "game-aggregation",
        range(start, stop),
        filter(
          `r["_measurement"] == "${measurement}"`,
          stat.length === 1 ? `r["_field"] == "playerJoins"` : `contains(value: r["_field"], set: ${JSON.stringify(stat)})`,
          `r["gameId"] == "${gameId}"`,
          filters.length ? `(${filters.join(" or ")})` : undefined,
        ),
        `group(columns: ["_measurement", "_field"])`,
        aggregateWindow(interval, "sum", true),
        yieldInto(name)
      );
    },
    displayValue: (data) => data.reduce((a, b) => a + b[1], 0),
    serverAggregation: "sum",
    fillEmpty: "zero",
  },
  playerRetention: {
    type: "int",
    unit: "count",
    gameQuery: gameQuery("sum"),
    displayValue: (data) => data.reduce((a, b) => a + b[1], 0),
    serverAggregation: "sum",
    fillEmpty: "zero",
  },
  primitives: {
    type: "float",
    unit: "count",
    gameQuery: gameQuery("mean"),
    displayValue: (data) => data[data.length - 1]?.[1],
    serverAggregation: "last",
    fillEmpty: "zero",
  },
}

export const measurements: {
  [M in keyof Measurements]: Measurements[M][];
} = {
  onlinePlayers: [
    "onlinePlayers",
  ],
  activeServers: [
    "activeServers",
  ],
  playerJoins: [
    "playerJoins",
    "desktop",
    "mobile",
    "console",
    "unknown",
  ],
  playerRetention: [
    "new",
    "returning",
  ],
  heartbeat: [
    "heartbeatTimeMs",
  ],
  physicsStep: [
    "physicsStepTime",
  ],
  primitives: [
    "movingPrimitivesCount",
    "primitivesCount",
  ],
  network: [
    "dataReceive",
    "dataSend",
    "physicsReceive",
    "physicsSend",
  ],
  contacts: [
    "contactsCount",
  ],
  instances: [
    "instanceCount",
  ],
  memory: [
    "animation",
    "geometryCsg",
    "graphicsMeshParts",
    "graphicsParticles",
    "graphicsParts",
    "graphicsSolidModels",
    "graphicsSpatialHash",
    "graphicsTerrain",
    "graphicsTextureCharacter",
    "graphicsTexture",
    "gui",
    "httpCache",
    "instances",
    "internal",
    "luaHeap",
    "navigation",
    "physicsCollision",
    "physicsParts",
    "script",
    "signals",
    "sounds",
    "streamingSounds",
    "terrainVoxels",
    "total",
  ]
};



export type TimeUnit = "s" | "m" | "h" | "d";

export type Aggregate = "mean" | "min" | "max" | "sum" | "count" | "first" | "last";
export const VALID_AGGREGATES: Aggregate[] = ["mean", "min", "max", "sum", "count", "first", "last"];

export interface StatsQuery<M extends keyof Measurements> {
  name: string;
  measurement: M;
  stat: Measurements[M][];
  start: Date;
  stop: Date;
  interval: [number, TimeUnit];
  gameId: number;
  serverId?: string;
}

function fromBucket(bucket: string, ...pipes: string[]) {
  return `from(bucket: ${JSON.stringify(bucket)})\n${pipes.map((fn) => `  |> ${fn}`).join("\n")}`;
}

function range(start: Date, stop: Date, truncate?: string) {
  if (truncate)
    return `range(
      start: date.truncate(t: ${start.toISOString()}, unit: ${truncate})
      stop: date.truncate(t: ${stop.toISOString()}, unit: ${truncate})
    )`
  return `range(start: ${start.toISOString()}, stop: ${stop.toISOString()})`;
}

function filter(...predicates: (string | undefined)[]) {
  return `filter(fn: (r) => ${predicates.filter((p) => !!p).join(" and ")})`;
}

function aggregateWindow(every: string | [number, TimeUnit], fn: Aggregate, createEmpty = false) {
  if (Array.isArray(every))
    every = `${every[0]}${every[1]}`;
  return `aggregateWindow(every: ${every}, fn: ${fn}, createEmpty: ${createEmpty})`;
}

function yieldInto(name: string) {
  return `yield(name: ${JSON.stringify(name)})`;
}


function gameQuery<M extends keyof Measurements>(aggregate: Aggregate) {
  return ({
    name,
    measurement, stat,
    start, stop, interval,
    gameId,
  }: StatsQuery<M>) => {
    return fromBucket(Deno.env.get("INFLUX_GAME_BUCKET") || "game-aggregation",
      range(start, stop),
      filter(
        `r["_measurement"] == "${measurement}"`,
        stat.length === 1 ? `r["_field"] == "${stat}"` : `contains(value: r["_field"], set: ${JSON.stringify(stat)})`,
        `r["gameId"] == "${gameId}"`,
      ),
      aggregateWindow(interval, aggregate, true),
      yieldInto(name)
    );
  }
}

export function getDisplayValue(measurement: keyof Measurements, data: [string, number][]): number {
  return measurementInfo[measurement].displayValue(data);
}

export function getUnit(measurement: keyof Measurements): Unit {
  return measurementInfo[measurement].unit;
}

export function getStatsQuery<M extends keyof Measurements>(q: StatsQuery<M>) {
  const {
    name,
    measurement,
    start,
    stop,
    interval,
    gameId,
    serverId,
  } = q;
  let { stat } = q;
  const { serverAggregation, gameQuery, fillEmpty } = measurementInfo[measurement];

  if (!serverId)
    return gameQuery(q);

  const filters: string[][] = [];

  if (gameId) {
    filters.push([`gameId`, `==`, gameId.toString()]);
  }

  if (serverId) {
    filters.push([`serverId`, `==`, serverId]);
  }

  if (measurement === "playerJoins") {
    if (stat.includes("desktop" as never))
      filters.push([`platform`, `==`, "desktop"]);

    if (stat.includes("mobile" as never))
      filters.push([`platform`, `==`, "mobile"]);

    if (stat.includes("console" as never))
      filters.push([`platform`, `==`, "console"]);

    if (stat.includes("unknown" as never))
      filters.push([`platform`, `==`, "unknown"]);


    stat = stat.filter((s) => s === "playerJoins" as never);
  } else {
    if (interval[1] === "s" && interval[0] < 30)
      throw new Error("Interval must be at least 30 seconds");
  }

  const query = `from(bucket: "${Deno.env.get("INFLUX_SERVER_BUCKET") || "bloxadmin"}")
  |> range(start: ${start.toISOString()}, stop: ${stop.toISOString()})
  |> filter(fn: (r) => r["_measurement"] == "${measurement}")
  ${stat.length ? `|> filter(fn: (r) => ${stat.map((s) => `r["_field"] == "${s}"`).join(" or ")})` : ''}
  ${filters.length ? `|> filter(fn: (r) => ${filters.map(([k, op, v]) => `r[${JSON.stringify(k)}] ${op} ${JSON.stringify(v.toString())}`).join(" and ")})` : ''}
  |> group(columns: ["_measurement", "_field"])
  |> aggregateWindow(every: ${interval[0]}${interval[1]}, fn: ${serverAggregation}, createEmpty: ${Boolean(fillEmpty)})
  |> fill(${fillEmpty === 'last' ? 'usePrevious: true' : 'value: ' + (measurementInfo[measurement].type === "int" && serverAggregation !== "mean" ? "0" : "0.0")})
  |> yield(name: ${JSON.stringify(name)})`;

  return query;
}
export interface ChartAnnotation {
  id: number;
  start: Date;
  stop?: Date;
  title: string;
  description: string;
  link: string;
  type: "roblox_down" | "insight" | "event" | "error" | "holiday" | "other";
}

export async function getGlobalAnnotationsForPeriod(start: Date, stop: Date): Promise<ChartAnnotation[]> {
  const annotations = await postgres<{
    id: number;
    start: Date;
    stop: Date | null;
    title: string;
    description: string;
    link: string;
    type: ChartAnnotation['type'];
    ongoing: boolean;
  }>`
    SELECT id, start, stop, title, description, link, type, ongoing FROM global_graph_annotations
    WHERE start <= ${stop} AND (stop IS NULL OR stop >= ${start}) AND display = true
  `;

  return annotations.map((a) => ({
    id: a.id,
    start: a.start > start ? a.start : start,
    stop: a.ongoing ? stop : (a.stop || undefined),
    title: a.title,
    description: a.description,
    link: a.link,
    type: a.type,
  }));
}
