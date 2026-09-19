import type { AppDefinition, AppId } from "./apps";

export interface GridCell {
  col: number;
  row: number;
}

/**
 * Collision-free grid cells for the desktop icons.
 *
 * - Apps flow top-down in their declared `desktopColumn` and wrap into the
 *   next column when `rows` runs out.
 * - A later column group starts right of wherever the previous group ended,
 *   so an overflowing portfolio column pushes the games column over instead
 *   of landing on top of it.
 * - A `desktopBeside` app takes the cell right of its anchor. That cell is
 *   reserved before later groups flow, so they route around it. If the cell
 *   is already taken, the app falls to the next free cell below/after it.
 *
 * Pure (no window access) so it's deterministic for SSR and easy to test.
 */
export function iconGrid(
  apps: AppDefinition[],
  rows: number,
): Map<AppId, GridCell> {
  const safeRows = Math.max(1, rows);
  const cells = new Map<AppId, GridCell>();
  const taken = new Set<string>();
  const key = (c: GridCell) => `${c.col},${c.row}`;

  const nextFree = (from: GridCell): GridCell => {
    const cell = { ...from };
    while (taken.has(key(cell))) {
      cell.row += 1;
      if (cell.row >= safeRows) {
        cell.row = 0;
        cell.col += 1;
      }
    }
    return cell;
  };

  const place = (id: AppId, cell: GridCell) => {
    cells.set(id, cell);
    taken.add(key(cell));
  };

  const flowing = apps.filter((a) => !a.desktopBeside);
  const beside = apps.filter((a) => a.desktopBeside);
  const columns = [...new Set(flowing.map((a) => a.desktopColumn ?? 0))].sort(
    (a, b) => a - b,
  );

  let nextCol = 0;
  for (const column of columns) {
    let cursor: GridCell = { col: Math.max(column, nextCol), row: 0 };
    const group = flowing.filter((a) => (a.desktopColumn ?? 0) === column);
    for (const app of group) {
      cursor = nextFree(cursor);
      place(app.id, cursor);
      nextCol = Math.max(nextCol, cursor.col + 1);
    }
    // Reserve the neighbours of this group's icons before the next group.
    for (const app of beside) {
      const anchor = app.desktopBeside && cells.get(app.desktopBeside);
      if (!anchor || cells.has(app.id)) continue;
      const wanted = { col: anchor.col + 1, row: anchor.row };
      place(app.id, nextFree(wanted));
    }
  }

  // Anchor missing, or itself a `desktopBeside` app: flow at the end.
  for (const app of beside) {
    if (!cells.has(app.id)) place(app.id, nextFree({ col: nextCol, row: 0 }));
  }
  return cells;
}
