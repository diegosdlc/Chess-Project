# Music and audio

Place level music and sound effects here (for example `assets/music/forest-theme.ogg`).

A level can opt into music through its `music` block:

```js
music: {
  track: './assets/music/forest-theme.ogg',
  volume: 0.45,
  loop: true
}
```

Audio starts only after the first user interaction to respect browser autoplay policies.
