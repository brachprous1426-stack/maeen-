const fs = require('fs');
let c = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');
c = c.replace(
  '<button onClick={() => setViewingUser(u)}>',
  `<select
      value={u.maxAllowedLevel || 1}
      onChange={async (e) => {
        await fetch("/api/users", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ id: u.id, action: "setLevel", level: parseInt(e.target.value) })
        });
        load();
      }}
      style={{ padding: "8px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", fontSize: "0.9rem" }}
    >
      <option value="1">المستوى الأول</option>
      <option value="2">المستوى الثاني</option>
      <option value="3">المستوى الثالث</option>
    </select>
    <button onClick={() => setViewingUser(u)}>`
);
fs.writeFileSync('src/components/AdminPanel.tsx', c);
