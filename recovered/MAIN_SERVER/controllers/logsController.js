// ════════════════════════════════════════════════════════════════
// CONTROLLER: LOGS MANAGEMENT
// Xử lý các operations liên quan đến logs
// ════════════════════════════════════════════════════════════════

const db = require('../config/database');
const { getUserLogs, getSecurityAlerts, getLogStats, cleanupOldLogs } = require('../middleware/apiLogger');

// ════════════════════════════════════════════════════════════════
// USER LOGS OPERATIONS
// ════════════════════════════════════════════════════════════════

/**
 * Lấy logs của user hiện tại
 */
const getMyLogs = async (req, res) => {
    try {
        const userID = req.user.userID;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        
        const result = await getUserLogs(userID, limit, offset);
        
        res.json({
            success: true,
            message: 'Lấy logs thành công',
            data: result
        });
    } catch (error) {
        console.error('Error in getMyLogs:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy logs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Lấy thống kê logs của user hiện tại
 */
const getMyStats = async (req, res) => {
    try {
        const userID = req.user.userID;
        const days = parseInt(req.query.days) || 7;
        
        const stats = await getLogStats(userID, days);
        
        // Tính toán summary
        const summary = stats.reduce((acc, day) => {
            acc.totalRequests += day.total_requests || 0;
            acc.totalSuccess += day.success_count || 0;
            acc.totalErrors += day.error_count || 0;
            return acc;
        }, { totalRequests: 0, totalSuccess: 0, totalErrors: 0 });
        
        res.json({
            success: true,
            message: 'Lấy thống kê thành công',
            data: {
                stats,
                summary,
                period: `${days} days`
            }
        });
    } catch (error) {
        console.error('Error in getMyStats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ════════════════════════════════════════════════════════════════
// ADMIN LOGS OPERATIONS
// ════════════════════════════════════════════════════════════════

/**
 * Lấy tất cả logs (admin only)
 */
const getAllLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        
        const query = `
            SELECT * FROM v_api_logs_with_user
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        
        const [logs] = await db.query(query, [limit, offset]);
        
        // Đếm tổng số logs
        const [countResult] = await db.query('SELECT COUNT(*) as total FROM api_logs');
        
        res.json({
            success: true,
            message: 'Lấy logs thành công',
            data: {
                logs,
                total: countResult[0].total,
                limit,
                offset
            }
        });
    } catch (error) {
        console.error('Error in getAllLogs:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy logs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Lấy logs của user cụ thể (admin only)
 */
const getUserLogsById = async (req, res) => {
    try {
        const userID = parseInt(req.params.userID);
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;
        
        const result = await getUserLogs(userID, limit, offset);
        
        res.json({
            success: true,
            message: 'Lấy logs thành công',
            data: result
        });
    } catch (error) {
        console.error('Error in getUserLogsById:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy logs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Lấy security alerts (admin only)
 */
const getSecurityAlertsController = async (req, res) => {
    try {
        const hours = parseInt(req.query.hours) || 24;
        const limit = parseInt(req.query.limit) || 100;
        
        const alerts = await getSecurityAlerts(hours, limit);
        
        // Phân loại alerts
        const alertsByType = alerts.reduce((acc, alert) => {
            const type = alert.alert_type || 'Unknown';
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(alert);
            return acc;
        }, {});
        
        res.json({
            success: true,
            message: 'Lấy security alerts thành công',
            data: {
                alerts,
                alertsByType,
                period: `${hours} hours`,
                total: alerts.length
            }
        });
    } catch (error) {
        console.error('Error in getSecurityAlertsController:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy security alerts',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Lấy thống kê toàn hệ thống (admin only)
 */
const getSystemStats = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        
        const stats = await getLogStats(null, days);
        
        // Lấy top users
        const [topUsers] = await db.query(`
            SELECT 
                userID,
                userName,
                COUNT(*) as request_count,
                MAX(created_at) as last_request
            FROM api_logs
            WHERE userID IS NOT NULL
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY userID, userName
            ORDER BY request_count DESC
            LIMIT 10
        `, [days]);
        
        // Lấy top IPs
        const [topIPs] = await db.query(`
            SELECT 
                ip_address,
                COUNT(*) as request_count,
                COUNT(DISTINCT userID) as unique_users,
                MAX(created_at) as last_request
            FROM api_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY ip_address
            ORDER BY request_count DESC
            LIMIT 10
        `, [days]);
        
        // Lấy event type distribution
        const [eventTypes] = await db.query(`
            SELECT 
                event_type,
                event_category,
                COUNT(*) as count
            FROM api_logs
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY event_type, event_category
            ORDER BY count DESC
            LIMIT 20
        `, [days]);
        
        // Lấy error distribution
        const [errorStats] = await db.query(`
            SELECT 
                response_status,
                COUNT(*) as count
            FROM api_logs
            WHERE response_status >= 400
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY response_status
            ORDER BY count DESC
        `, [days]);
        
        // Tính summary
        const summary = stats.reduce((acc, day) => {
            acc.totalRequests += day.total_requests || 0;
            acc.totalSuccess += day.success_count || 0;
            acc.totalErrors += day.error_count || 0;
            acc.totalRateLimits += day.rate_limit_count || 0;
            acc.uniqueUsers += day.unique_users || 0;
            acc.uniqueIPs += day.unique_ips || 0;
            return acc;
        }, { 
            totalRequests: 0, 
            totalSuccess: 0, 
            totalErrors: 0,
            totalRateLimits: 0,
            uniqueUsers: 0,
            uniqueIPs: 0
        });
        
        // Tính average response time
        const avgResponseTime = stats.reduce((sum, day) => sum + (day.avg_response_time || 0), 0) / stats.length;
        summary.avgResponseTime = Math.round(avgResponseTime);
        
        res.json({
            success: true,
            message: 'Lấy thống kê thành công',
            data: {
                stats,
                summary,
                topUsers,
                topIPs,
                eventTypes,
                errorStats,
                period: `${days} days`
            }
        });
    } catch (error) {
        console.error('Error in getSystemStats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Tìm kiếm logs với filters (admin only)
 */
const searchLogs = async (req, res) => {
    try {
        const {
            userID,
            ip_address,
            event_type,
            event_category,
            status_min,
            status_max,
            date_from,
            date_to,
            limit = 100,
            offset = 0
        } = req.query;
        
        let query = 'SELECT * FROM v_api_logs_with_user WHERE 1=1';
        const params = [];
        
        if (userID) {
            query += ' AND userID = ?';
            params.push(parseInt(userID));
        }
        
        if (ip_address) {
            query += ' AND ip_address = ?';
            params.push(ip_address);
        }
        
        if (event_type) {
            query += ' AND event_type = ?';
            params.push(event_type);
        }
        
        if (event_category) {
            query += ' AND event_category = ?';
            params.push(event_category);
        }
        
        if (status_min) {
            query += ' AND response_status >= ?';
            params.push(parseInt(status_min));
        }
        
        if (status_max) {
            query += ' AND response_status <= ?';
            params.push(parseInt(status_max));
        }
        
        if (date_from) {
            query += ' AND created_at >= ?';
            params.push(date_from);
        }
        
        if (date_to) {
            query += ' AND created_at <= ?';
            params.push(date_to);
        }
        
        query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));
        
        const [logs] = await db.query(query, params);
        
        res.json({
            success: true,
            message: 'Tìm kiếm thành công',
            data: {
                logs,
                count: logs.length,
                limit: parseInt(limit),
                offset: parseInt(offset),
                filters: {
                    userID,
                    ip_address,
                    event_type,
                    event_category,
                    status_min,
                    status_max,
                    date_from,
                    date_to
                }
            }
        });
    } catch (error) {
        console.error('Error in searchLogs:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tìm kiếm',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Xóa logs cũ (admin only)
 */
const cleanupLogsController = async (req, res) => {
    try {
        const daysToKeep = parseInt(req.query.daysToKeep) || 90;
        
        const result = await cleanupOldLogs(daysToKeep);
        
        res.json({
            success: true,
            message: `Đã xóa ${result.deletedRows} logs cũ hơn ${daysToKeep} ngày`,
            data: result
        });
    } catch (error) {
        console.error('Error in cleanupLogsController:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa logs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// ════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════

module.exports = {
    // User operations
    getMyLogs,
    getMyStats,
    
    // Admin operations
    getAllLogs,
    getUserLogsById,
    getSecurityAlertsController,
    getSystemStats,
    searchLogs,
    cleanupLogsController
};
