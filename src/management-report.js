const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value){
  if(!ISO_DATE.test(value))return false;
  const [y,m,d]=value.split('-').map(Number);
  const dt=new Date(Date.UTC(y,m-1,d));
  return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d;
}

export function validateManagementPeriod(from,to){
  from=String(from||'').slice(0,10);
  to=String(to||'').slice(0,10);
  if(!isIsoDate(from)||!isIsoDate(to)||from>to){
    const e=new Error('Período inválido.');
    e.code='INVALID_PERIOD';
    throw e;
  }
  return {from,to};
}

const n=v=>Number(v)||0;
const monthNames=['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function last12Months(rows){
  const map=new Map((rows||[]).map(r=>[String(r.month_key),n(r.total)]));
  const now=new Date(),out=[];
  for(let i=11;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    out.push({month:key,label:monthNames[d.getMonth()],total:map.get(key)||0});
  }
  return out;
}

export async function getManagementReport(db,rawFrom,rawTo){
  const {from,to}=validateManagementPeriod(rawFrom,rawTo);
  const p=[from,to];

  const [
    metrics,daily,payments,products,sellers,customers,purchases,suppliers,
    inventory,noSales,financial,pending,categories,recent,monthlySales
  ]=await Promise.all([
    db.query(`SELECT
      COALESCE(sum(s.total),0) AS revenue_total,
      COALESCE(sum(s.total-s.cmv),0) AS gross_profit,
      count(*) AS sale_count,
      COALESCE(avg(s.total),0) AS average_ticket
      FROM sales s
      WHERE s.status='FINALIZADA'
        AND s.created_at >= $1::date
        AND s.created_at < $2::date + interval '1 day'`,p),

    db.query(`SELECT
      s.created_at::date AS sale_date,
      COALESCE(sum(s.total),0) AS revenue_total,
      count(*) AS sale_count
      FROM sales s
      WHERE s.status='FINALIZADA'
        AND s.created_at >= $1::date
        AND s.created_at < $2::date + interval '1 day'
      GROUP BY s.created_at::date
      ORDER BY s.created_at::date`,p),

    db.query(`SELECT
      pay.payment_method,
      COALESCE(sum(pay.payment_amount),0) AS payment_total
      FROM (
        SELECT sp.method AS payment_method,sp.amount AS payment_amount
        FROM sale_payments sp
        JOIN sales s ON s.id=sp.sale_id
        WHERE s.status='FINALIZADA'
          AND s.created_at >= $1::date
          AND s.created_at < $2::date + interval '1 day'
        UNION ALL
        SELECT COALESCE(s.payment_method,'Não informado') AS payment_method,s.total AS payment_amount
        FROM sales s
        WHERE s.status='FINALIZADA'
          AND s.created_at >= $1::date
          AND s.created_at < $2::date + interval '1 day'
          AND NOT EXISTS(SELECT 1 FROM sale_payments sp WHERE sp.sale_id=s.id)
      ) pay
      GROUP BY pay.payment_method
      ORDER BY payment_total DESC`,p),

    db.query(`SELECT
      si.product_id,
      COALESCE(p.name,si.description,'Produto') AS product_name,
      COALESCE(sum(si.qty),0) AS quantity_sold,
      COALESCE(sum(si.qty*si.unit_price),0) AS revenue_total
      FROM sale_items si
      JOIN sales s ON s.id=si.sale_id
      LEFT JOIN products p ON p.id=si.product_id
      WHERE s.status='FINALIZADA'
        AND s.created_at >= $1::date
        AND s.created_at < $2::date + interval '1 day'
      GROUP BY si.product_id,p.name,si.description
      ORDER BY revenue_total DESC
      LIMIT 10`,p),

    db.query(`SELECT
      u.id AS user_id,
      COALESCE(u.name,'Sem vendedor') AS seller_name,
      count(*) AS sale_count,
      COALESCE(sum(s.total),0) AS revenue_total
      FROM sales s
      LEFT JOIN users u ON u.id=s.user_id
      WHERE s.status='FINALIZADA'
        AND s.created_at >= $1::date
        AND s.created_at < $2::date + interval '1 day'
      GROUP BY u.id,u.name
      ORDER BY revenue_total DESC`,p),

    db.query(`SELECT
      c.id AS customer_id,
      COALESCE(c.name,'Consumidor Final') AS customer_name,
      count(*) AS sale_count,
      COALESCE(sum(s.total),0) AS revenue_total,
      COALESCE(avg(s.total),0) AS average_ticket,
      max(s.created_at) AS last_sale_at
      FROM sales s
      LEFT JOIN customers c ON c.id=s.customer_id
      WHERE s.status='FINALIZADA'
        AND s.created_at >= $1::date
        AND s.created_at < $2::date + interval '1 day'
      GROUP BY c.id,c.name
      ORDER BY revenue_total DESC
      LIMIT 20`,p),

    db.query(`SELECT
      count(*) AS purchase_count,
      COALESCE(sum(pu.total),0) AS purchase_total
      FROM purchases pu
      WHERE pu.status <> 'CANCELADA'
        AND pu.created_at >= $1::date
        AND pu.created_at < $2::date + interval '1 day'`,p),

    db.query(`SELECT
      su.id AS supplier_id,
      COALESCE(su.name,'Sem fornecedor') AS supplier_name,
      COALESCE(sum(pu.total),0) AS purchase_total,
      count(*) AS purchase_count
      FROM purchases pu
      LEFT JOIN suppliers su ON su.id=pu.supplier_id
      WHERE pu.status <> 'CANCELADA'
        AND pu.created_at >= $1::date
        AND pu.created_at < $2::date + interval '1 day'
      GROUP BY su.id,su.name
      ORDER BY purchase_total DESC
      LIMIT 10`,p),

    db.query(`SELECT
      COALESCE(sum(CASE WHEN p.active=true THEN 1 ELSE 0 END),0) AS active_products,
      COALESCE(sum(CASE WHEN p.active=true THEN p.stock*p.cost ELSE 0 END),0) AS stock_cost_value,
      COALESCE(sum(CASE WHEN p.active=true AND p.stock<=p.min_stock THEN 1 ELSE 0 END),0) AS low_stock_count,
      COALESCE(sum(CASE WHEN p.active=true AND p.stock<=0 THEN 1 ELSE 0 END),0) AS zero_stock_count
      FROM products p`),

    db.query(`SELECT p.id,p.name,p.stock,p.cost
      FROM products p
      WHERE p.active=true
        AND p.stock>0
        AND NOT EXISTS(
          SELECT 1
          FROM sale_items si
          JOIN sales s ON s.id=si.sale_id
          WHERE si.product_id=p.id
            AND s.status='FINALIZADA'
            AND s.created_at >= $1::date
            AND s.created_at < $2::date + interval '1 day'
        )
      ORDER BY (p.stock*p.cost) DESC
      LIMIT 10`,p),

    db.query(`SELECT
      COALESCE(sum(CASE WHEN fe.kind='RECEBER' AND fe.status='PAGO' THEN fe.amount ELSE 0 END),0) AS income_total,
      COALESCE(sum(CASE WHEN fe.kind IN ('PAGAR','DESPESA') AND fe.status='PAGO' THEN fe.amount ELSE 0 END),0) AS outflow_total
      FROM financial_entries fe
      WHERE COALESCE(fe.paid_at,fe.created_at) >= $1::date
        AND COALESCE(fe.paid_at,fe.created_at) < $2::date + interval '1 day'`,p),

    db.query(`SELECT
      COALESCE(sum(CASE WHEN fe.kind='RECEBER' AND fe.status='PENDENTE' THEN fe.amount ELSE 0 END),0) AS receivable_total,
      COALESCE(sum(CASE WHEN fe.kind='RECEBER' AND fe.status='PENDENTE' THEN 1 ELSE 0 END),0) AS receivable_count,
      COALESCE(sum(CASE WHEN fe.kind IN ('PAGAR','DESPESA') AND fe.status='PENDENTE' THEN fe.amount ELSE 0 END),0) AS payable_total,
      COALESCE(sum(CASE WHEN fe.kind IN ('PAGAR','DESPESA') AND fe.status='PENDENTE' THEN 1 ELSE 0 END),0) AS payable_count
      FROM financial_entries fe`),

    db.query(`SELECT
      COALESCE(NULLIF(p.category,''),'Sem categoria') AS category_name,
      COALESCE(sum(si.qty*si.unit_price),0) AS revenue_total
      FROM sale_items si
      JOIN sales s ON s.id=si.sale_id
      LEFT JOIN products p ON p.id=si.product_id
      WHERE s.status='FINALIZADA'
        AND s.created_at >= $1::date
        AND s.created_at < $2::date + interval '1 day'
      GROUP BY COALESCE(NULLIF(p.category,''),'Sem categoria')
      ORDER BY revenue_total DESC
      LIMIT 6`,p),

    db.query(`SELECT
      s.id,s.created_at,s.total,s.payment_method,
      COALESCE(c.name,'Consumidor Final') AS customer_name,
      COALESCE(u.name,'—') AS seller_name,
      COALESCE(sum(si.qty),0) AS item_count,
      COALESCE(s.total-s.cmv,0) AS gross_profit,
      CASE WHEN s.total>0 THEN (s.total-s.cmv)/s.total*100 ELSE 0 END AS margin_percent
      FROM sales s
      LEFT JOIN customers c ON c.id=s.customer_id
      LEFT JOIN users u ON u.id=s.user_id
      LEFT JOIN sale_items si ON si.sale_id=s.id
      WHERE s.status='FINALIZADA'
        AND s.created_at >= $1::date
        AND s.created_at < $2::date + interval '1 day'
      GROUP BY s.id,s.created_at,s.total,s.payment_method,s.cmv,c.id,c.name,u.id,u.name
      ORDER BY s.created_at DESC
      LIMIT 12`,p),

    db.query(`SELECT
      to_char(date_trunc('month',s.created_at),'YYYY-MM') AS month_key,
      COALESCE(sum(s.total),0) AS revenue_total
      FROM sales s
      WHERE s.status='FINALIZADA'
        AND s.created_at >= date_trunc('month',current_date)-interval '11 months'
        AND s.created_at < date_trunc('month',current_date)+interval '1 month'
      GROUP BY date_trunc('month',s.created_at)
      ORDER BY date_trunc('month',s.created_at)`)
  ]);

  const mr=metrics.rows[0]||{},fr=financial.rows[0]||{},pr=pending.rows[0]||{};
  const revenue=n(mr.revenue_total),gross=n(mr.gross_profit),income=n(fr.income_total),outflow=n(fr.outflow_total);

  return {
    from,to,
    metrics:{revenue,gross,sales:n(mr.sale_count),ticket:n(mr.average_ticket),margin:revenue?gross/revenue*100:0},
    daily:daily.rows.map(x=>({sale_date:x.sale_date,total:n(x.revenue_total),sales:n(x.sale_count)})),
    monthly:last12Months(monthlySales.rows.map(x=>({month_key:x.month_key,total:n(x.revenue_total)}))),
    payments:payments.rows.map(x=>({method:x.payment_method,total:n(x.payment_total)})),
    products:products.rows.map(x=>({id:x.product_id,description:x.product_name,qty:n(x.quantity_sold),revenue:n(x.revenue_total)})),
    sellers:sellers.rows.map(x=>({id:x.user_id,name:x.seller_name,sales:n(x.sale_count),revenue:n(x.revenue_total)})),
    customers:customers.rows.map(x=>({id:x.customer_id,name:x.customer_name,sales:n(x.sale_count),revenue:n(x.revenue_total),ticket:n(x.average_ticket),last_sale:x.last_sale_at})),
    purchases:{count:n(purchases.rows[0]?.purchase_count),total:n(purchases.rows[0]?.purchase_total)},
    suppliers:suppliers.rows.map(x=>({id:x.supplier_id,name:x.supplier_name,total:n(x.purchase_total),purchases:n(x.purchase_count)})),
    inventory:{products:n(inventory.rows[0]?.active_products),cost_value:n(inventory.rows[0]?.stock_cost_value),low:n(inventory.rows[0]?.low_stock_count),zero:n(inventory.rows[0]?.zero_stock_count)},
    no_sales:noSales.rows,
    categories:categories.rows.map(x=>({name:x.category_name,total:n(x.revenue_total)})),
    recent_sales:recent.rows.map(x=>({id:x.id,created_at:x.created_at,total:n(x.total),payment_method:x.payment_method,customer:x.customer_name,seller:x.seller_name,items:n(x.item_count),gross:n(x.gross_profit),margin:n(x.margin_percent)})),
    financial:{income,outflow,result:income-outflow,receivable:n(pr.receivable_total),receivable_count:n(pr.receivable_count),payable:n(pr.payable_total),payable_count:n(pr.payable_count)}
  };
}
