import { validator } from "https://deno.land/x/hono@v2.7.0/middleware.ts";
import { ENABLE_LOGGING } from "../consts.ts";
import auth from "../middleware/auth.ts";
import { Aggregate, getDisplayValue, getGlobalAnnotationsForPeriod, getStatsQuery, getUnit, Measurements, measurements, TimeUnit, Unit, VALID_AGGREGATES } from "../services/influxdb.ts";
import { Permissions, security } from "../services/security.ts";
import influxdb, { influxOrg } from "../util/influxdb.ts";
import router from "../util/router.ts";

const VALID_MEASUREMENTS = Object.entries(measurements).flatMap(([measurement, fields]) => fields.map((field) => `${measurement}.${field}`));
const INTERVAL_REGEX = /(\d+)(s|m|h|d)/;
// Minimum duration in seconds : min interval in seconds
const MINIMUM_INTERVALS: { [key: number]: number } = {
  // 0 seconds : 30 seconds
  [0]: 30,
  // 1 hour : 1 minute
  [60 * 60]: 60,
  // 1 day : 15 minutes
  [60 * 60 * 24]: 60 * 15,
  // 1 week : 2 hours
  [60 * 60 * 24 * 7]: 60 * 60 * 2,
  // 1 month : 6 hours
  [60 * 60 * 24 * 28]: 60 * 60 * 6,
}

// deno-lint-ignore no-explicit-any
function dateSanitizer([v]: any) {
  const date = new Date(v);
  if (isNaN(date.getTime())) {
    return false;
  }
  return true;
}

function secondsToHuman(s: number): string {
  // Dont show units if they are 0
  const units = {
    d: Math.floor(s / (60 * 60 * 24)),
    h: Math.floor(s / (60 * 60)) % 24,
    m: Math.floor(s / 60) % 60,
    s: s % 60,
  };

  return Object.entries(units)
    .filter(([_, v]) => v > 0)
    .map(([k, v]) => `${v}${k}`)
    .join(" ");
}

// Returns interval and seconds
function intervalToSeconds(s: string): number {
  const [interval, unit] = s.match(INTERVAL_REGEX)!.slice(1) as [string, TimeUnit];
  const seconds = Number(interval) * {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 60 * 60 * 24,
  }[unit];

  return seconds;
}

interface GraphRequest {
  name: string;
  stat: string;
  serverId?: string;
  start: string;
  stop: string;
  interval: string;
  serverAggregate?: Aggregate;
}

function getQuery<M extends keyof Measurements>(gameId: number, graph: GraphRequest) {
  const { name, stat, start, stop, serverId } = graph;

  const [measurement, field] = stat.split(".") as [M, Measurements[M]];
  const [interval, unit] = graph.interval.match(INTERVAL_REGEX)!.slice(1) as [string, TimeUnit];
  const startDate = new Date(start);
  const stopDate = new Date(stop);

  startDate.setSeconds(0);
  startDate.setMilliseconds(0);
  stopDate.setSeconds(0);
  stopDate.setMilliseconds(0);

  return {
    name,
    stat: graph.stat,
    start: startDate,
    stop: stopDate,
    measurement,
    query: getStatsQuery<M>({
      name,
      measurement,
      stat: [field],
      start: startDate,
      stop: stopDate,
      interval: [Number(interval), unit],
      gameId,
      serverId,
    })
  };
}

interface GraphResponse {
  name: string;
  data: [string, number][];
  unit: Unit;
  displayValue: number;
}

const OLD_MEMORY = new Date("2023-02-10T01:11:30Z").getTime();
const KIBIBYTE_TO_BYTES = 1024;
const MEBIBYTE_TO_BYTES = KIBIBYTE_TO_BYTES ** 2;

// function isInOptional(options: string[]) {
//   return (value: unknown): boolean => {
//     if (!value) return true
//     if (typeof options === 'object') {
//       for (const elem of options) {
//         if (elem === value) return true
//       }
//     }
//     return false
//   }
// }

