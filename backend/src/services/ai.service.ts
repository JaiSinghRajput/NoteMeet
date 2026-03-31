import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const transcribeAudio = async (audioFilePath: string): Promise<string> => {
  const fileStream = fs.createReadStream(audioFilePath);
  const transcription = await openai.audio.transcriptions.create({
    file: fileStream,
    model: 'whisper-1',
  });
  return transcription.text;
};

export const generateSummary = async (transcript: string): Promise<{
  overview: string;
  keyPoints: string[];
  actionItems: string[];
}> => {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert meeting summarizer. Given a meeting transcript, provide:
1. A concise overview (2-3 sentences)
2. Key points discussed (as a list)
3. Action items identified (as a list)

Respond in JSON format exactly like this:
{
  "overview": "...",
  "keyPoints": ["point1", "point2"],
  "actionItems": ["action1", "action2"]
}`,
      },
      {
        role: 'user',
        content: `Please summarize this meeting transcript:\n\n${transcript}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const content = completion.choices[0].message.content;
  if (!content) throw new Error('No summary generated');

  return JSON.parse(content);
};
