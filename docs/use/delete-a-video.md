# Delete a video

For editors and admins removing recordings. Afterwards you'll know what **Delete video** does on your deployment and what the two possible outcomes mean.

The action lives in a video row's **Actions** column — as an icon in the row, or under the **⋮** button when the row has more actions than fit. It is the same for every role: there is no separate "delete permanently" entry, for administrators either.

## Delete video

Available to everyone who may edit the recording, in every status.

1. On **Videos**, choose **Delete video** in the row's *Actions*.
2. Confirm in **Delete video** — *"Are you sure you want to delete the video …?"* — with **Delete**; **Cancel** leaves everything as it was.
3. **The video has been deleted.** in green confirms it, and the row leaves your list.
4. **The video could not be deleted.** in red means nothing was removed — see below.

What "deleted" means is decided by the deployment, not by this interface: the backend runs the delete workflow your operator configured. On most deployments that is a trash series — the recording is hidden from users and an administrator can restore it in Opencast's admin interface. If your operator configured a workflow that removes recordings for good, the same button does that. When it matters, ask whoever [runs the deployment](../operate/backend-config.md) which of the two you have.

## If the delete workflow is not set up

- **Green toast, row gone.** The configured workflow ran.
- **Red toast, nothing changes.** No delete workflow is available on this deployment. Reload the list and the recording is still there, exactly as before — a clean no-op, nothing was deleted and nothing is at risk. It is a deployment problem, not a mistake on your side: ask your operator to configure one.

Deleting is never blocked by a recording's [status](./status-reference.md) — you can remove one while it is still processing.
