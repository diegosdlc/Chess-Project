# Board elements

This folder is for obstacles, props and special-tile artwork that belongs to a level.

Example blocking obstacle:

```js
boardElements: [
  {
    id: 'rock-01',
    name: 'Boulder',
    x: 4,
    y: 3,
    asset: './assets/board-elements/rocks/rock-01.webp',
    blocking: true,
    scale: 1.25,
    yOffset: -0.25
  }
]
```

Example special tile:

```js
specialTiles: [
  {
    id: 'altar-01',
    name: 'Ancient altar',
    x: 2,
    y: 4,
    asset: './assets/board-elements/tiles/altar.webp'
  }
]
```

Blocking elements already stop movement. Special tiles are content hooks ready for additional gameplay effects.
