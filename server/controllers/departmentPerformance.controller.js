import db from "../config/db.js";

/* =========================================================
   🚀 ENTERPRISE PERFORMANCE CONTROLLER (ENHANCED)
   - Advanced metrics & KPIs
   - Smart trend analysis
   - Predictive warnings
   - Optimized queries (no FILTER on non‑aggregates)
========================================================= */

export const getDepartmentPerformance = async (req, res) => {
  try {
    const deptId = req.user.id;
    const { period = "30days" } = req.query; // optional: 7days, 30days, 90days

    // Determine date range for trends
    let interval = "30 days";
    if (period === "7days") interval = "7 days";
    if (period === "90days") interval = "90 days";

    /* ===========================
       📊 1. MAIN TASK METRICS
    =========================== */
    const taskMetrics = await db.query(`
      WITH all_tasks AS (
        SELECT 
          'complaint' as type, id, created_at, completed_at, deadline, status, priority, assigned_to
        FROM complaints WHERE assigned_to = $1
        UNION ALL
        SELECT 
          'violation' as type, id, created_at, completed_at, deadline, status, priority, assigned_to
        FROM violations WHERE assigned_to = $1
      )
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE LOWER(status) = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE LOWER(status) = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE LOWER(status) IN ('pending', 'in progress')) as pending,
        COUNT(*) FILTER (WHERE LOWER(status) = 'pending') as pending_new,
        COUNT(*) FILTER (WHERE LOWER(status) = 'in progress') as in_progress,
        COUNT(*) FILTER (WHERE priority = 'high' OR priority = 'urgent') as high_priority,
        COUNT(*) FILTER (WHERE deadline IS NOT NULL AND completed_at IS NULL AND deadline < NOW()) as sla_breached,
        COUNT(*) FILTER (WHERE completed_at IS NOT NULL AND deadline IS NOT NULL AND completed_at > deadline) as delayed_completed,
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600) FILTER (WHERE completed_at IS NOT NULL) as avg_resolution_hours,
        PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (completed_at - created_at))) FILTER (WHERE completed_at IS NOT NULL) as median_resolution_seconds
      FROM all_tasks
      WHERE assigned_to = $1
    `, [deptId]);

    const metrics = taskMetrics.rows[0] || {};
    
    // Compute derived metrics
    const total = parseInt(metrics.total) || 0;
    const resolved = parseInt(metrics.resolved) || 0;
    const rejected = parseInt(metrics.rejected) || 0;
    const pending = parseInt(metrics.pending) || 0;
    const highPriority = parseInt(metrics.high_priority) || 0;
    const slaBreached = parseInt(metrics.sla_breached) || 0;
    const delayedCompleted = parseInt(metrics.delayed_completed) || 0;
    
    const completionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const rejectionRate = total > 0 ? Math.round((rejected / total) * 100) : 0;
    const efficiencyRatio = (resolved + rejected) > 0 ? Math.round((resolved / (resolved + rejected)) * 100) : 0;
    
    let avgResolutionHours = metrics.avg_resolution_hours ? Math.round(metrics.avg_resolution_hours) : 0;
    const medianResolutionHours = metrics.median_resolution_seconds ? Math.round(metrics.median_resolution_seconds / 3600) : 0;

    /* ===========================
       📈 2. DAILY / WEEKLY / MONTHLY TRENDS
    =========================== */
    const dailyTrend = await db.query(`
      WITH daily_data AS (
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE LOWER(status) = 'resolved') as resolved,
          COUNT(*) FILTER (WHERE priority = 'high' OR priority = 'urgent') as high_priority_tasks
        FROM (
          SELECT created_at, status, priority FROM complaints WHERE assigned_to = $1
          UNION ALL
          SELECT created_at, status, priority FROM violations WHERE assigned_to = $1
        ) t
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      )
      SELECT 
        date,
        total,
        resolved,
        high_priority_tasks,
        AVG(total) OVER (ORDER BY date ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) as smooth_total
      FROM daily_data
    `, [deptId]);

    // ✅ FIXED: ROUND with CASE instead of FILTER
    const weeklyTrend = await db.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('week', created_at), 'YYYY-MM-DD') as week_start,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE LOWER(status) = 'resolved') as resolved,
        ROUND(AVG(
          CASE WHEN completed_at IS NOT NULL 
               THEN EXTRACT(EPOCH FROM (completed_at - created_at)) / 3600 
               ELSE NULL 
          END
        )) as avg_resolution_hours_weekly
      FROM (
        SELECT created_at, completed_at, status FROM complaints WHERE assigned_to = $1
        UNION ALL
        SELECT created_at, completed_at, status FROM violations WHERE assigned_to = $1
      ) t
      WHERE created_at >= NOW() - INTERVAL '90 days'
      GROUP BY week_start
      ORDER BY week_start
    `, [deptId]);

    const monthlyTrend = await db.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE LOWER(status) = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE priority = 'high' OR priority = 'urgent') as high_priority_total
      FROM (
        SELECT created_at, status, priority FROM complaints WHERE assigned_to = $1
        UNION ALL
        SELECT created_at, status, priority FROM violations WHERE assigned_to = $1
      ) t
      GROUP BY month
      ORDER BY MIN(created_at)
    `, [deptId]);

    /* ===========================
       ⏳ 3. TASK AGING & BACKLOG ANALYSIS
    =========================== */
    const aging = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days' AND LOWER(status) NOT IN ('resolved','rejected')) as new_backlog,
        COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '7 days' AND created_at >= NOW() - INTERVAL '30 days' AND LOWER(status) NOT IN ('resolved','rejected')) as medium_backlog,
        COUNT(*) FILTER (WHERE created_at < NOW() - INTERVAL '30 days' AND LOWER(status) NOT IN ('resolved','rejected')) as old_backlog,
        AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400) FILTER (WHERE LOWER(status) NOT IN ('resolved','rejected')) as avg_age_days
      FROM (
        SELECT created_at, status FROM complaints WHERE assigned_to = $1
        UNION ALL
        SELECT created_at, status FROM violations WHERE assigned_to = $1
      ) t
    `, [deptId]);

    const backlog = aging.rows[0] || {};

    /* ===========================
       🧠 4. PRODUCTIVITY & PERFORMANCE SCORE
    =========================== */
    let productivityScore = 50; // base
    
    productivityScore += (completionRate * 0.4);
    
    if (avgResolutionHours > 0 && avgResolutionHours <= 24) productivityScore += 20;
    else if (avgResolutionHours <= 48) productivityScore += 10;
    else if (avgResolutionHours > 72) productivityScore -= 10;
    
    if (slaBreached > 0) {
      const penalty = Math.min(20, slaBreached * 2);
      productivityScore -= penalty;
    }
    
    if (highPriority > 0 && resolved > 0) {
      const highPriorityResolved = await db.query(`
        SELECT COUNT(*) as count FROM (
          SELECT id FROM complaints WHERE assigned_to = $1 AND (priority='high' OR priority='urgent') AND LOWER(status)='resolved'
          UNION ALL
          SELECT id FROM violations WHERE assigned_to = $1 AND (priority='high' OR priority='urgent') AND LOWER(status)='resolved'
        ) t
      `, [deptId]);
      const highResolved = parseInt(highPriorityResolved.rows[0]?.count) || 0;
      const highRatio = highResolved / highPriority;
      if (highRatio > 0.7) productivityScore += 10;
      else if (highRatio > 0.4) productivityScore += 5;
    }
    
    productivityScore = Math.min(100, Math.max(0, Math.round(productivityScore)));
    
    let grade = "C";
    if (productivityScore >= 85) grade = "A";
    else if (productivityScore >= 65) grade = "B";
    else if (productivityScore >= 40) grade = "C";
    else if (productivityScore >= 20) grade = "D";
    else grade = "F";

    /* ===========================
       💡 5. SMART INSIGHTS & RECOMMENDATIONS
    =========================== */
    const insights = [];
    
    if (completionRate >= 90) insights.push({ type: "positive", message: "🎯 Outstanding completion rate! Keep up the momentum." });
    else if (completionRate >= 70) insights.push({ type: "positive", message: "✅ Good completion rate. Focus on reducing pending tasks." });
    else if (completionRate < 50) insights.push({ type: "warning", message: "⚠️ Low completion rate. Prioritize resolving open tasks." });
    
    if (avgResolutionHours > 48) insights.push({ type: "warning", message: `⏳ Slow avg resolution (${avgResolutionHours}h). Aim for <24h.` });
    else if (avgResolutionHours <= 24) insights.push({ type: "positive", message: "⚡ Fast resolution time! Great responsiveness." });
    
    if (slaBreached > 5) insights.push({ type: "critical", message: `🚨 ${slaBreached} SLA breaches! Urgent attention needed.` });
    else if (slaBreached > 0) insights.push({ type: "warning", message: `📅 ${slaBreached} tasks missed deadline. Review workload.` });
    
    if (backlog.old_backlog > 0) insights.push({ type: "critical", message: `📦 ${backlog.old_backlog} tasks older than 30 days pending. Escalate immediately.` });
    if (backlog.medium_backlog > 5) insights.push({ type: "warning", message: `📋 ${backlog.medium_backlog} tasks pending for 7-30 days.` });
    
    if (highPriority > 0 && resolved > 0) {
      const highPending = highPriority - (metrics.high_priority_resolved || 0);
      if (highPending > 3) insights.push({ type: "warning", message: `🔥 ${highPending} high-priority tasks unresolved.` });
    }
    
    if (dailyTrend.rows.length >= 14) {
      const lastWeek = dailyTrend.rows.slice(-7).reduce((s, d) => s + d.total, 0);
      const prevWeek = dailyTrend.rows.slice(-14, -7).reduce((s, d) => s + d.total, 0);
      if (lastWeek > prevWeek * 1.2) insights.push({ type: "info", message: "📈 Workload increased significantly. Consider resource reallocation." });
      else if (lastWeek < prevWeek * 0.8) insights.push({ type: "positive", message: "📉 Workload decreased. Good time to clear backlog." });
    }
    
    if (insights.length === 0) insights.push({ type: "info", message: "✨ Steady performance. No critical issues detected." });

    /* ===========================
       📊 6. STATUS BREAKDOWN (for pie chart)
    =========================== */
    const statusBreakdown = await db.query(`
      SELECT 
        LOWER(status) as status,
        COUNT(*) as count
      FROM (
        SELECT status FROM complaints WHERE assigned_to = $1
        UNION ALL
        SELECT status FROM violations WHERE assigned_to = $1
      ) t
      GROUP BY status
    `, [deptId]);

    /* ===========================
       ✅ 7. FINAL RESPONSE
    =========================== */
    res.json({
      stats: {
        total,
        resolved,
        rejected,
        pending,
        completionRate,
        rejectionRate,
        efficiencyRatio,
        avgResolutionHours,
        medianResolutionHours,
        highPriorityTasks: highPriority,
        slaBreached,
        delayedCompleted,
        productivityScore,
        grade,
        backlog: {
          new: parseInt(backlog.new_backlog) || 0,
          medium: parseInt(backlog.medium_backlog) || 0,
          old: parseInt(backlog.old_backlog) || 0,
          avgAgeDays: Math.round(backlog.avg_age_days || 0)
        }
      },
      analytics: {
        daily: dailyTrend.rows,
        weekly: weeklyTrend.rows,
        monthly: monthlyTrend.rows,
        statusBreakdown: statusBreakdown.rows
      },
      insights,
      meta: {
        period,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error("❌ Performance Controller Error:", err);
    res.status(500).json({ 
      message: "Failed to retrieve performance data",
      error: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
};