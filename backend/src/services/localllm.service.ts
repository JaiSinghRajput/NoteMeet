import axios from 'axios';

const OPENAI_BASE_URL =
  process.env.OPENAI_BASE_URL || 'http://localhost:12434/engines/v1';

const OPENAI_MODEL =
  process.env.OPENAI_MODEL || 'ai/smollm2';

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || 'not-needed';

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

/**
 * Generate summary using OpenAI-compatible local model
 */
export const generateSummaryLocal = async (
  transcript: string
): Promise<{
  overview: string;
  keyPoints: string[];
  actionItems: string[];
}> => {
  try {
    const prompt = `
You are an expert meeting summarizer.

Given a meeting transcript, provide:
1. A concise overview (2-3 sentences)
2. Key points discussed (as a list)
3. Action items identified (as a list)

Respond ONLY in JSON format exactly like this:
{
  "overview": "...",
  "keyPoints": ["point1", "point2"],
  "actionItems": ["action1", "action2"]
}

Meeting transcript:
${transcript}
`;

    const response = await axios.post<OpenAIResponse>(
      `${OPENAI_BASE_URL}/chat/completions`,
      {
        model: OPENAI_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content =
      response.data.choices?.[0]?.message?.content || '';

    // Extract JSON safely
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from model response');
    }

    const result = JSON.parse(jsonMatch[0]);

    return {
      overview: result.overview || '',
      keyPoints: result.keyPoints || [],
      actionItems: result.actionItems || [],
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary');
  }
};

/**
 * Check if model is available
 */
export const checkModelHealth = async (): Promise<boolean> => {
  try {
    const response = await axios.get(
      `${OPENAI_BASE_URL}/models`,
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        timeout: 5000,
      }
    );

    return response.status === 200;
  } catch (error) {
    console.error('Model health check failed:', error);
    return false;
  }
};