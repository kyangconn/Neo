# Image Generation

Whale Play can connect to **ComfyUI** — a powerful image generation tool — to create pictures based on your chat content. This lets you bring your roleplay scenes to life visually.

---

## What Is Image Generation?

Image generation in Whale Play means sending a text description to an AI image model and getting back a picture. You can use this to:

- **Visualize a scene** from your roleplay — a moonlit forest, a bustling tavern, a dramatic confrontation.
- **Generate character portraits** for your persona or NPCs.
- **Create mood images** to set the atmosphere for a conversation.

Behind the scenes, Whale Play connects to a running **ComfyUI** server. ComfyUI is a free, open-source tool that runs AI image models on your computer or on a remote server.

> **Note:** Image generation is optional. You can use Whale Play for text-only roleplay without ever touching this feature.

---

## Connecting to a ComfyUI Server

Before you can generate images, you need a ComfyUI server running somewhere.

### Option 1: Run ComfyUI Locally

1. Install ComfyUI by following the [official guide](https://github.com/comfyanonymous/ComfyUI).
2. Launch ComfyUI on your computer. It will start a local server, usually at `http://127.0.0.1:8188`.
3. In Whale Play, go to **Settings → Image Generation**.
4. Enter the server address: `http://127.0.0.1:8188`
5. Click **"Test Connection"** to verify Whale Play can reach ComfyUI.

### Option 2: Use a Remote Server

If you have ComfyUI running on another machine or a cloud service:

1. Get the server's URL (e.g., `http://192.168.1.50:8188` or a cloud endpoint).
2. Enter it in Whale Play's Image Generation settings.
3. Click **"Test Connection"** to verify.

![Image generation settings](../images/image-settings.png)

> **📸 Screenshot needed:** Navigate to Settings → Image Generation. Capture the page showing the ComfyUI server URL field, the "Test Connection" button, and the workflow import section. Save as `docs/images/image-settings.png`.

---

## Importing ComfyUI Workflows

ComfyUI uses **workflows** — visual graphs of nodes that define how an image is generated. A workflow tells the AI what model to use, what settings to apply, and how to process the output.

Whale Play lets you import these workflows as `.json` files.

### How to Get a Workflow

1. Open ComfyUI in your browser (usually `http://127.0.0.1:8188`).
2. Build or open a workflow in ComfyUI's visual editor.
3. Click **"Save"** in ComfyUI to download the workflow as a `.json` file.

Or find ready-made workflows shared by the community on sites like [CivitAI](https://civitai.com) and [OpenArt](https://openart.ai).

### Import Into Whale Play

1. In Whale Play, go to **Settings → Image Generation**.
2. Click **"Import Workflow"**.
3. Select a `.json` workflow file from your computer.
4. The workflow is now loaded and ready to use.

### What a Workflow Needs

For Whale Play to use a workflow correctly, it should have:

- A **text input node** — where your description goes. This is usually a "CLIP Text Encode" node.
- A **seed node** — for controlling randomness (optional, but helps with consistency).
- An **output node** — where the final image comes out (typically "Save Image" or "Preview Image").

---

## Generating Images During Chat

Once your ComfyUI connection is set up, you can generate images without leaving the chat view.

### Generate an Image from a Message

1. In a chat, look for the **image generation (palette) icon** 🎨 near the message input or on existing messages.
2. Click it to open the image prompt dialog.
3. Enter a **description** of what you want to see. For example: "Luna the forest spirit sitting among ancient books, glowing blue light, ethereal atmosphere."
4. Click **"Generate"**.
5. Wait a moment — the image will appear in the chat as a new message.

![Image generation in chat](../images/image-generation-chat.png)

> **📸 Screenshot needed:** During an active chat, open the image generation prompt dialog. Capture the dialog showing a text description entered and the "Generate" button. If possible, also show a generated image that's been inserted into the chat. Save as `docs/images/image-generation-chat.png`.

---

## Image Parameters and Settings

These settings control how your images look. You can adjust them in **Settings → Image Generation**.

| Setting | What it does | Example |
|---|---|---|
| **Image Width** | The width of generated images in pixels. | 512, 768, 1024 |
| **Image Height** | The height of generated images in pixels. | 512, 768, 1024 |
| **Steps** | How many processing steps the AI takes. More steps = more detailed (but slower). 20–30 is a good range. | 20 |
| **CFG Scale** | How closely the image follows your description. Higher = more faithful but less creative. 7–12 is typical. | 7 |
| **Seed** | A starting number for the random generation. Use the same seed + same prompt = same image. Leave blank for random each time. | 12345 |

### Quick Reference

| Style | Width × Height | Steps | CFG |
|---|---|---|---|
| Portrait | 512 × 768 | 25 | 7 |
| Landscape | 768 × 512 | 25 | 7 |
| Square (profile pic) | 512 × 512 | 20 | 8 |
| High detail | 1024 × 1024 | 35 | 10 |

---

## Tips for Good Image Prompts

- **Be descriptive.** Instead of "a forest," try "a misty forest at dawn with towering pines and glowing mushrooms."
- **Specify the style.** "Anime style," "oil painting," "cinematic lighting," "watercolor" — these words drastically change the result.
- **Mention the mood.** Words like "peaceful," "ominous," "dreamy" help the AI match the atmosphere.
- **Keep it reasonable.** Very complex prompts can confuse the model. Stick to 1–2 subjects and a clear setting.

---

## Troubleshooting

| Problem | Likely cause | Solution |
|---|---|---|
| "Connection failed" | ComfyUI isn't running or the URL is wrong. | Make sure ComfyUI is running and check the URL. |
| "Workflow error" | The imported workflow is missing required nodes. | Open the workflow in ComfyUI and verify it works there first. |
| Generation is very slow | Running on CPU, or using a large model. | ComfyUI needs a GPU for reasonable speed. Try smaller images (512×512). |
| Images look bad | Settings don't match the model. | Try different CFG scale and steps values. Check what settings the workflow's model prefers. |

---

## Next Steps

- Review the [Settings](./settings.md) page for more configuration options
- Check out [Presets](./presets.md) to fine-tune chat behavior alongside your images
