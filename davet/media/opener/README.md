# Opener film: masters

Source material for `public/beispiel/tor.mp4`. Not served; kept so the clip can
be re-cut without regenerating anything. See `docs/opener-film.md` for the brief.

| file | |
|---|---|
| `raw-dolly-10s.mp4` | the generated take, 10.0s, 1280×720, 30fps, with audio |
| `still-doors-first-frame.png` | the closed-door still fed to the model as frame 0 |
| `still-reception-last-frame.png` | the last-frame target (described in the prompt, not passed in) |

## How `tor.mp4` was made

10s retimed to 3.4s on an ease-in-out ramp: **1.2× at t=0, peaking near 5.7×
around 1.5s, decelerating to 0.34× and settling on the last frame**, which the
final four output frames hold. It arrives rather than cuts, the earlier
version ran flat out into the handover and the ending read as abrupt.

The beats land at doors-open 1.31s, threshold 1.64s, dancers 2.10s, which is
the timing table in `docs/opener-film.md` §5 stretched over the longer cut. The
gate reads the clip's real duration, so the length is not load-bearing.

A `setpts` expression cannot hold or repeat frames, and the tail needs both, so
the retime is an explicit frame map instead: source frames are extracted, an
output frame index k is mapped to a source second through the ramp's integral,
and the resulting order is fed back as a concat list.

```python
# speed shape over x = k/(N-1), N = 102 output frames at 30fps
g = lambda u: 1 - 0.72*u + 4.2 * math.sin(math.pi * u**1.5)**2
# source second for output frame k = 10 * (integral of g to x) / (integral to 1)
```

```bash
ffmpeg -y -i media/opener/raw-dolly-10s.mp4 -vsync 0 /tmp/src/%04d.png
# build seq.txt: one `file`/`duration 0.0333333` pair per output frame
ffmpeg -y -f concat -safe 0 -i seq.txt -vf "fps=30,format=yuv420p" -r 30 \
  -frames:v 102 -c:v libx264 -profile:v high -crf 20 -movflags +faststart \
  public/beispiel/tor.mp4

ffmpeg -y -i public/beispiel/tor.mp4 -vf "select=eq(n\,0)" -vframes 1 -q:v 2 \
  public/beispiel/tor-poster.jpg
```

No synthetic shutter blur: averaging frames at 5× ghosts rather than smears,
and it costs the readable faces the shot is for. The source's own motion blur
carries the fast middle.
