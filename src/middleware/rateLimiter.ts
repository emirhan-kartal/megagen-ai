import { NextApiRequest, NextApiResponse } from "next";

const rateLimitMap = new Map();

export default function rateLimitMiddleware(
    handler: (req: NextApiRequest, res: NextApiResponse) => void
) {
    return (req: NextApiRequest, res: NextApiResponse) => {
        const ip =
            req.headers["x-forwarded-for"] || req.connection.remoteAddress;
        const limit = 15;
        const window = 60*1000;
        if (!rateLimitMap.has(ip)) {
            rateLimitMap.set(ip, {
                timestamp: Date.now(),
                count: 1,
            });
        }
        const ipData = rateLimitMap.get(ip);
        if (Date.now() - ipData.lastReset > window) {
            ipData.count = 0;
            ipData.timestamp = Date.now();
        }
        if (ipData.count >= limit) {
            return res.status(429).json({ error: "Rate limit exceeded" });
        }
        ipData.count++;
        return handler(req, res);
    };
}
