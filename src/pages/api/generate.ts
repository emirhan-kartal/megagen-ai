// api/generate.ts
import rateLimitMiddleware from "@/middleware/rateLimiter";
import type { NextApiRequest, NextApiResponse } from "next";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
    const { prompt } = req.body;

    // Set appropriate headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
        const response = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "ft:gpt-4o-mini-2024-07-18:personal::AYL4ANrs",
                    messages: prompt,
                    stream: true,
                }),
            }
        );

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }

            // Parse the chunks as they come in
            const chunk = decoder.decode(value);
            const lines = chunk
                .split("\n")
                .filter((line) => line.trim() !== "");

            for (const line of lines) {
                if (line.includes("[DONE]")) continue;
                if (line.startsWith("data: ")) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        const content = data.choices[0]?.delta?.content || "";
                        if (content) {
                            // Send the content chunk to the client
                            res.write(
                                `data: ${JSON.stringify({ content })}\n\n`
                            );
                        }
                    } catch (e) {
                        console.error("Error parsing JSON:", e);
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error:", error);
        res.write(
            `data: ${JSON.stringify({ error: "An error occurred" })}\n\n`
        );
    }

    res.end();
};
export default rateLimitMiddleware(handler);