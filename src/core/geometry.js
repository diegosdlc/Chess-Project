export function point(projection, x, y) {
  return {
    x: projection.origin.x + x * projection.xAxis.x + y * projection.yAxis.x,
    y: projection.origin.y + x * projection.xAxis.y + y * projection.yAxis.y
  };
}

export function cellBox(projection, x, y) {
  const a = point(projection, x, y);
  const b = point(projection, x + 1, y);
  const c = point(projection, x + 1, y + 1);
  const d = point(projection, x, y + 1);
  const xs = [a.x, b.x, c.x, d.x];
  const ys = [a.y, b.y, c.y, d.y];
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  return { left, top, width: right - left, height: bottom - top };
}

export function insetBox(box, horizontal, vertical) {
  return {
    left: box.left + box.width * horizontal,
    top: box.top + box.height * vertical,
    width: box.width * (1 - horizontal * 2),
    height: box.height * (1 - vertical * 2)
  };
}

export function percent(value, total) {
  return `${(value / total) * 100}%`;
}

export function place(element, box, projection) {
  element.style.left = percent(box.left, projection.width);
  element.style.top = percent(box.top, projection.height);
  element.style.width = percent(box.width, projection.width);
  element.style.height = percent(box.height, projection.height);
}
