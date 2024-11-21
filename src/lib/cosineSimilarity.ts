import { messages } from "./utils";

// Tokenize and count word frequencies
const getWordFrequencies = (text: string): Map<string, number> => {
    // Tokenize: convert to lowercase and split into words
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];

    // Count word frequencies
    const frequencies = new Map<string, number>();
    words.forEach((word) => {
        frequencies.set(word, (frequencies.get(word) || 0) + 1);
    });

    return frequencies;
};

// Calculate cosine similarity
export const calculateCosineSimilarity = (
    doc1: string,
    doc2: string
): number => {
    // Get word frequencies for both documents
    const freq1 = getWordFrequencies(doc1);
    const freq2 = getWordFrequencies(doc2);

    // Get all unique words
    const allWords = new Set([...freq1.keys(), ...freq2.keys()]);

    // Calculate dot product and magnitudes
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (const word of allWords) {
        const f1 = freq1.get(word) || 0;
        const f2 = freq2.get(word) || 0;

        dotProduct += f1 * f2;
        magnitude1 += f1 * f1;
        magnitude2 += f2 * f2;
    }

    // Prevent division by zero
    if (magnitude1 === 0 || magnitude2 === 0) {
        return 0;
    }

    // Calculate cosine similarity
    return dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2));
};

export const compareWithAllMessages = (message: string) => {
    let similarity = 0;
    let similarMessage = "";
    messages.forEach((m) => {
        const sim = calculateCosineSimilarity(message, m);
        if (sim > similarity) {
            similarity = sim;
            similarMessage = m;
        }
    });
    return { similarity, similarMessage };
};
