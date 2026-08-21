# Balance de puntos

Este archivo es la **fuente de verdad editable** para el presupuesto de banda de Turn Over. El juego lee en tiempo de ejecución el bloque JSON delimitado por `balance-data:start` / `balance-data:end`; por tanto, los cambios de números no requieren tocar la lógica JavaScript.

Mantén el JSON válido. Los costes deben ser números positivos o cero y cada pieza debe definir `base` y `evolved`. Los límites de nivel son el máximo que el jugador puede desplegar. Si se añade un nivel sin entrada explícita, el juego usa automáticamente el valor calculado de la banda rival.

Los valores actuales son un punto de partida de balance. Las tres piezas especiales tienen el mismo coste base para que las bandas iniciales Verde, Roja y Amarilla valgan lo mismo en el nivel 1.

<!-- balance-data:start -->
```json
{
  "pieceCosts": {
    "pawn": { "base": 2, "evolved": 3 },
    "bishop": { "base": 4, "evolved": 6 },
    "knight": { "base": 4, "evolved": 6 },
    "rook": { "base": 4, "evolved": 6 },
    "queen": { "base": 7, "evolved": 9 },
    "king": { "base": 5, "evolved": 7 }
  },
  "levelPointLimits": {
    "tutorial-01": 18,
    "tutorial-02": 18
  }
}
```
<!-- balance-data:end -->

## Regla de equivalencia

El límite de cada nivel debe equivaler al valor en puntos de la banda rival. `levelPointLimit()` compara el límite configurado con el valor real de las unidades enemigas y muestra un aviso de consola si divergen. Esto permite detectar rápidamente que un cambio de coste necesita un ajuste de presupuesto.

Con los valores actuales, la banda rival del tutorial (Rey + Reina + Peón + Alfil, todos base) vale **18 puntos**, por eso los dos niveles actuales tienen límite 18.

## Evolución y coste

El coste se resuelve por `pieceType` y `evolutionStage`. Una pieza evolucionada usa siempre el valor `evolved`. Una pieza en reserva mantiene su estado y su coste para niveles posteriores, pero no consume presupuesto en el encuentro actual.
