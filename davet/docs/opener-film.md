# The opener film

The `tor` gate can play a pre-rendered clip instead of drawing the door in CSS.
This is how the reference invitation (ahsanwedsafra.vercel.app) does it, and it
is the only way to get a photographic look, theirs is a 7.01s, 2160×3840 clip,
not CSS.

The whole trick is that **frame 0 of the clip IS the static first screen**. The
still sits underneath the paused video at identical size and `object-fit`, so
starting playback changes nothing on screen. Nothing is swapped and nothing
re-lays out, so there is no seam: the picture simply begins to move.

If frame 0 and the poster differ by even a little, a visible flash appears on
click. That is the one thing that must be exact.

---

## The concept

Black and white throughout. A pair of tall dark double doors, shut, with a
blade of light escaping the seam and the blurred shadows of moving figures
crossing it. On click the doors open and the camera pushes through into a
wedding reception in full swing, guests dancing, laughing, wine glasses
raised, moving between the dancers close enough to read their faces.

Monochrome is not only taste: it matches the Atelier Blanc / Vicioso theme, and
it hides what generative video is worst at, skin tones, colour drift, and
saturation shifts between frames.

## 1. Generate the still first, then animate it

Do **not** ask a text-to-video model for the whole thing in one go. Most will
drift on the opening frame, and then the poster can never match.

1. Generate the **still** of the closed door (§4). Iterate until you love it, 
   this is the first screen every guest sees.
2. Feed that exact image into an **image-to-video** model as the init/first
   frame (Kling, Runway Gen-3, Luma, Pika, Hailuo all support it).
3. The still becomes the poster, so frame 0 is guaranteed identical.

**On model choice:** Veo/Gemini has already refused this brief once. Kling,
Runway, Luma, Pika and Hailuo are all far more permissive with crowds and
faces, and Kling's start-frame conditioning is the strongest for this shot.

## 2. Technical specification

| | |
|---|---|
| Duration | **3.0s.** Doors opening plus a push between dancers plus readable faces is too much for 2s. The code reads the clip's real duration, so any length works |
| Aspect | **9:16 portrait** |
| Resolution | 1080×1920 (1440×2560 fine) |
| Frame rate | 30fps (24 acceptable) |
| Container / codec | **MP4, H.264, `yuv420p`**: needed for Safari and iOS |
| Audio | **None.** Strip the track entirely |
| Target size | **under 4 MB** (it is preloaded before the gate is usable) |
| Ending | **Does not need to end on white.** The bloom that covers the handover is a CSS layer over the film |
| First frame | Sharp, static, no motion blur: it is the poster |
| Text | **None.** The names and button are live HTML drawn over the film |

```bash
ffmpeg -i raw.mp4 -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
       -crf 23 -movflags +faststart tor.mp4
ffmpeg -i tor.mp4 -vf "select=eq(n\,0)" -vframes 1 -q:v 2 tor-poster.jpg
```

Always extract the poster **from the finished clip**, never from the original
still, that way it matches whatever the model actually produced.

## 3. Where the files go

```
davet/public/beispiel/tor.mp4          <- the clip
davet/public/beispiel/tor-poster.jpg   <- frame 0
```

Then point the demo invite at them in `src/lib/db/demo.ts`, next to where
`opener` is set to `"tor"`:

```ts
inv.openerFilm       = "/beispiel/tor.mp4";
inv.openerFilmPoster = "/beispiel/tor-poster.jpg";
```

Both fields are optional on the `Invite` type. Any invite without them falls
back to the CSS door, nothing else has to change. For real customers these
would come from the same upload path as `heroImage`; that needs a Supabase
column and a migration, which is not done yet.

## 4. Prompt: the still

```
Black and white photograph. Wide, symmetrical, straight-on shot of a pair of
tall dark double doors, closed, centred in frame, set into a pale plaster wall
of a grand European venue. A bright blade of light escapes the vertical seam
between the doors and falls as a long streak across a polished stone floor.
Faint blurred shadows of moving figures cross the light in the gap. The room in
the foreground is empty, dim and still. Deep blacks, luminous highlights,
strong chiaroscuro, fine film grain, 35mm documentary wedding photography, high
contrast monochrome. No text.
```

Negative:

```
colour, colours, text, watermark, logo, caption, people in foreground, clutter,
low contrast, flat lighting, tilted horizon
```

