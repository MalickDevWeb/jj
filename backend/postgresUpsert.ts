import { PoolClient } from 'pg';

export async function upsertRecord(
  client: PoolClient,
  table: string,
  idField: string,
  record: any,
  mappings: Record<string, string>
): Promise<void> {
  if (!record || typeof record !== 'object') return;
  
  const colMap = new Map<string, any>();
  Object.entries(record).forEach(([key, val]) => {
    const colName = mappings[key] || key;
    // Overwrite with non-undefined, prioritize mapped ones if both are present
    if (!colMap.has(colName) || val !== undefined) {
      colMap.set(colName, val);
    }
  });

  const columns: string[] = [];
  const values: any[] = [];
  const updateParts: string[] = [];

  let idx = 0;
  for (const [colName, val] of colMap.entries()) {
    columns.push(colName);
    
    if (Array.isArray(val) || (val !== null && typeof val === 'object' && !(val instanceof Date))) {
      values.push(JSON.stringify(val));
    } else {
      values.push(val);
    }
    
    if (colName !== idField) {
      updateParts.push(`${colName} = $${idx + 1}`);
    }
    idx++;
  }

  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `
    INSERT INTO ${table} (${columns.join(', ')})
    VALUES (${placeholders})
    ON CONFLICT (${idField})
    DO UPDATE SET ${updateParts.join(', ')}
  `;
  
  await client.query(sql, values);
}
