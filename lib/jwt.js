const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET; // Vercel env'de ayarlanacak, uzun rastgele bir metin
const TOKEN_TTL_SECONDS = 60 * 60 * 2; // 2 saat — bu sürede ajan tekrar doğrulamak zorunda

function issueToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (e) {
    return null;
  }
}

module.exports = { issueToken, verifyToken, TOKEN_TTL_SECONDS };
