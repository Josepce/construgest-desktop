const MONTH_RE=/^\d{4}-(0[1-9]|1[0-2])$/;
const n=v=>Number(v)||0;

export function validateMonthKey(value){
  value=String(value||'').trim();
  if(!MONTH_RE.test(value)){const e=new Error('Mês inválido. Use o formato AAAA-MM.');e.code='INVALID_MONTH';throw e}
  return value;
}

export async function getSellerPerformance(db,monthKey){
  const month=validateMonthKey(monthKey);
  const [users,sales,targets]=await Promise.all([
    db.query(`SELECT id,name,email,role,active FROM users
      WHERE active=true AND role IN ('Administrador','Gerente','Vendedor','Caixa')
      ORDER BY name`),
    db.query(`SELECT COALESCE(s.seller_id,s.user_id) AS user_id,
      count(*) AS sale_count,
      COALESCE(sum(s.total),0) AS sales_total,
      COALESCE(sum(s.total-s.cmv),0) AS gross_profit,
      COALESCE(avg(s.total),0) AS average_ticket
      FROM sales s
      WHERE s.status='FINALIZADA'
        AND to_char(s.created_at,'YYYY-MM')=$1
      GROUP BY COALESCE(s.seller_id,s.user_id)`,[month]),
    db.query('SELECT user_id,target_amount,commission_percent FROM seller_targets WHERE month_key=$1',[month])
  ]);

  const salesMap=new Map(sales.rows.map(x=>[+x.user_id,x]));
  const targetMap=new Map(targets.rows.map(x=>[+x.user_id,x]));
  const seen=new Set(users.rows.map(x=>+x.id));
  const missingIds=sales.rows.map(x=>+x.user_id).filter(id=>id&&!seen.has(id));
  let missing=[];
  if(missingIds.length){
    const all=await db.query('SELECT id,name,email,role,active FROM users ORDER BY name');
    const set=new Set(missingIds);
    missing=all.rows.filter(x=>set.has(+x.id));
  }
  const rows=[...users.rows,...missing].map(u=>{
    const s=salesMap.get(+u.id)||{},t=targetMap.get(+u.id)||{};
    const total=n(s.sales_total),target=n(t.target_amount),pct=n(t.commission_percent);
    return {
      user_id:+u.id,name:u.name,email:u.email,role:u.role,active:u.active!==false,
      sales:n(s.sale_count),sales_total:total,gross_profit:n(s.gross_profit),
      average_ticket:n(s.average_ticket),target_amount:target,
      commission_percent:pct,commission_estimated:total*pct/100,
      progress_percent:target>0?total/target*100:0,
      remaining_amount:Math.max(0,target-total),
      achieved:target>0&&total>=target
    };
  }).sort((a,b)=>b.sales_total-a.sales_total||a.name.localeCompare(b.name,'pt-BR'));
  return {
    month,
    summary:{
      sales:rows.reduce((a,x)=>a+x.sales,0),
      sales_total:rows.reduce((a,x)=>a+x.sales_total,0),
      target_amount:rows.reduce((a,x)=>a+x.target_amount,0),
      commission_estimated:rows.reduce((a,x)=>a+x.commission_estimated,0),
      achieved_count:rows.filter(x=>x.achieved).length
    },
    sellers:rows
  };
}
