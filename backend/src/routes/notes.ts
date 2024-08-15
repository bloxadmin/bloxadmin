import { validator } from "https://deno.land/x/hono@v2.7.0/middleware.ts";
import auth from "../middleware/auth.ts";
import { ResourceType, countNotes, deleteNote, getNotes, postNote, resourceTypes } from "../services/notes.ts";
import router from "../util/router.ts";

router.get("/notes/:ns/:resourceType/:resourceId", auth(), async (context) => {
  const namespace = context.req.param("ns");
  const resourceType = context.req.param("resourceType") as ResourceType;
  const resourceId = parseInt(context.req.param("resourceId"));
  const type = context.req.query("type");
  const limit = parseInt(context.req.query("limit") || "100");
  const skip = parseInt(context.req.query("skip") || "0");

  if (!namespace)
    return context.text("Invalid namespace", 400);

  if (!resourceType || resourceTypes.indexOf(resourceType) === -1)
    return context.text("Invalid resource type", 400);

  if (!resourceId)
    return context.text("Invalid resource ID", 400);

  const total = await countNotes(namespace, resourceType, resourceId, type || undefined);
  const notes = await getNotes(namespace, resourceType, resourceId, limit, skip, type || undefined);

  return context.json({
    total,
    limit,
    skip,
    data: notes,
  });
});

router.post("/notes/:ns/:resourceType/:resourceId", auth(), validator((v) => ({
  note: v.json("note").isLength({ min: 1, max: 4000 }),
  type: v.json("type").isOptional().isLength({ min: 1, max: 100 }),
  recipient: v.json("recipient").isOptional().isLength({ min: 1, max: 300 }),
})), async (context) => {
  const body = await context.req.valid();

  const namespace = context.req.param("ns");

  if (!namespace)
    return context.text("Invalid namespace", 400);

  const resourceType = context.req.param("resourceType") as ResourceType;

  if (!resourceType || resourceTypes.indexOf(resourceType) === -1)
    return context.text("Invalid resource type", 400);

  const resourceId = parseInt(context.req.param("resourceId"));

  if (!resourceId)
    return context.text("Invalid resource ID", 400);

  const note = await postNote({
    namespace,
    resourceType,
    resourceId,
    note: body.note,
    type: body.type,
    recipient: body.recipient,
    userId: context.get("userId")!,
  });

  return context.json(note);
});

router.delete("/notes/:ns/:resourceType/:resourceId/:noteId", auth(), async (context) => {
  const namespace = context.req.param("ns");

  if (!namespace)
    return context.text("Invalid namespace", 400);

  const resourceType = context.req.param("resourceType") as ResourceType;

  if (!resourceType || resourceTypes.indexOf(resourceType) === -1)
    return context.text("Invalid resource type", 400);

  const resourceId = parseInt(context.req.param("resourceId"));

  if (!resourceId)
    return context.text("Invalid resource ID", 400);

  const noteId = parseInt(context.req.param("noteId"));

  if (!noteId)
    return context.text("Invalid note ID", 400);

  await deleteNote(namespace, resourceType, resourceId, noteId);

  return context.json("Deleted");
});
