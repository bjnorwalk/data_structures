function TreeDiagram({ nodes, current, releasedIds = [] }) {
  const children = new Set(
    nodes.flatMap((n) => [n.left, n.right]).filter(Boolean),
  );
  const root = nodes.find((n) => !children.has(n.id));
  const positions = new Map();
  let column = 0,
    maxDepth = 0;
  function place(id, depth) {
    const n = nodes.find((node) => node.id === id);
    if (!n) return;
    place(n.left, depth + 1);
    positions.set(id, { x: ++column * 70, y: depth * 76 + 30 });
    maxDepth = Math.max(maxDepth, depth);
    place(n.right, depth + 1);
  }
  if (root) place(root.id, 0);
  return (
    <figure className="tree-diagram">
      <svg
        viewBox={`0 0 ${Math.max(210, (column + 1) * 70)} ${maxDepth * 76 + 64}`}
        role="img"
        aria-label={`Tree with ${nodes.length} nodes. Highlighted node ${current || "none"}.`}
      >
        <title>
          {nodes
            .map(
              (n) =>
                `${n.value}: left ${nodes.find((c) => c.id === n.left)?.value ?? "NULL"}, right ${nodes.find((c) => c.id === n.right)?.value ?? "NULL"}`,
            )
            .join("; ")}
        </title>
        {nodes.flatMap((n) =>
          [n.left, n.right].filter(Boolean).map((id) => {
            const a = positions.get(n.id),
              b = positions.get(id);
            return a && b ? (
              <line key={`${n.id}-${id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
            ) : null;
          }),
        )}
        {nodes.map((n) => {
          const p = positions.get(n.id);
          return p ? (
            <g
              key={n.id}
              className={`${n.id === current ? "current" : ""} ${releasedIds.includes(n.id) ? "released" : ""}`}
            >
              <circle cx={p.x} cy={p.y} r="23" />
              <text x={p.x} y={p.y + 5} textAnchor="middle">
                {n.value}
              </text>
              {n.height !== undefined && (
                <text
                  className="height-label"
                  x={p.x}
                  y={p.y + 39}
                  textAnchor="middle"
                >
                  h={n.height}
                </text>
              )}
            </g>
          ) : null;
        })}
      </svg>
      <figcaption>
        Lines represent child pointers.{" "}
        {releasedIds.length > 0 ? "Crossed-out nodes have been freed." : ""}
      </figcaption>
    </figure>
  );
}
export default function StateDiagram({ frame }) {
  return (
    <div className="state-diagram">
      {frame.tree && (
        <TreeDiagram
          nodes={frame.tree}
          current={frame.current}
          releasedIds={
            frame.releasedIds ?? (frame.released ? [frame.released] : [])
          }
        />
      )}{" "}
      {frame.memory && (
        <div className="memory-map" aria-label="Symbolic memory allocations">
          {frame.memory.length === 0 && <p>No allocated nodes.</p>}
          {frame.memory.map((block) => (
            <section
              key={block.id}
              className={`memory-block ${block.live ? "" : "freed"}`}
            >
              <h4>
                {block.id} <span>{block.label}</span>
                <em>{block.live ? "live" : "freed"}</em>
              </h4>
              <dl>
                {Object.entries(block.fields).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      )}
      {frame.grid && (
        <div>
          <p className="diagram-label">Grid · {frame.legend}</p>
          <table className="grid-diagram">
            <caption className="sr-only">Flood-fill grid</caption>
            <tbody>
              {frame.grid
                .map((row, r) => ({ id: `row-${r}`, row, r }))
                .map(({ id, row, r }) => (
                  <tr key={id}>
                    {row
                      .map((v, c) => ({ id: `cell-${r}-${c}`, v, c }))
                      .map(({ id, v, c }) => (
                        <td
                          key={id}
                          className={`cell-${v} ${frame.variables.row === r && frame.variables.col === c ? "current" : ""}`}
                          aria-label={`Row ${r}, column ${c}: ${v}`}
                        >
                          {v}
                        </td>
                      ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
      {frame.arrays?.map((a) => (
        <figure className="array-diagram" key={a.label}>
          <figcaption>{a.label}</figcaption>
          <ol>
            {a.values.length === 0 ? (
              <li className="empty-array">empty</li>
            ) : (
              a.values
                .map((value, i) => ({ id: `${a.label}-slot-${i}`, value, i }))
                .map(({ id, value, i }) => (
                  <li
                    key={id}
                    className={a.active.includes(i) ? "current" : ""}
                  >
                    <span>{String(value)}</span>
                    <small>{i}</small>
                  </li>
                ))
            )}
          </ol>
        </figure>
      ))}
      {frame.variables && Object.keys(frame.variables).length > 0 && (
        <section className="variables">
          <h4>Variables</h4>
          <dl>
            {Object.entries(frame.variables).map(([name, value]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
