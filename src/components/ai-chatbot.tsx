import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { compareWithAllMessages } from "@/lib/cosineSimilarity";

export function AiChatbot() {
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Merhaba. Nasıl yardımcı olabilirim?" },
    ]);
    useEffect(() => {
        const interval = setInterval(() => {
            console.log(compareWithAllMessages("Ankara başkentimizdir"));
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const [text, setText] = useState("");
    console.log(text);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const prewrittenPrompts: string[] = [
        "AnyRidge implantları kimler için uygundur?",
        "AnyRidge implantları hangi durumlarda kullanılabilir?",
        "AnyRidge implantlarının bakımı nasıl yapılmalıdır?",
    ];

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchStreamedResponse = async (prompt: string) => {
        setText("");

        setMessages((prevMessages) => [
            ...prevMessages,
            { role: "user", content: prompt },
        ]);

        try {
            const response = await fetch("/api/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    prompt: [
                        ...messages,
                        {role:"system", content: "I can only provide information about Megagen and its offerings. Please ask questions related to Megagen."},
                        {
                            role: "user",
                            content: `You are an AI assistant designed exclusively to provide information about Megagen, its products, and its services. Do not respond to any questions or prompts that are unrelated to Megagen. If asked anything irrelevant, respond with: 'I can only provide information about Megagen and its offerings. Please ask questions related to Megagen.' in Prompt’s language Prompt is: ${prompt}`,
                        },
                    ],
                }),
            });
            if (response.status === 429) {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    {
                        role: "assistant",
                        content: "Rate limit exceeded. Please try again later.",
                    },
                ]);
                return
            }
            if (!response.body) {
                throw new Error("No response body");
            }

            setMessages((prevMessages) => [
                ...prevMessages,
                { role: "assistant", content: "" },
            ]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk
                    .split("\n")
                    .filter((line) => line.trim() !== "");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.content) {
                                setText((prevText) => {
                                    const newText = prevText + data.content;
                                    setMessages((prevMessages) => {
                                        const newMessages = [...prevMessages];
                                        newMessages[
                                            newMessages.length - 1
                                        ].content = newText;
                                        return newMessages;
                                    });
                                    return newText;
                                });
                            }
                        } catch (e) {
                            console.error("Error parsing JSON:", e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Streaming error:", error);
        }
    };

    const handleSend = async (prompt: string) => {
        setInput("");
        await fetchStreamedResponse(prompt);
    };

    return (
        <Card className="flex flex-col h-[600px] w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-center text-2xl font-bold">
                    IMegagen Asistan
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col p-4 overflow-hidden">
                <ScrollArea className="flex-grow pr-4">
                    <div className="space-y-4">
                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${
                                    message.role === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                                <div
                                    className={`max-w-[80%] p-2 rounded-lg ${
                                        message.role === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    }`}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
                <div className="flex flex-wrap gap-2 mt-4">
                    {prewrittenPrompts.map((prompt, index) => (
                        <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="bg-gray-200"
                            onClick={() => handleSend(prompt)}
                        >
                            {prompt}
                        </Button>
                    ))}
                </div>
                <div className="flex gap-2 mt-4">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === "Enter" && input.trim()) {
                                handleSend(input.trim());
                            }
                        }}
                        placeholder="Bir mesaj yazın..."
                        className="flex-grow"
                    />
                    <Button
                        onClick={() => input.trim() && handleSend(input.trim())}
                    >
                        Gönder
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
