import { ServerEventContext } from "../services/events.ts";
import { Point } from "../util/influxdb.ts";

export interface PlayerReadyData {
  input?: {
    accelerometerEnabled: boolean;
    gamepadEnabled: boolean;
    gyroscopeEnabled: boolean;
    keyboardEnabled: boolean;
    mouseSensitivity: number;
    mouseEnabled: boolean;
    mouseIconEnabled: boolean;
    touchEnabled: boolean;
    vrEnabled: boolean;
  };
  settings: {
    computerCameraMovementMode: number;
    computerMovementMode: number;
    controlMode: number;
    gamepadCameraSensitivity: number;
    mouseSenitivity: number;
    savedQualityLevel: number;
    touchCameraMovementMode: number;
    touchMovementMode: number;
    inFullscreen: boolean;
    inStudio: boolean;
  };
  camera?: {
    viewportSize: [number, number];
    fov: number;
  };
  gui?: {
    isTenFootInterface: boolean;
  }
  localization?: {
    countryCode: string;
  };
  policy?: {
    /** When true, the player cannot interact with paid (via in-experience currency or Robux) random item generators. */
    ArePaidRandomItemsRestricted: boolean;
    /** A list of external link references (for example, social media links, handles, or iconography) a player is permitted to see. Possible values include: “Discord”, “Facebook”, “Twitch”, and “YouTube”. */
    AllowedExternalLinkReferences: Array<string>;
    /** When true, the player can trade virtual items that they purchased with in-experience currency or Robux. */
    IsPaidItemTradingAllowed: boolean;
    /** When true, an experience should enforce compliance changes. See [here](https://devforum.roblox.com/t/about-our-upcoming-global-compliance-system/461447) for details. */
    IsSubjectToChinaPolicies: boolean;
  };
}

export enum Platform {
  Desktop = "desktop",
  Mobile = "mobile",
  Console = "console",
  Unknown = "unknown",
}

function guessPlatform(data: PlayerReadyData) {
  if (!data)
    return Platform.Unknown;

  if (data.gui?.isTenFootInterface)
    return Platform.Console;

  if (!data.input)
    return Platform.Unknown;

  if (data.input.vrEnabled)
    return Platform.Desktop;

  // if (data.input.gyroscopeEnabled || data.input.accelerometerEnabled)
  //   return Platform.Mobile;

  if (data.input.touchEnabled && !data.input.mouseEnabled)
    return Platform.Mobile;

  if (data.input.gamepadEnabled && !data.input.mouseEnabled)
    return Platform.Console;

  return Platform.Desktop;
}

export default function handlePlayerReadyEvent({ data, influxWriteApi, gameId, serverId, time }: ServerEventContext<PlayerReadyData>) {
  // await updateSessionData(segments.session, data);

  influxWriteApi.writePoint(new Point("playerJoins")
    .timestamp(time)
    .tag("gameId", gameId.toString())
    .tag("serverId", serverId)
    .tag("platform", guessPlatform(data))
    .tag("country", data?.localization?.countryCode || "unknown")
    .intField("playerJoins", 1));
}
