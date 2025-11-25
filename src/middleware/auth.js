const tokenService = require("../services/tokenService");
const prisma = require("../config/prismaClient");

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  try {
    const payload = tokenService.verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireAuth,
};