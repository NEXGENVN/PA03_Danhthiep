// ════════════════════════════════════════════════════════════════
// TRUST MIDDLEWARE - Extract userID from request and set req.user
// ZL_SERVER trusts MAIN_SERVER, no authentication needed
// ════════════════════════════════════════════════════════════════

function trustMiddleware(req, res, next) {
    // Extract userID from body or query (sent by MAIN_SERVER)
    const userID = req.body.userID || req.query.userID;

    if (!userID) {
        return res.status(400).json({
            success: false,
            message: 'Missing userID parameter'
        });
    }

    // Set req.user as if authenticated (trust MAIN_SERVER)
    req.user = {
        userID: parseInt(userID)
    };

    next();
}

module.exports = { trustMiddleware };

