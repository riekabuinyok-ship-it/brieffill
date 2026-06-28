# BriefFill Google Docs add-on

Analyze a creative brief directly inside a Google Doc — no copy/pasting to the web app.

## Install (one-time, ~3 minutes)

1. **Create the Apps Script project**
   - Go to [script.google.com](https://script.google.com) and click **New project**.
   - Delete the default `Code.gs` content and paste the contents of `Code.gs` from this folder.
   - Click **+** next to "Files" → **HTML** → name it `Sidebar` → paste the contents of `Sidebar.html`.
   - Click the **gear icon** (Project settings) → enable "Show `appsscript.json`" → click the `appsscript.json` that appears in the left sidebar → paste the contents of `appsscript.json` from this folder. **Save**.
   - In the toolbar, select the function `onOpen` from the dropdown and click **Run**. Authorize when prompted (Google shows a scary "unverified" screen — click "Advanced" → "Go to project (unsafe)" — this is the standard Apps Script flow).

2. **Deploy the add-on**
   - Click **Deploy → New deployment**.
   - Click the gear icon next to "Select type" → choose **Add-on**.
   - Set a description, e.g. "BriefFill analyzer".
   - Click **Deploy**. Google will give you a deployment ID — you don't need to copy it; the add-on is now installed in your Google account.

3. **Get an API key from BriefFill**
   - In BriefFill, go to **Integrations** (in the top nav).
   - Scroll to the **Google Docs add-on** section.
   - Click **Generate new API key**. Copy the key that appears (it starts with `bfk_`).
   - Treat this key like a password. Anyone with it can submit brief analyses under your account.

4. **Configure the add-on**
   - Open any Google Doc.
   - **Extensions → BriefFill Brief Analyzer → Settings** (the first time you click, the sidebar opens).
   - Click **Settings** in the sidebar.
   - Paste the API key. The API URL can stay as the default unless you're self-hosting BriefFill.
   - Click **Save settings**.

5. **Use it**
   - Open or create a Doc with a brief in it.
   - Click **Extensions → BriefFill Brief Analyzer → Analyze brief**.
   - Either paste the brief text, click **Use selected text** (select a passage in the doc first), or click **Use whole doc**.
   - Click **Analyze brief**. You get a completeness score, field-by-field status, and suggested clarifying questions.
   - Click **Insert report into doc** to write the analysis at the end of the document.

## How authentication works

The add-on does **not** use Google OAuth to talk to BriefFill. It authenticates with a static API key you generate inside BriefFill. This is the same pattern as a GitHub Personal Access Token.

The key:
- is prefixed with `bfk_`
- is shown to you exactly once when generated
- is stored (hashed with SHA-256) in BriefFill's database
- is stored in your Apps Script **User Properties** (so the add-on remembers it between sessions but no other add-on can read it)
- can be revoked at any time from **Integrations → Google Docs add-on** in BriefFill

## Privacy

- The add-on sends **only the brief text you submit** to your BriefFill instance.
- The Doc contents are not auto-uploaded — the add-on only reads what you select or explicitly paste.
- All API calls go over HTTPS to the BriefFill API URL you configured.

## Uninstalling

- In Google Docs, **Extensions → Add-ons → Manage add-ons** → click the BriefFill add-on → **Remove**.
- In BriefFill, **Integrations → Google Docs add-on → Revoke** the API key.
