const n=v=>Number(v)||0;

export function abcClassify(rows){
  const sorted=[...(rows||[])].sort((a,b)=>n(b.revenue)-n(a.revenue));
  const total=sorted.reduce((a,x)=>a+n(x.revenue),0);
  let cumulative=0;
  return sorted.map(x=>{
    cumulative+=n(x.revenue);
    const pct=total?cumulative/total*100:0;
    const abc=pct<=80?'A':pct<=95?'B':'C';
    return {...x,abc,revenue_share:total?n(x.revenue)/total*100:0,cumulative_share:pct};
  });
}

export async function getStockIntelligence(db,{days=90}={}){
  days=Math.max(30,Math.min(365,Math.trunc(+days||90)));
  const [sales,summary]=await Promise.all([
    db.query(`SELECT
      p.id,p.code,p.name,p.brand,p.category,p.unit,p.stock,p.min_stock,p.max_stock,p.cost,p.retail,
      COALESCE(sum(CASE WHEN s.status='FINALIZADA' AND s.created_at>=current_date-$1::int THEN si.qty ELSE 0 END),0) AS qty_sold,
      COALESCE(sum(CASE WHEN s.status='FINALIZADA' AND s.created_at>=current_date-$1::int THEN si.qty*si.unit_price ELSE 0 END),0) AS revenue,
      COALESCE(sum(CASE WHEN s.status='FINALIZADA' AND s.created_at>=current_date-$1::int THEN (si.unit_price-si.cost)*si.qty ELSE 0 END),0) AS gross_profit,
      max(CASE WHEN s.status='FINALIZADA' THEN s.created_at END) AS last_sale_at
      FROM products p
      LEFT JOIN sale_items si ON si.product_id=p.id
      LEFT JOIN sales s ON s.id=si.sale_id
      WHERE p.active=true
      GROUP BY p.id,p.code,p.name,p.brand,p.category,p.unit,p.stock,p.min_stock,p.max_stock,p.cost,p.retail
      ORDER BY revenue DESC,p.name`,[days]),
    db.query(`SELECT
      count(*) FILTER(WHERE active=true) AS product_count,
      COALESCE(sum(stock*cost) FILTER(WHERE active=true),0) AS stock_cost_value,
      COALESCE(sum(stock*retail) FILTER(WHERE active=true),0) AS stock_retail_value,
      count(*) FILTER(WHERE active=true AND stock<=0) AS zero_count,
      count(*) FILTER(WHERE active=true AND stock>0 AND stock<=min_stock) AS low_count
      FROM products`)
  ]);

  const today=Date.now();
  const enriched=abcClassify(sales.rows.map(x=>{
    const qty=n(x.qty_sold),stock=n(x.stock),cost=n(x.cost),max=n(x.max_stock),min=n(x.min_stock);
    const daily=qty/days;
    const coverage=daily>0?stock/daily:null;
    const last=x.last_sale_at?new Date(x.last_sale_at).getTime():null;
    const daysWithoutSale=last?Math.max(0,Math.floor((today-last)/86400000)):null;
    const target=max>0?max:(min>0?Math.max(min*2,qty/3):Math.max(0,Math.ceil(daily*30)));
    const suggested=Math.max(0,Math.ceil(target-stock));
    const dead=stock>0&&(qty===0||daysWithoutSale>=60);
    return {
      id:x.id,code:x.code,name:x.name,brand:x.brand,category:x.category,unit:x.unit,
      stock,min_stock:min,max_stock:max,cost,retail:n(x.retail),
      qty_sold:qty,revenue:n(x.revenue),gross_profit:n(x.gross_profit),
      margin:n(x.revenue)>0?n(x.gross_profit)/n(x.revenue)*100:0,
      avg_daily_qty:daily,coverage_days:coverage,last_sale_at:x.last_sale_at,
      days_without_sale:daysWithoutSale,stock_value:stock*cost,suggested_qty:suggested,dead_stock:dead
    };
  }));

  const abc={
    A:enriched.filter(x=>x.abc==='A'),
    B:enriched.filter(x=>x.abc==='B'),
    C:enriched.filter(x=>x.abc==='C')
  };
  const dead=enriched.filter(x=>x.dead_stock).sort((a,b)=>b.stock_value-a.stock_value);
  const urgent=enriched.filter(x=>x.suggested_qty>0&&x.avg_daily_qty>0).sort((a,b)=>{
    const ac=a.coverage_days==null?999:a.coverage_days,bc=b.coverage_days==null?999:b.coverage_days;
    return ac-bc||b.revenue-a.revenue;
  });
  const sr=summary.rows[0]||{};
  return {
    days,
    summary:{
      products:n(sr.product_count),
      stock_cost_value:n(sr.stock_cost_value),
      stock_retail_value:n(sr.stock_retail_value),
      zero:n(sr.zero_count),
      low:n(sr.low_count),
      dead_value:dead.reduce((a,x)=>a+x.stock_value,0),
      revenue:enriched.reduce((a,x)=>a+x.revenue,0),
      gross_profit:enriched.reduce((a,x)=>a+x.gross_profit,0)
    },
    abc:{A:{count:abc.A.length,revenue:abc.A.reduce((a,x)=>a+x.revenue,0)},B:{count:abc.B.length,revenue:abc.B.reduce((a,x)=>a+x.revenue,0)},C:{count:abc.C.length,revenue:abc.C.reduce((a,x)=>a+x.revenue,0)}},
    products:enriched,
    dead_stock:dead.slice(0,30),
    replenishment:urgent.slice(0,30)
  };
}
