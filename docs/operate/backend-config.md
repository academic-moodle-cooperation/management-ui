# Backend configuration

For Opencast admins. Afterwards you'll have the server-side settings in place — including whether deleting a video sends it to the trash or removes it for good.

The `management-ui-graphql` bundle reads one OSGi configuration, PID **`org.opencastproject.mui`**. A deployment sets it the ordinary Opencast way, in `$OPENCAST_HOME/etc/org.opencastproject.mui.cfg`; every key you leave out keeps the default the bundle ships. Nothing here lives in the UI's [`config.json`](./configure.md) — these values decide what the *server* does when the UI asks it to.

## The six keys

| Key | Default | What it decides |
|---|---|---|
| `trash.workflow.id` | `trash` | Whether "delete" is reversible — see [below](#delete-is-reversible-only-if-this-key-is-set) |
| `republish.workflow.id` | `republish-metadata` | The workflow started after a metadata or ACL update, so the change reaches the publication channels |
| `thumbnail.channel.id` | `engage-player` | The publication channel searched for a video's thumbnail |
| `thumbnail.flavor` | `*/search+preview` | The attachment flavor picked as the thumbnail inside that channel |
| `publication.channel.id` | `engage-player` | The publication channel whose URL the UI offers as a video's player link |
| `managed.acl.order` | `public`, `authenticated`, `private` | The order in which a video's or series' ACL is matched against the organization's managed ACLs — the first name in this list whose entries are all contained in the item's ACL is the one reported |

The defaults come from two different places, which matters for the next section: five of them are compiled into the Java metatype ([`MuiConfig.java`](https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/backend/management-graphql/src/main/java/org/opencastproject/management/graphql/MuiConfig.java)), and all six are also shipped as an OSGi configurator resource inside the bundle ([`OSGI-INF/configurator/mui.json`](https://github.com/academic-moodle-cooperation/management-ui/blob/HEAD/backend/management-graphql/src/main/resources/OSGI-INF/configurator/mui.json)).

Both workflow ids must name a definition that exists on the server: each is looked up by id when the mutation runs, and the mutation fails if there is none. The republish workflow only starts when the mutation is asked to publish the change, which is what the UI does by default.

## Delete is reversible only if this key is set

The `deleteEvent` mutation branches on exactly one value:

- **`trash.workflow.id` set** → deleting a video applies that workflow to the latest version of its media package. The video is not destroyed; what "trash" means is whatever that workflow does.
- **`trash.workflow.id` unset (null)** → deleting a video runs Opencast's plain delete. It is **irreversible**, and the UI looks exactly the same either way.

The odd part: `trash.workflow.id` is the one key with **no default in the Java metatype**. Its `trash` value comes solely from the configurator resource the bundle ships. Anything that keeps that resource from being applied therefore leaves the value null and silently turns the trash into permanent deletion. (Blanking the key is a *different* failure: an empty id is not null, so deletion takes the trash branch and then fails outright, because no workflow definition matches.) The asymmetry is tracked as [issue #342](https://github.com/academic-moodle-cooperation/management-ui/issues/342); what this page describes is the behaviour a deployment gets today.

Two consequences for an operator:

1. **Set it explicitly.** Do not rely on the shipped default for a decision this size:

   ```properties
   # $OPENCAST_HOME/etc/org.opencastproject.mui.cfg
   trash.workflow.id=trash
   ```

   To make deletion permanent on purpose, remove the key from the running configuration rather than blanking it, and say so in your own runbook — the UI gives users no hint.

2. **Verify it once, on a throwaway recording.** Upload a test video, delete it in the UI, then check whether your trash workflow ran and the media package still exists. That single test is the only reliable answer to "is delete reversible on this server?".

## Applying a change

Karaf picks up a changed `.cfg` while Opencast runs; the component re-activates with the new values, and the next GraphQL request uses them. If a change appears to do nothing, confirm the file name matches the PID exactly — a typo produces a new, unread configuration rather than an error. Other symptoms: [Troubleshooting](./troubleshooting.md).
