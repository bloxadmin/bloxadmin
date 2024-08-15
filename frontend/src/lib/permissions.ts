import useAuthenticationStore from "../stores/authentication";
import useGamesStore from "../stores/games";
import { Permission, Game, User } from "./bloxadmin";

export function userHasPermission(userPermissions: Permission[], requiredPermissions: Permission[], oneOf = false): boolean {
  if (!userPermissions)
    return false;

  return requiredPermissions[oneOf ? "some" : "every"]((permission) => userPermissions.includes(permission));
}

export async function hasPermission(gameId: string, requiredPermissions: Permission[], oneOf = false) {
  const { Game } = useGamesStore();

  const game = await Game(gameId);

  if (!game)
    return false;

  return userHasPermission(game.permissions, requiredPermissions, oneOf);
}

export function hasPermissionSync(gameId: string | number, requiredPermissions: Permission[], oneOf = false): boolean {
  const { gamesList } = useGamesStore();

  const game = gamesList.find(game => game.id === Number(gameId));

  if (!game)
    return false;

  return userHasPermission(game.permissions, requiredPermissions, oneOf);
}
