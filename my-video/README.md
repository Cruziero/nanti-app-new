# Remotion video

<p align="center">
  <a href="https://github.com/remotion-dev/logo">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-dark.apng">
      <img alt="Animated Remotion Logo" src="https://github.com/remotion-dev/logo/raw/main/animated-logo-banner-light.gif">
    </picture>
  </a>
</p>

Welcome to your Remotion project!

## Commands

**Install Dependencies**

```console
npm i
```

**Start Preview**

```console
npm run dev
```

**Render video**

```console
npx remotion render
```

**Upgrade Remotion**

```console
npx remotion upgrade
```

## Docs

Get started with Remotion by reading the [fundamentals page](https://www.remotion.dev/docs/the-fundamentals).

## Help

We provide help on our [Discord server](https://discord.gg/6VzzNDwUwV).

## Issues

Found an issue with Remotion? [File an issue here](https://github.com/remotion-dev/remotion/issues/new).

## License

Note that for some entities a company license is needed. [Read the terms here](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md).

## NANTI videos

Two vertical (1080×1920, 30fps) Indonesian videos with AI voice-over live in `src/nanti/`:

- `NantiIntro`: 32s how-to (forward or paste a chat → NANTI finds who/what/when → reminder)
- `NantiPromo`: ~42s promo, including a "Hitung sendiri" scene where viewers work out what a forgotten promise costs them

Voice-over: the spoken lines are in `scripts/voiceover.json` (spelled the way the voice should pronounce them). Edit a line, then run `scripts/make-voiceover.sh` to regenerate `public/vo/*.wav` and `src/nanti/vo-durations.json`. Scenes stretch to fit each line automatically. To use a human recording instead, replace the WAV with the same name and rerun only the duration step.

Preview: `npm run dev`. Render:

```
npx remotion render src/index.ts NantiIntro out/NANTI-cara-pakai-9x16.mp4 --codec=h264 --crf=20
npx remotion render src/index.ts NantiPromo out/NANTI-promo-9x16.mp4 --codec=h264 --crf=20
```

Copy and colors are at the top of each file and in `src/nanti/ui.tsx`.
