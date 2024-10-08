import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export const runtime = 'edge';

export async function POST(req: Request) {
    const { messages, pdfContext, transcript } = await req.json();

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        stream: true,
        messages: [
            {
                role: 'system',
                content: `You are a helpful study assistant. Use the following context from a PDF if relevant: ${pdfContext}\n\nAnd the following transcript if relevant: ${transcript}`
            },
            ...messages,
        ],
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
}