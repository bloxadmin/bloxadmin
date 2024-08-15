import postgres from "../util/postgres.ts";

export const resourceTypes = [
  "groups"
] as const;
export type ResourceType = typeof resourceTypes[number];

export interface Note {
  id: number;
  user: {
    id: number;
    name: string;
  };
  note: string,
  createdAt: Date,
  type?: string,
  recipient?: string,
}

export interface PostNote {
  namespace: string,
  resourceType: ResourceType,
  resourceId: number,
  userId: number,
  note: string,
  type?: string,
  recipient?: string,
}

interface DatabaseNote {
  id: number;
  namespace: string;
  resource_table: ResourceType;
  resource_id: number;
  user_id: number;
  user_name: string;
  note: string;
  type: string | null;
  created_at: Date;
  recipient: string | null;
}

function transformNote(note: DatabaseNote): Note {
  return {
    id: note.id,
    // resourceType: note.resource_table,
    // resourceId: Number(note.resource_id),
    user: {
      id: Number(note.user_id),
      name: note.user_name || "Unknown",
    },
    note: note.note,
    type: note.type || undefined,
    createdAt: note.created_at,
    recipient: note.recipient || undefined,
  }
}

export async function getNotes(namespace: string, resourceType: ResourceType, resourceId: number, limit: number, offset: number, type?: string) {
  const notes = type
    ? await postgres<DatabaseNote>`
      SELECT 
        notes.id, resource_table, resource_id, user_id, note, type, created_at, recipient, players.name as user_name
      FROM notes 
      LEFT JOIN
        players ON notes.user_id = players.id
      WHERE 
        namespace = ${namespace} AND resource_table = ${resourceType} AND resource_id = ${resourceId} AND type = ${type}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `
    : await postgres<DatabaseNote>`
      SELECT 
      notes.id, resource_table, resource_id, user_id, note, type, created_at, recipient, players.name as user_name
      FROM notes 
      LEFT JOIN
        players ON notes.user_id = players.id
      WHERE 
        namespace = ${namespace} AND resource_table = ${resourceType} AND resource_id = ${resourceId}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

  return notes.map(transformNote);
}

export async function countNotes(namespace: string, resourceType: ResourceType, resourceId: number, type?: string) {
  const result = type
    ? await postgres<{ count: string }>`
      SELECT COUNT(*) 
      FROM notes 
      WHERE 
        namespace = ${namespace} AND resource_table = ${resourceType} AND resource_id = ${resourceId} AND type = ${type}
    `
    : await postgres<{ count: string }>`
      SELECT COUNT(*) 
      FROM notes 
      WHERE 
        namespace = ${namespace} AND resource_table = ${resourceType} AND resource_id = ${resourceId}
    `;

  return parseInt(result[0].count);
}

export async function postNote({
  namespace,
  resourceType,
  resourceId,
  userId,
  note,
  type,
  recipient,
}: PostNote) {
  const created = await postgres<Omit<DatabaseNote, 'user_name'>>`
    INSERT INTO notes (namespace, resource_table, resource_id, user_id, note, type, recipient)
    VALUES (${namespace}, ${resourceType}, ${resourceId}, ${userId}, ${note}, ${type || null}, ${recipient || null})
    RETURNING *
  `;
  const user = await postgres<{ user_name: string }>`
    SELECT name as user_name FROM players WHERE id = ${userId}
  `;

  return transformNote({ ...created[0], ...user[0] });
}

export async function deleteNote(
  namespace: string,
  resouceType: ResourceType,
  resourceId: number,
  noteId: number,
) {
  await postgres`
    DELETE FROM notes WHERE namespace = ${namespace} AND resource_table = ${resouceType} AND resource_id = ${resourceId} AND id = ${noteId}
  `;
}
