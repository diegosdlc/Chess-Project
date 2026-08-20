# Board elements

This folder is for obstacles, props and special-tile artwork that belongs to a level.

## Blocking obstacles

Blocking obstacles are declared in a level's `boardElements` array. They are part of the authoritative movement rules: pieces cannot occupy or capture their square, sliding pieces stop when they reach them, and knights may jump over them but cannot land on them. Frozen pieces keep their separate pass-through behavior; blocking board elements remain solid.

Use `type: 'blocker'` for the generic obstacle contract. `blocking: true` is the rules flag consumed by the movement engine. The optional `asset` can later replace a placeholder without changing the level rules.

Example blocking obstacle:

```js
boardElements: [
  {
    id: 'rock-01',
    type: 'blocker',
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

The tutorial currently uses placeholder blockers without bitmap assets so their final artwork can be swapped in later.

## Special tiles

Special tiles are visual/content hooks for future mechanics and can also use assets.

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
