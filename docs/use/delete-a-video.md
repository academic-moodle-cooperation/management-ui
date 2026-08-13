# Delete a video

For editors and admins removing recordings. Afterwards you'll know the difference between the trash and permanent removal, and which one you are allowed to use.

Both live in a video row's **Actions** column — as an icon in the row, or under the **⋮** button when the row has more actions than fit.

## Move to trash

Available to everyone who may edit the recording, in every status.

1. On **Videos**, choose **Move to trash** in the row's *Actions*.
2. Confirm in **Move video to trash?** — *"It will be hidden from users and can be restored or permanently deleted by an administrator."*
3. **The video has been moved to the trash!** confirms it, and the row leaves your list.

This is the reversible one: the recording is hidden, not destroyed, and an administrator can bring it back.

**One caveat worth knowing before you rely on it.** Whether a trash exists at all is decided by your Opencast, not by this interface — and the interface reports "moved to the trash" either way. On a deployment with no trash configured, the recording is simply gone. Ask whoever [runs the deployment](../operate/backend-config.md) which of the two you have.

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
