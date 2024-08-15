import auth from "../middleware/auth.ts";
import { getDataStoreEntry, listDataStoreEntries, listDataStores, setDataStoreEntry } from "../services/roblox.ts";
import { Permissions, security } from "../services/security.ts";
import { getGameApiKeys } from "../services/publish.ts";
import router from "../util/router.ts";

async function getGameApiKey(gameId: string) {
  return (await getGameApiKeys(gameId))[0];
}

router.get("/games/:gameId/datastores", auth(), security([
  Permissions.Datastores.Datastores.List
]), async (context) => {
  const gameId = context.req.param("gameId");
  const { cursor, prefix } = context.req.query();
  const limit = Math.max(Number(context.req.query("limit")), 100);

  try {
    const datastores = await listDataStores({ gameId, apiKey: await getGameApiKey(gameId) }, { cursor, prefix, limit });

    return context.json(datastores);
  } catch (error) {
    return context.text(error.message, 500);
  }
});

router.get('/games/:gameId/datastores/:datastore/entries', auth(), security([
  Permissions.Datastores.Entries.List
]), async (context) => {
  const gameId = context.req.param("gameId");
  const datastore = context.req.param("datastore");
  const { cursor, prefix, scope } = context.req.query();
  const limit = Math.max(Number(context.req.query("limit")), 10);

  try {
    const response = await listDataStoreEntries(
      { gameId, apiKey: await getGameApiKey(gameId), datastore, scope }, 
      { allScopes: !scope, cursor, prefix, limit });

    return context.json(response);
  } catch (error) {
    return context.text(error.message, 500);
  }
});

router.get('/games/:gameId/datastores/:datastore/entries/:key', auth(), security([
  Permissions.Datastores.Entries.Read
]), async (context) => {
  const gameId = context.req.param("gameId");

  const datastore = context.req.param("datastore");
  const key = context.req.param("key");
  const { scope } = context.req.query();

  try {
    const response = await getDataStoreEntry({ gameId, apiKey: await getGameApiKey(gameId), datastore, scope }, key);

    if (!response)
      return context.text("Not Found", 404);

    return context.json(response);
  } catch (error) {
    return context.text(error.message, 500);
  }
});

router.put('/games/:gameId/datastores/:datastore/entries/:key', auth(), security([
  Permissions.Datastores.Entries.Update,
  Permissions.Datastores.Entries.Create
]), async (context) => {
  const gameId = context.req.param("gameId");

  const datastore = context.req.param("datastore");
  const key = context.req.param("key");

  const value = await context.req.text();

  try {
  const response = await setDataStoreEntry({
    gameId, apiKey: await getGameApiKey(gameId), datastore
  }, key, value);
    return context.json(response);
    
  } catch (error) {
    return context.text(error.message, 500);
  }
});
