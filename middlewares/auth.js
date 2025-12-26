const jwt = require("jsonwebtoken");

const prisma = require("../prismaClient");

function auth(req, res, next) {
    const { authorization } = req.headers;
    const token = authorization && authorization.split(" ")[1];

    if (!token) {
        return res.status(400).json({ message: "token required" });
    }

    const user = jwt.decode(token, process.env.JWT_SECRET);
    if (!user) {
        return res.status(401).json({ message: "incorrect token" });
    }

    res.locals.user = user;

    next();
}

function isOwner(type) {
    return async (req, res, next) => {
        const { id } = req.params;
        const user = res.locals.user;

        if (type == "post") {
            const post = await prisma.post.findUnique({
                where: { id: Number(id) }
            });

            if (post.userId == user.id) return next();
        }

        if (type == "comment") {
            const comment = await prisma.comment.findUnique({
                where: { id: Number(id) },
                include: {
                    post: true
                }
            });

            if (comment.userId == user.id || comment.post.userId == user.id) {
                return next();
            }
        }

        return res.status(403).json({ message: "Unauthorized to delete" });
    }
}

module.exports = { auth, isOwner };