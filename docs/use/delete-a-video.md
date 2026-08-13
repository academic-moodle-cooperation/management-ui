# Delete a video

For editors and admins removing recordings. Afterwards you'll know the difference between the trash and permanent removal, and which one you are allowed to use.

Both live in a video row's **Actions** column — as an icon in the row, or under the **⋮** button when the row has more actions than fit.

## Move to trash

Available to everyone who may edit the recording, in every status.

1. On **Videos**, choose **Move to trash** in the row's *Actions*.
2. Confirm in **Move video to trash?** — *"It will be hidden from users and can be restored or permanently deleted by an administrator."*
3. **The video has been moved to the trash!** in green confirms it, and the row leaves your list. The recording is hidden, not destroyed, and an administrator can bring it back.
4. **The video could not be moved to the trash!** in red means nothing was removed — see the caveat below.

## If the trash is not set up

The trash is not part of this interface: it needs a workflow configured in your Opencast, and the interface cannot create one. That gives you two outcomes to recognize.

- **Green toast, row gone.** The trash works. The recording is recoverable by an administrator.
- **Red toast, nothing changes.** No trash workflow is available on this deployment. Reload the list and the recording is still there, exactly as before — this is a clean no-op, so nothing was deleted and nothing is at risk. It is a deployment problem, not a mistake on your side: ask whoever [runs the deployment](../operate/backend-config.md) to set the trash up.

There is a third possibility the interface cannot show you: on a deployment that never enabled the trash at all, *Move to trash* reports success but removes the recording for good. If you are counting on being able to undo a removal, confirm once with your operator that a real trash is configured rather than inferring it from the green toast.

## Delete permanently

**Administrators only.** If you are not one, the entry is not in the menu — that is intended, not a fault.

**Delete permanently** opens **Delete Video permanently?**: *"Do you really want to delete the video … permanently and irreversibly? All publications of this video will be invalidated."* Confirm with **Delete**.

Irreversible means irreversible. The recording is removed and every published link to it stops working, including links already handed out to viewers. **The video has been permanently deleted!** confirms it.

## Which one to use

| Situation | Use |
|---|---|
| Wrong file, uploaded a minute ago | Move to trash |
| No longer needed, but someone might miss it | Move to trash |
| A legal or privacy obligation to erase | Delete permanently (admin) |
| Not sure | Move to trash |

Deleting is never blocked by a recording's [status](./status-reference.md) — you can remove one while it is still processing.
