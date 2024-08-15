import auth from "../../middleware/auth.ts";
import { getGroup, getGroupRoles, getGroupUsers, getTotalGroupUsers, getUserGroups, syncGroup, syncGroupRoleMembers } from "../../services/groups/groups.ts";
import router from "../../util/router.ts";

router.get("/groups", auth(), async (context) => {
  const groups = await getUserGroups(context.get("userId")!);

  return context.json(groups);
});

router.get("/groups/:groupId", async (context) => {
  const groupId = parseInt(context.req.param("groupId"));

  if (!groupId)
    return context.text("Invalid group ID", 400);

  const group = await getGroup(groupId);

  if (!group)
    return context.text("Group not found", 404);

  return context.json(group);
});

router.get("/groups/:groupId/sync", async (context) => {
  const groupId = parseInt(context.req.param("groupId"));
  await syncGroup(groupId);

  const group = await getGroup(groupId);

  if (!group)
    return context.text("Group not found", 404);

  await syncGroup(groupId)

  return context.text("Synced", 200);
});

router.get("/groups/:groupId/roles", async (context) => {
  const roles = await getGroupRoles(parseInt(context.req.param("groupId")));

  return context.json(roles.sort((a, b) => a.rank - b.rank));
})

router.get("/groups/:groupId/users", async (context) => {
  const groupId = parseInt(context.req.param("groupId"));
  const limit = parseInt(context.req.query("limit") || "100");
  const skip = parseInt(context.req.query("skip") || "0");
  const roles = context.req.query("roles")?.split(",").map(role => parseInt(role)).filter(role => !!role) || [];

  if (!groupId)
    return context.text("Invalid group ID", 400);

  const group = await getGroup(groupId);

  if (!group)
    return context.text("Group not found", 404);

  const users = await getGroupUsers(groupId, limit, skip, roles);
  const total = await getTotalGroupUsers(groupId, roles);

  return context.json({
    limit,
    skip,
    total,
    data: users,
  });
});

router.get("/groups/:groupId/users/sync", async (context) => {
  const groupId = parseInt(context.req.param("groupId"));

  if (!groupId)
    return context.text("Invalid group ID", 400);

  const group = await getGroup(groupId);

  if (!group)
    return context.text("Group not found", 404);

  const roles = await getGroupRoles(groupId);

  console.log(`Syncing group ${groupId} (${group.name}) with ${roles.length} roles at ${Date.now()}`);

  for (const role of roles.sort((a, b) => b.rank - a.rank)) {
    if (!role.syncUsers || role.syncingUsers)
      continue;

    console.log(`Syncing role ${role.id} (${role.name})`);
    await syncGroupRoleMembers(groupId, role.id);
  }

  return context.text("Synced", 200);
})
