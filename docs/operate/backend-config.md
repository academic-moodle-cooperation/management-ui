# Backend configuration

For Opencast admins. Afterwards you'll have the server-side settings in place — including whether deleting a video sends it to the trash or removes it for good.

The `management-ui-graphql` bundle reads one OSGi configuration, PID **`org.opencastproject.mui`**. A deployment sets it the ordinary Opencast way, in `$OPENCAST_HOME/etc/org.opencastproject.mui.cfg`. Nothing here lives in the UI's [`config.json`](./configure.md) — these values decide what the *server* does when the UI asks it to.

::: danger That file replaces the whole configuration — it does not merge
A `.cfg` supplies the **entire** dictionary for its PID. Keys you leave out are not "kept at the shipped value"; they fall back to the Java metatype's compiled-in default, and `trash.workflow.id` **has no metatype default**. So a `.cfg` containing nothing but, say, `thumbnail.flavor` wipes `trash.workflow.id` out of the live configuration and turns every delete into a permanent one. **Always write all six keys.** Start from the block in [Set it explicitly](#set-it-explicitly).
:::

## The six keys

| Key | Default | What it decides |
|---|---|---|
| `trash.workflow.id` | `trash` | Whether "delete" is reversible — see [below](#delete-is-reversible-only-if-this-key-is-set) |
| `republish.workflow.id` | `republish-metadata` | The workflow started after a metadata or ACL update, so the change reaches the publication channels |
| `thumbnail.channel.id` | `engage-player` | The publication channel searched for a video's thumbnail |
| `thumbnail.flavor` | `*/search+preview` | The attachment flavor picked as the thumbnail inside that channel |
| `publication.channel.id` | `engage-player` | The publication channel whose URL the UI offers as a video's player link |
| `managed.acl.order` | `public`, `authenticated`, `private` | The order in which a video's or series' ACL is matched against the organization's managed ACLs — the first name in this list whose entries are all contained in the item's ACL is the one reported |

The "default" column has two different sources, which is what makes the warning above matter: five defaults are compiled into the Java metatype ([`MuiConfig.java`](https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/backend/management-graphql/src/main/java/org/opencastproject/management/graphql/MuiConfig.java)) and apply whenever a key is absent. All six are *also* written once into the live configuration by an OSGi configurator resource shipped inside the bundle ([`OSGI-INF/configurator/mui.json`](https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/backend/management-graphql/src/main/resources/OSGI-INF/configurator/mui.json)) — and `trash.workflow.id` exists in that second list only. Both workflow ids must name a definition that exists on the server: each is looked up by id when the mutation runs, and the mutation fails if there is none. The republish workflow only starts when the mutation is asked to publish the change, which is what the UI does by default.

## Delete is reversible only if this key is set

The `deleteEvent` mutation branches on this one value, and there are **three** states — which look nothing alike to your users ([Delete a video](../use/delete-a-video.md) describes what they see):

- **Set, and the named workflow exists** → deleting applies that workflow to the latest version of the media package. The video survives; what "trash" means is whatever that workflow does.
- **Unset (null)** → deleting runs Opencast's plain delete. It is **irreversible**, and the UI looks exactly like the success above.
- **Set to a name the server has no workflow for** (an empty value counts) → nothing is deleted at all. The lookup fails, the user gets a red *"The video could not be moved to the trash!"*, and GraphQL reports `Workflow definition '<org>/<id>' not found or inaccessible`.

`trash.workflow.id` is the one key with **no default in the Java metatype**, so its `trash` value exists only because the configurator resource wrote it into the live configuration once, at install time. Any configuration that does not carry the key — a partial `.cfg`, or a deleted one — leaves it null, and the trash quietly becomes permanent deletion. The asymmetry is tracked as [issue #342](https://github.com/academic-moodle-cooperation/management-ui/issues/342); what this page describes is the behaviour a deployment gets today.

### Set it explicitly

Write the whole dictionary, every time. This block is the copy-paste starting point — it reproduces the shipped values, so it changes nothing until you edit it. To make deletion permanent on purpose, omit the `trash.workflow.id` line and write that down in your own runbook, because the UI gives users no hint either way.

```properties
# $OPENCAST_HOME/etc/org.opencastproject.mui.cfg
trash.workflow.id=trash
republish.workflow.id=republish-metadata
thumbnail.channel.id=engage-player
thumbnail.flavor=*/search+preview
publication.channel.id=engage-player
managed.acl.order=public,authenticated,private
```

**Setting the key is necessary but not sufficient — the named workflow must exist.** The shipped value is `trash`, and a stock Opencast ships no workflow definition by that name, so an untouched install sits in the third state above until someone installs one. Check with `curl -s -u <admin-user> "https://opencast.example.org/workflow/definitions.json"` and look for `"id":"trash"`; no match means it is missing. Then prove it end to end: upload a throwaway recording, delete it in the UI, and confirm the workflow ran and the media package survived. That test is the only reliable answer to "is delete reversible on this server?", and it is worth repeating after every upgrade.

## Applying a change

Karaf picks up a changed `.cfg` while Opencast runs: the component re-activates with the new values and the next GraphQL request uses them. If a change appears to do nothing, check that the file name matches the PID exactly — a typo creates a second, unread configuration instead of an error. Other symptoms: [Troubleshooting](./troubleshooting.md).

::: warning Deleting the `.cfg` is not a revert
The configurator resource is applied **once** and never re-applied — it carries a `:configurator:resource-version` the framework records as done. Removing your `.cfg` therefore does not restore the shipped values; it removes them, leaving `trash.workflow.id` null for good. To get the shipped configuration back you have to make the framework process that resource again, which means reinstalling the bundle — touching the JAR in `$OPENCAST_HOME/deploy/` is enough. Prefer editing the full block above over deleting the file.
:::
