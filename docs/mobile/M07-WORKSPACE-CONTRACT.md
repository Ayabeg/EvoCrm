# M07 Workspace contract

Workspace identity is **server truth** from `GET /api/v1/me` (`data.workspace`).  
The token ability is `workspace:{id}` issued at `POST /api/v1/auth/token`.

## What exists

- One Fortify user → one `workspace_id`.
- Sanctum token stamped with `workspace:{that id}`.
- `EnsureApiWorkspaceToken` rejects tokens that do not `tokenCan` the user's current ability.
- `/me` returns that workspace: `id`, `name`, `slug`, `timezone`.
- Record APIs 404 when `workspace_id` does not match.

## What does not exist

- Workspace list
- Switch endpoint
- Client-selected workspace header
- Multi-workspace token

**WORKSPACE SWITCHING DEFERRED.** More tab explains this. No switcher UI.

## Client isolation

Non-sensitive caches use `ws:{workspaceId}:{suffix}` (`mobile/lib/storage/keys.ts`).

| Key | Store | Contents |
|---|---|---|
| `auth.sanctum_token` | SecureStore only | Bearer token |
| `auth.last_workspace_id` | AsyncStorage prefs | Numeric id pointer, not a token |
| `ws:{id}:identity` | prefs | Last `/me` user + workspace + permissions |

Rules:

- Never mix workspace A and B keys.
- If `/me` returns a different id than `auth.last_workspace_id`, evict `ws:{oldId}:*` then write the new snapshot. That is server reassignment, not a switcher.
- Logout / 401 wipe clears **all** `ws:*` keys and the last-workspace pointer.
- `can()` reads `/me` permissions only. Unknown permission = deny. 403 on a write ≠ logout.

## Never mix workspaces

`assertNoCrossWorkspaceLeak` fails tests if a payload for workspace A includes `ws:{B}:` keys. Feature screens in later milestones must keep using `workspaceKey`.