The blurred shadows crossing the light are the important detail, they promise
the party before the doors move.

## 4b. Prompt: the last frame

Veo conditions on a *first* frame only, so this one is usually a target you
describe in words rather than an input you pass. Generate it anyway: it settles
what the end of the dolly should look like, and if your surface does accept an
end frame (Vertex does on some versions) you get far tighter control.

```
Black and white photograph, vertical 9:16. Close immersive view from inside a
crowded wedding dance floor in a grand hall. Guests in black tie and evening
dresses pressed close around the camera, dancing, arms raised, heads back
laughing, holding wine glasses that catch the light. Two guests in the
foreground clinking glasses with wide genuine smiles. Confetti suspended in the
air. Strong backlight through haze, deep blacks, luminous highlights, shallow
depth of field, natural motion blur on hands and fabric, fine 35mm film grain,
high contrast monochrome documentary wedding photography. No text.
```

Negative, for every prompt in this document:

```
colour, colours, text, watermark, logo, caption, distorted faces, extra limbs,
extra fingers, deformed hands, warped mouths, static shot, slideshow, jump cut,
strobing, speed ramp, tilted horizon
```

## 5. Prompt: the motion

```
Start exactly on this frame. The doors swing open inward and the camera pushes
slowly forward through the doorway into a crowded wedding reception in full
swing. Guests in black tie and evening dresses dancing close together,
laughing, arms raised, holding wine glasses, clinking them together. The camera
continues in one slow steady dolly between the dancers, passing close to their
faces, catching wide genuine smiles and open laughter. Warm backlight through
haze, confetti in the air. Black and white, documentary energy with smooth
camera motion, shallow depth of field, natural motion blur on hands and
dresses, fine film grain, high contrast monochrome, 35mm. One unbroken take.
```

Negative:

```
colour, text, watermark, caption, distorted faces, extra limbs, extra fingers,
deformed hands, warped mouths, static shot, slideshow, jump cut, strobing,
speed ramp
```

Timing to aim for across the 3 seconds:

| t | |
|---|---|
| 0.00 – 0.30s | held on the opening frame, camera barely moving |
| 0.30 – 0.90s | doors swing inward, light and sound spill out |
| 0.90 – 1.80s | camera crosses the threshold, the dance floor opens up |
| 1.80 – 3.00s | dolly between the dancers, faces and glasses in close view |

## 6. Two wording traps

**Never name an ethnic group.** "Europeans" is almost certainly what got Veo to
refuse. Naming a demographic is a request most models flag. Say "a European
venue", "black tie", "a grand ballroom", the setting and wardrobe give the
same look with nothing for the filter to catch.

**"Dolly zoom" is the Vertigo effect**, dolly in while zooming out, so the
background warps. It reads as unease, not celebration. The prompt above asks
for a straight dolly push-in, which is what this shot wants.

## 6b. If you are generating in Gemini / Veo

- **It takes a first frame, not a last one.** §4 is the input image; §4b is a
  target the motion prompt has to describe in words. That is why §5 ends with
  "ends among them, close to their faces".
- **Veo generates audio.** The gate needs none, `-an` in the encode strips it.
- **Check the aspect you actually get.** Veo often returns 16:9 and its 9:16
  support varies by surface. This decides §7: 9:16 wants a centred portrait
  stage on desktop, 16:9 wants full-bleed desktop and a different treatment on
  phones.
- Gemini clips run long (commonly 8s). Trim with `-t 3.0`, then pull the poster
  from the trimmed file.

## 7. One change still needed when the file lands

The gate is currently **full-bleed**, and `object-fit: cover` crops hard when
the clip's aspect and the screen's disagree. A 9:16 clip on a 1280×800 desktop
shows only the middle ~35% of its height, the dance floor would be cropped
away.

The reference avoids this by never being full-bleed: it plays inside a centred
480px portrait column on a dark backdrop.

So the film path needs, once there is a clip:

1. a bloom-to-white overlay over the film for the last ~250ms, so the handover
   is covered without the clip having to end on white;
2. a centred portrait stage on wide screens, full-bleed on phones, so one 9:16
   master works everywhere;
3. `openerFilm` / `openerFilmPoster` set on the demo invite.

Phones are the main case for an invitation link anyway, which is why 9:16 is
the right master. Two clips (9:16 and 16:9 swapped by media query) is only
worth it if desktop matters a lot.
