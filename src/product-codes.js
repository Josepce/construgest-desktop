// Executar a alocação dentro da mesma transação do cadastro.
const maximum = `(SELECT COALESCE(MAX(code::numeric),0) FROM products WHERE code ~ '^[0-9]+$')`;
export async function nextProductCode(client, reserve=false) {
  const sql=reserve
    ? `UPDATE product_code_counter SET last_value=GREATEST(last_value,${maximum})+1 WHERE id=1 RETURNING last_value::text AS value`
    : `SELECT (GREATEST(last_value,${maximum})+1)::text AS value FROM product_code_counter WHERE id=1`;
  const result=await client.query(sql);
  return result.rows[0].value.padStart(3,'0');
}
