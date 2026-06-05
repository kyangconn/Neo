# Quick Start

This walkthrough will take you from a fresh install to your very first AI character roleplay chat. You don't need any technical background — just follow the steps below.

---

## Step 1: Launch the App

After completing the [installation](./installation.md), start Whale Play:

```bash
pnpm dev
```

Once the dev server is ready, the terminal will show a URL — **open it in your browser**:

```
➜  Local:   http://localhost:1420/
➜  Network: http://192.168.x.x:1420/
```

Click the link or paste `http://localhost:1420` into your browser's address bar. You should see the Whale Play home screen.

> **If you used a prebuilt binary:** just double-click the Whale Play icon on your desktop or Start menu. The app opens as a normal window — no need for a terminal.

---

## Step 2: Configure Your API Key

Whale Play uses the DeepSeek API to power the AI responses. You'll need to add your own API key.

### Get a DeepSeek API Key

1. Go to [platform.deepseek.com](https://platform.deepseek.com/) and sign up or log in.
2. Navigate to the **API Keys** section.
3. Click **Create new API key**, give it a name (e.g., "Whale Play"), and copy the key.

### Add the Key to Whale Play

1. In the app, look at the **left sidebar** — click the **gear icon** ⚙️ (Settings).
2. Scroll down to the **"DeepSeek API"** section.
3. **Paste your API key** into the text field.
4. Click **"Save DeepSeek Profile"** — you should see a success message.
5. Click **"Test Connection"** to verify everything works. A green checkmark ✅ means you're good to go.

![API settings page](../../images/settings-api.png)

> **📸 Screenshot needed:** After entering your API key, capture the Settings page showing the DeepSeek API section with the key filled in. Save the image as `docs/images/settings-api.png`.

---

## Step 3: Create a Character

Now it's time to build your first character — the personality the AI will roleplay as.

1. In the **left sidebar**, click the **person icon** 👤 (Characters).
2. You'll see an empty character list. Click **"New Character"**.
3. Fill in the character details:

   | Field | What to put | Example |
   |---|---|---|
   | **Name** | Your character's name | Luna |
   | **Description** | A short summary | A mysterious forest spirit who guards an ancient library |
   | **Personality** | Key traits (comma-separated) | wise, curious, gentle, playful |
   | **First Message** | The opening line your character will say | *"Welcome, traveler. I've been expecting you. The books have whispered your name for days."* |

4. Click **"Create"** at the bottom of the form.

Your character now appears in the list. You can create as many as you like — each one has its own unique personality.

![Character creation dialog](../../images/character-create.png)

> **📸 Screenshot needed:** Fill in the character creation form with example data (like "Luna" above) and capture the dialog. Save as `docs/images/character-create.png`.

---

## Step 4: Start Chatting

Your character is ready. Let's talk to them.

1. In the **left sidebar**, click the **house icon** 🏠 (Home).
2. You should see your new character's **avatar card** on the home screen.
3. **Click on the avatar** or the character's name — this opens the chat view.
4. Type a message in the text box at the bottom and press **Enter** (or click the send button).

The AI will respond based on the character card you created. Every response will reflect the personality, tone, and backstory you gave them.

![Chat interface with first message](../../images/chat-first-message.png)

> **📸 Screenshot needed:** Send a greeting to your character (e.g., *"Hello! What's this place?"*) and capture the chat view showing both your message and the AI's response. Save as `docs/images/chat-first-message.png`.

---

## Step 5: Explore More

You're up and running! Here are a few things to try next:

### Chat Actions
- **Right-click** (or long-press on mobile) a chat message to see options:
  - **Savepoint** — bookmark a moment in the conversation to return to later.
  - **Delete** — remove a message or prune the chat history.
  - **Copy** — copy a message to your clipboard.

### More Characters
- Create characters with different personalities and see how the AI adapts.
- Experiment with longer or more detailed character cards for richer responses.

### Settings
- Adjust the **temperature** and **max tokens** in Settings to control how creative or focused the AI is.
- Lower temperature (0.3–0.5) = more predictable responses.
- Higher temperature (0.8–1.2) = more creative, surprising responses.

### Next Steps
- Check the other guides in this documentation for advanced features, prompt injection, and agentic play mechanics.
- Join the project community to share characters and get tips.

---

**Happy roleplaying! 🐋**
