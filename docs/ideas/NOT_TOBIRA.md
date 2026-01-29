[![AV Portal – Universität Innsbruck](https://tse1.mm.bing.net/th/id/OIP.rwlDJGwckRCV5i3rL7EfQgHaHL?cb=defcache2\&pid=Api\&defcache=1)](https://www.uibk.ac.at/de/ecampus/werkzeuge/av-portal/?utm_source=chatgpt.com)

If you don’t want to compete with **Tobira**, the trick is to **not build “the general Opencast video portal”**—because that’s exactly Tobira’s lane: a full portal where users can browse/search content, organize it in a page hierarchy, and (increasingly) upload/manage videos and permissions. ([Elan EV][1])

So your portal should look like a **purpose-built experience layer** that *consumes* Opencast content but *delegates* “portal-y” management to Tobira (or to LMS plugins / Opencast admin UI).

## What to avoid (to stay out of Tobira’s way)

Don’t replicate these as your core product:

* “Whole institution” **search + browse everything**
* **Hierarchical pages** as the main information architecture
* **Upload + manage videos** (metadata, subtitles, ACL editing) as first-class features ([Elan EV][1])

## What yours could look like instead (4 non-competing directions)

### 1) LMS-first “Course Video Hub” (embedded, not a standalone portal)

**Look & feel:** a clean *course add-on* UI: “Week 1 / Week 2”, “This lecture”, “New since last visit”, “Continue watching”. Minimal global navigation.

**Why it’s not competing:** Tobira is a general portal; this is *contextual* inside the LMS. Opencast is commonly integrated via LMS plugins / LTI anyway. ([explore.opencast.org][2])

**Key screens**

* Course overview (series/playlist picker)
* Playlist/series view with filters (date, lecturer, tags)
* Video page (player + chapters + attachments)

### 2) “Public Showcase / Conference site” (curated, mostly anonymous)

**Look & feel:** a marketing-style site: curated collections, speaker pages, tracks, “featured talks”, lightweight search *within the curated set*.

**Why it’s not competing:** Tobira is for institutional video distribution; this is for *one program/event/brand* and can be mostly static/curated.

(There’s precedent for Opencast content being presented as dedicated hubs/portals rather than “everything for everyone”.) ([Opencast][3])

**Key screens**

* Landing page with featured playlists
* Track/topic pages (curated playlists)
* Talk page (player + abstract + resources)

### 3) “Player + Widgets Kit” (headless UI components, not a portal)

**Look & feel:** you ship **embeddable components** (Web Components/React widgets):

* `<oc-video-player event-id="…">`
* `<oc-playlist id="…">`
* `<oc-search scope="series:xyz">`

**Why it’s not competing:** you’re not running a competing portal; you’re enabling *other* sites to embed Opencast cleanly.

Opencast already has a strong default playback story via **Paella Player** (multi-stream, subtitles, etc.), so you can lean on that and focus on “glue/UI widgets”. ([Opencast][4])

### 4) “Ops/Editorial Portal” (for staff, not end-users)

**Look & feel:** dashboards: “ingest health”, “processing failures”, “publish status”, “caption coverage”, “top viewed this week”, “needs review”.

**Why it’s not competing:** Tobira is end-user facing. This is operational/editorial tooling (often a different team and workflow). Opencast already has an admin interface and active discussion around its UX/history—so there’s room for a focused ops UX without trying to be “the portal”. ([Opencast][4])

## Under the hood (how you’d wire it to Opencast)

To stay lightweight and future-proof, make it **API-first**:

* List videos via **External API Events** (`/api/events`) and series via **External API Series** (`/api/series`) ([stable.opencast.org][5])
* If your UX is “collections”, use **Playlists API** (`/api/playlists`) ([stable.opencast.org][6])
* Use signed URLs when needed (the Events API explicitly supports pre-signing distribution URLs) ([stable.opencast.org][5])
* Embed playback with Paella (or Opencast’s bundled integration) ([Opencast][4])

One important design constraint: in Opencast ecosystems, **authorization and file-serving can be split across systems** (e.g., LMS/Tobira decides, Opencast serves), so plan early for how your portal will prove authorization (tokens/signed URLs/proxy patterns). ([GitHub][7])

## A concrete “non-competing” default: the Course Hub

If you want one crisp answer: build a **course-scoped portal** that is:

* **Read/consume-first** (no upload/ACL editing)
* **Scoped** to a course/series/playlist (not global discovery)
* **Embedded** in the LMS (or looks like it)
* Uses Tobira links for “manage/edit” actions (handoff instead of re-implement)

That gives you something genuinely valuable that Tobira *doesn’t aim to be*, while still playing nicely with the Opencast direction where Tobira is the main general portal. ([Opencast][8])

[1]: https://elan-ev.github.io/tobira/?utm_source=chatgpt.com "Introduction | Tobira documentation"
[2]: https://explore.opencast.org/projects/lms-plugins?utm_source=chatgpt.com "LMS Plugins - Opencast Explore"
[3]: https://opencast.org/2025/06/30/opencast-explore/?utm_source=chatgpt.com "Opencast Explore"
[4]: https://opencast.org/features/?utm_source=chatgpt.com "Features - Opencast"
[5]: https://stable.opencast.org/docs.html?path=%2Fapi%2Fevents&utm_source=chatgpt.com "External API Events Service REST Documentation - Opencast"
[6]: https://stable.opencast.org/docs.html?path=%2Fapi%2Fplaylists&utm_source=chatgpt.com "External API Playlists Service REST Documentation - Opencast"
[7]: https://github.com/orgs/opencast/discussions/5334?utm_source=chatgpt.com "How to make external applications (e.g. LMS, Tobira) work ..."
[8]: https://opencast.org/demo-pages/?utm_source=chatgpt.com "Demo & Test Instances - Opencast"
