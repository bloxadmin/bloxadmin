import { InfluxDB, Point, HttpError, WriteApi as InlfuxWriteApi } from "https://cdn.skypack.dev/@influxdata/influxdb-client-browser@%5E1.33.1?dts";

const url = Deno.env.get("INFLUX_URL") || "http://localhost:8086";
const token = Deno.env.get("INFLUX_TOKEN");
const influxOrg = Deno.env.get("INFLUX_ORG") || "bloxadmin";

const influx = new InfluxDB({ url, token });

export type WriteApi = InlfuxWriteApi;

export {
  Point,
  HttpError,
  influxOrg,
  influx as default,
}
