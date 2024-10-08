import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const audio = formData.get('audio') as Blob;

    if (!audio) {
        return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    try {
        // Convert Blob to buffer for OpenAI request
        const buffer = Buffer.from(await audio.arrayBuffer());

        // Send to OpenAI
        const response = await openai.audio.transcriptions.create({
            file: new File([buffer], 'audio.wav', { type: 'audio/wav' }), // Pass as file
            model: 'whisper-1',
        });

        return NextResponse.json({ text: response.text });
    } catch (error: any) {
        console.error('Transcription error:', error.message || error);
        return NextResponse.json({ error: 'Transcription failed', details: error.message }, { status: 500 });
    }
}
