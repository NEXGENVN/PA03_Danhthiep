// ════════════════════════════════════════════════════════════════
// ADMIN PRODUCT CONTROLLER - QUẢN LÝ SẢN PHẨM (CHO ADMIN)
// ════════════════════════════════════════════════════════════════

const db = require('../config/database');

// Helper: chuẩn hoá kết quả trả về từ db.query()
function extractRows(queryResult) {
    if (Array.isArray(queryResult) && Array.isArray(queryResult[0])) {
        return queryResult[0];
    } else if (Array.isArray(queryResult)) {
        return queryResult;
    } else if (queryResult && queryResult.rows) {
        return queryResult.rows;
    } else {
        return [];
    }
}

// ════════════════════════════════════════════════════════════════
// API: LẤY DANH SÁCH SẢN PHẨM (ADMIN)
// ════════════════════════════════════════════════════════════════

exports.getAllProducts = async (req, res) => {
    try {
        const sql = `
            SELECT 
                productID,
                productName,
                productDesc,
                productOnePrice,
                productFivePrice,
                productTenPrice,
                productImage,
                isActive,
                createdAt,
                updatedAt
            FROM product
            ORDER BY productID ASC
        `;

        const result = await db.query(sql);
        const products = extractRows(result);

        res.json({
            success: true,
            message: 'Lấy danh sách sản phẩm thành công',
            data: products
        });
    } catch (error) {
        console.error('❌ Error getting all products:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách sản phẩm',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// API: LẤY CHI TIẾT SẢN PHẨM
// ════════════════════════════════════════════════════════════════

exports.getProductById = async (req, res) => {
    try {
        const { productID } = req.params;

        if (!productID) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu productID'
            });
        }

        const sql = `
            SELECT 
                productID,
                productName,
                productDesc,
                productOnePrice,
                productFivePrice,
                productTenPrice,
                productImage,
                isActive,
                createdAt,
                updatedAt
            FROM product
            WHERE productID = ?
        `;

        const result = await db.query(sql, [productID]);
        const products = extractRows(result);

        if (!products || products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        res.json({
            success: true,
            message: 'Lấy thông tin sản phẩm thành công',
            data: products[0]
        });
    } catch (error) {
        console.error('❌ Error getting product:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin sản phẩm',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// API: TẠO SẢN PHẨM MỚI
// ════════════════════════════════════════════════════════════════

exports.createProduct = async (req, res) => {
    try {
        const {
            productName,
            productDesc,
            productOnePrice,
            productFivePrice,
            productTenPrice,
            productImage,
            isActive
        } = req.body;

        // Validate input
        if (!productName || !productDesc) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin sản phẩm (tên và mô tả là bắt buộc)'
            });
        }

        // Validate prices
        const onePrice = parseFloat(productOnePrice) || 0;
        const fivePrice = parseFloat(productFivePrice) || 0;
        const tenPrice = parseFloat(productTenPrice) || 0;

        if (onePrice < 0 || fivePrice < 0 || tenPrice < 0) {
            return res.status(400).json({
                success: false,
                message: 'Giá không được âm'
            });
        }

        if (onePrice === 0 && fivePrice === 0 && tenPrice === 0) {
            return res.status(400).json({
                success: false,
                message: 'Phải có ít nhất một loại giá khác 0'
            });
        }

        const sql = `
            INSERT INTO product (
                productName,
                productDesc,
                productOnePrice,
                productFivePrice,
                productTenPrice,
                productImage,
                isActive
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            productName,
            productDesc,
            onePrice,
            fivePrice,
            tenPrice,
            productImage || 'https://via.placeholder.com/300x200/667eea/ffffff?text=Product',
            isActive !== undefined ? isActive : true
        ];

        const result = await db.query(sql, values);
        const insertId = result.insertId || (result[0] && result[0].insertId);

        res.json({
            success: true,
            message: 'Tạo sản phẩm mới thành công',
            data: {
                productID: insertId,
                productName: productName
            }
        });
    } catch (error) {
        console.error('❌ Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo sản phẩm',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// API: CẬP NHẬT SẢN PHẨM
// ════════════════════════════════════════════════════════════════

exports.updateProduct = async (req, res) => {
    try {
        const { productID } = req.params;
        const {
            productName,
            productDesc,
            productOnePrice,
            productFivePrice,
            productTenPrice,
            productImage,
            isActive
        } = req.body;

        if (!productID) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu productID'
            });
        }

        // Kiểm tra sản phẩm tồn tại
        const checkSql = 'SELECT productID FROM product WHERE productID = ?';
        const checkResult = await db.query(checkSql, [productID]);
        const existing = extractRows(checkResult);

        if (!existing || existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }

        // Validate prices nếu có
        if (productOnePrice !== undefined) {
            const price = parseFloat(productOnePrice);
            if (price < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Giá không được âm'
                });
            }
        }

        if (productFivePrice !== undefined) {
            const price = parseFloat(productFivePrice);
            if (price < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Giá không được âm'
                });
            }
        }

        if (productTenPrice !== undefined) {
            const price = parseFloat(productTenPrice);
            if (price < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Giá không được âm'
                });
            }
        }

        // Build dynamic UPDATE query
        const updates = [];
        const values = [];

        if (productName !== undefined) {
            updates.push('productName = ?');
            values.push(productName);
        }

        if (productDesc !== undefined) {
            updates.push('productDesc = ?');
            values.push(productDesc);
        }

        if (productOnePrice !== undefined) {
            updates.push('productOnePrice = ?');
            values.push(parseFloat(productOnePrice) || 0);
        }

        if (productFivePrice !== undefined) {
            updates.push('productFivePrice = ?');
            values.push(parseFloat(productFivePrice) || 0);
        }

        if (productTenPrice !== undefined) {
            updates.push('productTenPrice = ?');
            values.push(parseFloat(productTenPrice) || 0);
        }

        if (productImage !== undefined) {
            updates.push('productImage = ?');
            values.push(productImage);
        }

        if (isActive !== undefined) {
            updates.push('isActive = ?');
            values.push(isActive);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có thông tin nào để cập nhật'
            });
        }

        values.push(productID);

        const sql = `
            UPDATE product 
            SET ${updates.join(', ')}
            WHERE productID = ?
        `;

        await db.query(sql, values);

        res.json({
            success: true,
            message: 'Cập nhật sản phẩm thành công'
        });
    } catch (error) {
        console.error('❌ Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật sản phẩm',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// API: XÓA SẢN PHẨM (SOFT DELETE - CHỈ VÔ HIỆU HÓA)
// ════════════════════════════════════════════════════════════════

exports.deleteProduct = async (req, res) => {
    try {
        const { productID } = req.params;

        if (!productID) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu productID'
            });
        }

        // Kiểm tra có licenses đã mua chưa
        const checkLicenseSql = `
            SELECT COUNT(*) as licenseCount 
            FROM license 
            WHERE productID = ?
        `;
        
        const licenseResult = await db.query(checkLicenseSql, [productID]);
        const licenseData = extractRows(licenseResult);
        const licenseCount = licenseData[0]?.licenseCount || 0;

        if (licenseCount > 0) {
            // Có licenses rồi - chỉ vô hiệu hóa, không xóa
            const sql = 'UPDATE product SET isActive = FALSE WHERE productID = ?';
            await db.query(sql, [productID]);

            return res.json({
                success: true,
                message: `Đã vô hiệu hóa sản phẩm (có ${licenseCount} licenses đã mua, không thể xóa hoàn toàn)`
            });
        } else {
            // Chưa có licenses - có thể xóa hẳn
            const sql = 'DELETE FROM product WHERE productID = ?';
            await db.query(sql, [productID]);

            return res.json({
                success: true,
                message: 'Đã xóa sản phẩm thành công'
            });
        }
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa sản phẩm',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// API: THỐNG KÊ SẢN PHẨM
// ════════════════════════════════════════════════════════════════

exports.getProductStats = async (req, res) => {
    try {
        const sql = `
            SELECT 
                p.productID,
                p.productName,
                p.isActive,
                COUNT(l.licenseID) as totalLicenses,
                SUM(CASE WHEN l.isActivated = TRUE THEN 1 ELSE 0 END) as activatedLicenses,
                SUM(l.pricePaid) as totalRevenue
            FROM product p
            LEFT JOIN license l ON p.productID = l.productID
            GROUP BY p.productID, p.productName, p.isActive
            ORDER BY totalRevenue DESC
        `;

        const result = await db.query(sql);
        const stats = extractRows(result);

        res.json({
            success: true,
            message: 'Lấy thống kê sản phẩm thành công',
            data: stats
        });
    } catch (error) {
        console.error('❌ Error getting product stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê sản phẩm',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// API: LẤY DANH SÁCH TẤT CẢ LICENSES (ADMIN)
// ════════════════════════════════════════════════════════════════

// === REPLACE START: getAllLicenses pagination & query construction ===
exports.getAllLicenses = async (req, res) => {
    try {
        const { productID, userName, status, page = 1, limit = 50 } = req.query;
        
        // Build WHERE clause
        const conditions = [];
        const params = [];
        
        if (productID) {
            conditions.push('l.productID = ?');
            params.push(productID);
        }
        
        if (userName) {
            conditions.push('u.userName = ?');
            params.push(userName);
        }
        
        if (status !== undefined) {
            // bind 0/1 not boolean to avoid driver issues
            conditions.push('l.status = ?');
            params.push(status);
        }
        
        const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
        
        // Calculate pagination - đảm bảo là số hợp lệ (sử dụng integer safe)
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 50);
        const offset = (pageNum - 1) * limitNum;
        
        // Get total count
        const countSql = `
            SELECT COUNT(*) as total
            FROM license l
            LEFT JOIN user_link_license ull ON l.licenseKey = ull.licenseKey
            LEFT JOIN user u ON ull.userID = u.userID
            ${whereClause}
        `;
        const countResult = await db.query(countSql, params);
        const total = extractRows(countResult)[0]?.total || 0;
        
        // Build main SQL but DO NOT use placeholders for LIMIT/OFFSET (inject validated numbers)
        const sql = `
            SELECT 
                l.licenseKey,
                l.status,
                p.productID,
                p.productName,
                p.productImage,
                u.userID,
                u.userName,
                u.email,
                ull.pricePaid,
                ull.purchaseTime
            FROM license l
            INNER JOIN product p ON l.productID = p.productID
            LEFT JOIN user_link_license ull ON l.licenseKey = ull.licenseKey
            LEFT JOIN user u ON ull.userID = u.userID
            ${whereClause}
            ORDER BY ull.purchaseTime DESC, l.createdAt DESC
            LIMIT ${limitNum} OFFSET ${offset}
        `;
        
        // mainParams = chỉ params cho WHERE; LIMIT/OFFSET đã được chèn trực tiếp
        const mainParams = params;   
        const result = await db.query(sql, mainParams);
        const licenses = extractRows(result);
        
        res.json({
            success: true,
            message: 'Lấy danh sách licenses thành công',
            data: {
                licenses: licenses,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('❌ Error getting all licenses:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách licenses',
            error: error.message
        });
    }
};
// === REPLACE END ===


// ════════════════════════════════════════════════════════════════
// API: LẤY CHI TIẾT LICENSE
// ════════════════════════════════════════════════════════════════

exports.getLicenseById = async (req, res) => {
    try {
        const { licenseKey } = req.params;
        
        const sql = `
            SELECT 
                l.licenseKey,
                l.activeTime,
                l.createdAt,
                l.updatedAt,
                l.status,
                l.countDown,
                p.productID,
                p.productName,
                p.productImage,
                u.userID,
                u.userName,
                u.email,
                ull.pricePaid,
                ull.purchaseTime
            FROM license l
            INNER JOIN product p ON l.productID = p.productID
            LEFT JOIN user_link_license ull ON l.licenseKey = ull.licenseKey
            LEFT JOIN user u ON ull.userID = u.userID
            WHERE l.licenseKey = ?
        `;
        
        const result = await db.query(sql, [licenseKey]);
        const licenses = extractRows(result);
        
        if (!licenses || licenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy license'
            });
        }
        
        res.json({
            success: true,
            message: 'Lấy thông tin license thành công',
            data: licenses[0]
        });
    } catch (error) {
        console.error('❌ Error getting license:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin license',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// API: VÔ HIỆU HÓA LICENSE (ADMIN)
// ════════════════════════════════════════════════════════════════

exports.revokeLicense = async (req, res) => {
    try {
        const { licenseKey } = req.params;
        const { reason } = req.body;
        
        // Kiểm tra license tồn tại
        const checkSql = 'SELECT * FROM license WHERE licenseKey = ?';
        const checkResult = await db.query(checkSql, [licenseKey]);
        const existing = extractRows(checkResult);
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy license'
            });
        }
        
        // Vô hiệu hóa license bằng cách set expiredTime = NOW()
        const sql = `
            UPDATE license 
            SET status = 2
            WHERE licenseKey = ?
        `;
        
        await db.query(sql, [licenseKey]);
        
        // Log action
        console.log(`🔒 Admin revoked license ${licenseKey}. Reason: ${reason || 'No reason provided'}`);
        
        res.json({
            success: true,
            message: 'Đã vô hiệu hóa license thành công'
        });
    } catch (error) {
        console.error('❌ Error revoking license:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi vô hiệu hóa license',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// API: GIA HẠN LICENSE (ADMIN)
// ════════════════════════════════════════════════════════════════

exports.extendLicense = async (req, res) => {
    try {
        const { licenseKey } = req.params;
        const { count } = req.body; // Số tháng gia hạn
        
        if (!count || count < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượt tăng không hợp lệ'
            });
        }
        
        // Kiểm tra license tồn tại
        const checkSql = 'SELECT * FROM license WHERE licenseKey = ?';
        const checkResult = await db.query(checkSql, [licenseKey]);
        const existing = extractRows(checkResult);
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy license'
            });
        }
        
        const license = existing[0];
        
        // Tính countDown mới
        newCountDown = license.countDown + count;
               
        // Update license
        const sql = `
            UPDATE license 
            SET countDown = ?
            WHERE licenseKey = ?
        `;
        
        await db.query(sql, [newCountDown, licenseKey]);
        
        console.log(`📅 Admin extended countDown license ${licenseKey} by ${count} times`);
        
        res.json({
            success: true,
            message: `Đã tăng lượt dùng license thêm ${count} lần`,
            data: {
                newCountDown: newCountDown
            }
        });
    } catch (error) {
        console.error('❌ Error countDown license:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tăng lượt dùng license',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// API: XÓA LICENSE (ADMIN - NGUY HIỂM)
// ════════════════════════════════════════════════════════════════

exports.deleteLicense = async (req, res) => {
    try {
        const { licenseKey } = req.params;
        
        // Kiểm tra license tồn tại
        const checkSql = 'SELECT * FROM license WHERE licenseKey = ?';
        const checkResult = await db.query(checkSql, [licenseKey]);
        const existing = extractRows(checkResult);
        
        if (!existing || existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy license'
            });
        }
        
        // Xóa user_link_license trước (foreign key)
        await db.query('DELETE FROM user_link_license WHERE licenseKey = ?', [licenseKey]);
        
        // Xóa license
        const sql = 'DELETE FROM license WHERE licenseKey = ?';
        await db.query(sql, [licenseKey]);
        
        console.log(`🗑️ Admin deleted license ${licenseKey}`);
        
        res.json({
            success: true,
            message: 'Đã xóa license thành công'
        });
    } catch (error) {
        console.error('❌ Error deleting license:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa license',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// API: THỐNG KÊ LICENSES
// ════════════════════════════════════════════════════════════════

exports.getLicenseStats = async (req, res) => {
    try {
        const sql = `
            SELECT 
                COUNT(*) as totalLicenses,
                SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as activatedLicenses,
                SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as notActivatedLicenses,
                SUM(CASE WHEN status = 1 AND countDown > 0 THEN 1 ELSE 0 END) as activeLicenses,
                SUM(CASE WHEN status = 2 OR countDown = 0 THEN 1 ELSE 0 END) as expiredLicenses,
                COUNT(DISTINCT productID) as totalProducts,
                (SELECT SUM(pricePaid) FROM user_link_license) as totalRevenue,
                (SELECT COUNT(DISTINCT userID) FROM user_link_license) as totalUsers
            FROM license
        `;
        
        const result = await db.query(sql);
        const stats = extractRows(result)[0];
        
        res.json({
            success: true,
            message: 'Lấy thống kê licenses thành công',
            data: stats
        });
    } catch (error) {
        console.error('❌ Error getting license stats:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê licenses',
            error: error.message
        });
    }
};

// ════════════════════════════════════════════════════════════════
// EXPORT MODULE
// ════════════════════════════════════════════════════════════════

module.exports = exports;
