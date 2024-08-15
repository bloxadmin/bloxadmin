import { updateStats } from "../services/servers.ts";
import { ServerEventContext } from "../services/events.ts";
import { Point } from "../util/influxdb.ts";

interface Measurements {
  [key: string]: {
    [key: string]: string;
  };
}

const measurements: Measurements = {
  heartbeat: {
    heartbeatTimeMs: "heartbeatTimeMs",
  },
  physicsStep: {
    physicsStepTimeMs: "physicsStepTime",
  },
  primitives: {
    movingPrimitivesCount: "movingPrimitivesCount",
    primitivesCount: "primitivesCount",
  },
  network: {
    dataReceiveKbps: "dataReceive",
    dataSendKbps: "dataSend",
    physicsReceiveKbps: "physicsReceive",
    physicsSendKbps: "physicsSend",
  },
  // contacts: {
  //   contactsCount: "contactsCount",
  // },
  // instances: {
  //   instanceCount: "instanceCount",
  // },
  memory: {
    // animationMemoryUsageMb: "animation",
    // geometryCsgMemoryUsageMb: "geometryCsg",
    // graphicsMeshPartsMemoryUsageMb: "graphicsMeshParts",
    // graphicsParticlesMemoryUsageMb: "graphicsParticles",
    // graphicsPartsMemoryUsageMb: "graphicsParts",
    // graphicsSolidModelsMemoryUsageMb: "graphicsSolidModels",
    // graphicsSpatialHashMemoryUsageMb: "graphicsSpatialHash",
    // graphicsTerrainMemoryUsageMb: "graphicsTerrain",
    // graphicsTextureCharacterMemoryUsageMb: "graphicsTextureCharacter",
    // graphicsTextureMemoryUsageMb: "graphicsTexture",
    guiMemoryUsageMb: "gui",
    // httpCacheMemoryUsageMb: "httpCache",
    instancesMemoryUsageMb: "instances",
    internalMemoryUsageMb: "internal",
    luaHeapMemoryUsageMb: "luaHeap",
    // navigationMemoryUsageMb: "navigation",
    // physicsCollisionMemoryUsageMb: "physicsCollision",
    // physicsPartsMemoryUsageMb: "physicsParts",
    scriptMemoryUsageMb: "script",
    signalsMemoryUsageMb: "signals",
    // soundsMemoryUsageMb: "sounds",
    // streamingSoundsMemoryUsageMb: "streamingSounds",
    // terrainVoxelsMemoryUsageMb: "terrainVoxels",
    totalMemoryUsageMb: "total",
  }
};

const KIBIBYTE_TO_BYTES = 1024;
const MEBIBYTE_TO_BYTES = KIBIBYTE_TO_BYTES ** 2;

export default async function handleStatsEvent({ gameId, serverId, data, time, influxWriteApi }: ServerEventContext<Record<string, number>>) {
  await updateStats(gameId, serverId, data);

  for (const [measurement, feilds] of Object.entries(measurements)) {
    const point = new Point(measurement)
      .tag("gameId", gameId.toString())
      .tag("serverId", serverId)
      .timestamp(time);

    for (const [key, value] of Object.entries(feilds)) {
      if (!data[key]) continue; // Remove null and 0s
      if (typeof data[key] === "number") {
        if (measurement === "memory") {
          point.floatField(value, Math.round(data[key] * MEBIBYTE_TO_BYTES));
        } else {
          point.floatField(value, data[key]);
        }
      }
    }

    if (Object.keys(point.fields).length)
      influxWriteApi.writePoint(point);
  }
}
