import { useState, useEffect } from "react";
import { Wallet, ShoppingCart, CreditCard, Users } from "lucide-react";
import { fetchDashboardStats, fetchRevenueByCategory } from "../../lib/dashboard.js";
import "./AdminPages.css";

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function Analytics() {
  const [range, setRange] = useState("12m");
  const [revenueData, setRevenueData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [catData, setCatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpiStats, setKpiStats] = useState({
    totalRev: 0,
    totalOrders: 0,
    avgOrder: 0,
    uniqueCustomers: 0,
  });

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchDashboardStats(),
      fetchRevenueByCategory(),
    ]).then(([dashStats, catStats]) => {
      // Process monthly revenue and orders
      const monthlyData = dashStats.monthlyRevenue || [];
      const revData = monthlyData.map(m => Number(m.revenue || 0));
      const ordData = monthlyData.map(m => Number(m.order_count || 0));
      
      setRevenueData(revData);
      setOrdersData(ordData);

      // Process top products
      const products = (dashStats.topProducts || []).slice(0, 5).map(p => ({
        name: p.product_name,
        sales: Number(p.order_count || 0),
        rev: Number(p.total_revenue || 0),
        pct: Math.min(100, Math.round((Number(p.total_revenue || 0) / 2000) * 100)),
      }));
      setTopProducts(products);

      // Process category data
      const totalCatRev = (catStats || []).reduce((s, c) => s + Number(c.revenue || 0), 0);
      const categories = (catStats || []).map(c => ({
        label: c.category_name,
        pct: totalCatRev > 0 ? Math.round((Number(c.revenue || 0) / totalCatRev) * 100) : 0,
        color: ["#8b4513", "#a0522d", "#cd853f", "#d4a574", "#e8c9a0"][Math.floor(Math.random() * 5)],
      }));
      setCatData(categories);

      // Calculate KPI stats
      const totalRev = revData.reduce((s, r) => s + r, 0);
      const totalOrders = ordData.reduce((s, o) => s + o, 0);
      const avgOrder = totalOrders > 0 ? totalRev / totalOrders : 0;
      const customers = dashStats.customerStats || { total_customers: 0 };

      setKpiStats({
        totalRev: Math.round(totalRev),
        totalOrders: totalOrders,
        avgOrder: avgOrder.toFixed(2),
        uniqueCustomers: customers.total_customers || 0,
      });

      setLoading(false);
    }).catch(error => {
      console.error('Failed to fetch analytics:', error);
      setLoading(false);
    });
  }, [range]);

  return (
    <div className="ap-root">
      <div className="ap-page-header">
        <div>
          <h1 className="ap-page-title">Analytics</h1>
          <p className="ap-page-sub">Your store at a glance</p>
        </div>
        <div className="ap-range-tabs">
          {["7d","30d","3m","12m"].map(r=>(
            <button key={r} className={`ap-range-tab ${range===r?"active":""}`} onClick={()=>setRange(r)}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="ap-kpi-row">
        {[
          { icon:<Wallet size={24} />, label:"Total Revenue",   val:`$${kpiStats.totalRev.toLocaleString()}`,  sub:"+12% vs last period", pos:true },
          { icon:<ShoppingCart size={24} />, label:"Total Orders",    val:kpiStats.totalOrders,     sub:"+8% vs last period",  pos:true },
          { icon:<CreditCard size={24} />, label:"Avg Order Value", val:`$${kpiStats.avgOrder}`,  sub:"-2% vs last period",  pos:false},
          { icon:<Users size={24} />, label:"Unique Customers",val:kpiStats.uniqueCustomers,      sub:"+18% vs last period", pos:true },
        ].map((k,i)=>(
          <div key={i} className="ap-kpi-card" style={{"--i":i}}>
            <div className="ap-kpi-icon">{k.icon}</div>
            <div className="ap-kpi-val">{loading ? "..." : k.val}</div>
            <div className="ap-kpi-label">{k.label}</div>
            <div className={`ap-kpi-sub ${k.pos?"pos":"neg"}`}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="ap-charts-row">
        {/* Revenue bar chart */}
        <div className="ap-card ap-chart-card">
          <h3 className="ap-card-title">Monthly Revenue (BZD)</h3>
          <div className="ap-bar-chart">
            {loading ? (
              <p style={{padding:"20px", color:"#999"}}>Loading chart...</p>
            ) : revenueData.length > 0 ? (
              revenueData.map((v,i)=>{
                const maxRev = Math.max(...revenueData);
                return (
                  <div key={i} className="ap-bar-col">
                    <div className="ap-bar-wrap">
                      <div
                        className="ap-bar"
                        style={{"--h":`${maxRev > 0 ? (v/maxRev)*100 : 0}%`,"--delay":`${i*50}ms`}}
                        title={`$${v.toLocaleString()}`}
                      />
                    </div>
                    <span className="ap-bar-label">{months[i]}</span>
                  </div>
                )
              })
            ) : (
              <p style={{padding:"20px", color:"#999"}}>No data available yet</p>
            )}
          </div>
        </div>

        {/* Category donut */}
        <div className="ap-card ap-donut-card">
          <h3 className="ap-card-title">Sales by Category</h3>
          <div className="ap-donut-wrap">
            <svg viewBox="0 0 100 100" className="ap-donut-svg">
              {loading ? null : catData.length > 0 ? (
                (() => {
                  let offset = 0;
                  return catData.map((c,i)=>{
                    const dash = c.pct;
                    const el = (
                      <circle key={i} cx="50" cy="50" r="40"
                        fill="none"
                        stroke={c.color}
                        strokeWidth="18"
                        strokeDasharray={`${dash} ${100-dash}`}
                        strokeDashoffset={-offset}
                        style={{transform:"rotate(-90deg)",transformOrigin:"50% 50%"}}
                      />
                    );
                    offset += dash;
                    return el;
                  });
                })()
              ) : (
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="18" />
              )}
              <text x="50" y="47" textAnchor="middle" className="donut-center-val">{loading ? "..." : kpiStats.totalOrders}</text>
              <text x="50" y="57" textAnchor="middle" className="donut-center-label">orders</text>
            </svg>
            <div className="ap-donut-legend">
              {catData.map((c,i)=>(
                <div key={i} className="ap-legend-row">
                  <span className="ap-legend-dot" style={{background:c.color}}/>
                  <span className="ap-legend-name">{c.label}</span>
                  <span className="ap-legend-pct">{c.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top products + orders sparkline */}
      <div className="ap-bottom-row">
        <div className="ap-card">
          <h3 className="ap-card-title">Top Products</h3>
          <div className="ap-top-list">
            {loading ? (
              <p style={{padding:"20px", color:"#999"}}>Loading top products...</p>
            ) : topProducts.length > 0 ? (
              topProducts.map((p,i)=>(
                <div key={i} className="ap-top-item" style={{"--i":i}}>
                  <span className="ap-top-rank">#{i+1}</span>
                  <div className="ap-top-info">
                    <span className="ap-top-name">{p.name}</span>
                    <div className="ap-top-bar-track">
                      <div className="ap-top-bar-fill" style={{"--w":`${p.pct}%`}}/>
                    </div>
                  </div>
                  <div className="ap-top-nums">
                    <span className="ap-top-sales">{p.sales} sold</span>
                    <span className="ap-top-rev">${p.rev.toLocaleString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p style={{padding:"20px", color:"#999"}}>No data available yet</p>
            )}
          </div>
        </div>

        {/* Orders sparkline */}
        <div className="ap-card ap-sparkline-card">
          <h3 className="ap-card-title">Orders / Month</h3>
          <div className="ap-spark-wrap">
            {loading ? (
              <p style={{padding:"20px", color:"#999"}}>Loading chart...</p>
            ) : ordersData.length > 0 ? (
              <svg viewBox="0 0 220 80" className="ap-spark-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b4513" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#8b4513" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {(() => {
                  const maxOrd = Math.max(...ordersData);
                  return (
                    <>
                      <path
                        d={`M ${ordersData.map((v,i)=>`${i*(220/(ordersData.length-1))},${80-(maxOrd > 0 ? (v/maxOrd)*70 : 0)}`).join(" L ")} L 220,80 L 0,80 Z`}
                        fill="url(#sg)"
                      />
                      <polyline
                        points={ordersData.map((v,i)=>`${i*(220/(ordersData.length-1))},${80-(maxOrd > 0 ? (v/maxOrd)*70 : 0)}`).join(" ")}
                        fill="none" stroke="#8b4513" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      />
                    </>
                  );
                })()}
              </svg>
            ) : (
              <p style={{padding:"20px", color:"#999"}}>No data available yet</p>
            )}
            <div className="ap-spark-labels">
              {months.map((m,i)=><span key={i}>{m}</span>)}
            </div>
          </div>
          <div className="ap-spark-stat">
            <span>Peak: <strong>{Math.max(...ordersData, 0)} orders</strong></span>
            <span>Total: <strong className="pos">{kpiStats.totalOrders} orders</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}