router.post("/games/:gameId/graphs", auth(), security([Permissions.Servers.Metrics.Read]), validator((v) => ({
  graphs: v.array("graphs", (v) => ({
    name: v.json("name"),
    stat: v.json("stat").isIn(VALID_MEASUREMENTS).message(`"graphs.[*].stat" is invalid - Must be one of ${VALID_MEASUREMENTS.join(", ")}`),
    severId: v.json("serverId").isOptional(),
    start: v.json("start").addRule(dateSanitizer).message(`"graphs.[*].start" is invalid - Invalid or missing date`),
    stop: v.json("stop").addRule(dateSanitizer).message(`"graphs.[*].stop" is invalid - Invalid or missing date`),
    interval: v.json("interval").match(INTERVAL_REGEX).message(`"graphs.[*].interval" is invalid - Must match ${INTERVAL_REGEX.source}`),
  }))
})), async (context) => {
  const gameId = Number(context.req.param("gameId"));

  const { graphs } = await context.req.json() as {
    graphs: GraphRequest[];
  };
  for (const { serverAggregate } of graphs)
    // deno-lint-ignore no-explicit-any
    if (serverAggregate && !VALID_AGGREGATES.includes(serverAggregate as any))
      return context.text(`"graphs.[*].serverAggregate" is invalid - Must be one of ${VALID_AGGREGATES.join(", ")}, or undefined`, 400);

  // Make sure names are unique
  const names = new Set<string>();
  for (const graph of graphs) {
    if (names.has(graph.name)) {
      return context.text("Graph names must be unique", 400);
    }
    names.add(graph.name);
  }

  const queries = graphs.map((graph) => getQuery(gameId, graph));

  if (ENABLE_LOGGING)
    queries.forEach(({ query }) => console.log(query));

  // Bypass if admin
  if (!context.get("admin")) {
    if (!gameId)
      return context.text("Missing game id", 400);

    for (const { start, stop } of queries) {
      // start cant be older than 45 days
      if (start.getTime() < Date.now() - 1000 * 60 * 60 * 24 * 45) {
        return context.text("Graphs cannot be older than 45 days", 400);
      }

      const duration = (stop.getTime() - start.getTime()) / 1000;
      const interval = intervalToSeconds(graphs[0].interval);

      if (duration > 60 * 60 * 24 * 32) {
        return context.text("Graphs cannot be longer than 31 days", 400);
      }

      // Make sure interval is not too small
      const minimumInterval = Object.entries(MINIMUM_INTERVALS)
        .sort(([a], [b]) => Number(b) - Number(a))
        // Removing 10% to account for weird time things
        .find(([d]) => duration >= (Number(d) * 0.99))?.[1]!;

      if (interval < minimumInterval) {
        return context.text(`Interval must be at least ${secondsToHuman(minimumInterval)} for a duration of ${secondsToHuman(duration)}`, 400);
      }
    }
  }

  const roundToDecimals: number | undefined = parseInt(context.req.query("round"), 10);

  const queryApi = influxdb.getQueryApi(influxOrg);

  const result = await Promise.all(queries.map(({ name, query }, i) => new Promise<GraphResponse>((resolve, reject) => {
    const data: GraphResponse['data'] = [];
    const isMemory = queries[i].stat.startsWith("memory");

    queryApi.queryRows(query, {
      complete() {
        resolve({
          name,
          data,
          unit: getUnit(queries[i].measurement),
          displayValue: getDisplayValue(queries[i].measurement, data),
        });
      },
      error: reject,
      next(row, m) {
        const valueColumn = m.column("_value", true);
        const timeColumn = m.column("_time", true);

        let value = Number(row[valueColumn.index] || valueColumn.defaultValue);

        if (roundToDecimals !== undefined) {
          value = Number(value.toFixed(roundToDecimals));
        }

        // TODO: remove in 90 days
        if (isMemory && new Date(row[timeColumn.index] || timeColumn.defaultValue).getTime() < OLD_MEMORY) {
          value = Math.round(value * MEBIBYTE_TO_BYTES);
        }

        data.push([
          row[timeColumn.index] || timeColumn.defaultValue,
          value
        ]);
      },
    })
  })));

  result.forEach(({ data }) => data.shift());

  if (context.req.header("Accept") === "text/csv") {
    let csv = "name,time,value";

    for (const { name, data } of result) {
      for (const [time, value] of data) {
        csv += `\n${name},${time},${value}`;
      }
    }

    return context.text(csv, 200, {
      "Content-Type": "text/csv",
    });
  }

  const start = queries.reduce((a, b) => a.start.getTime() < b.start.getTime() ? a : b).start;
  const stop = queries.reduce((a, b) => a.stop.getTime() > b.stop.getTime() ? a : b).stop;

  const annotations = await getGlobalAnnotationsForPeriod(start, stop);

  return context.json({
    charts: result,
    annotations,
  });
});
