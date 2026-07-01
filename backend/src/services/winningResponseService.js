const Groq = require('groq-sdk');

const API_KEY = process.env.GROQ_API_KEY;
if (!API_KEY) {
  console.error("winningResponseService: GROQ_API_KEY is not set");
}

const groq = new Groq({
  apiKey: API_KEY,
});

const SYSTEM_PROMPT = `You are a professional proposal writer who helps freelancers and agencies win projects.

## The Winning Response Formula

1. **Hook**: A personalized opening that references the client's specific project
2. **Problem**: Restate their challenge in your own words
3. **Approach**: 2-3 bullet points on how you'd solve it
4. **Proof**: One relevant example with a specific result
5. **Timeline**: Clear delivery timeframe
6. **Investment**: Specific price or range
7. **CTA**: Clear next step

## Rules
- Under 300 words
- Mirror the client's language
- Focus on outcomes
- Be specific with numbers
- End with a clear call to action

Return ONLY a JSON object with no markdown or extra text:
{
  "subject": "Proposal for [project]",
  "body": "Full proposal text",
  "wordCount": 280,
  "readTime": 1
}`;

async function generateWinningResponse(briefData) {
  const { briefText, clientName, projectName, analysis } = briefData;

  const userPrompt = `Generate a winning proposal response for this brief:

Client: ${clientName}
Project: ${projectName}
Brief: ${briefText}
${analysis ? `\nKey analysis:\n${JSON.stringify(analysis, null, 2)}` : ''}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 1024,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '';
    if (!responseText) {
      throw new Error('Groq returned empty response');
    }

    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('No JSON found in AI response. Raw: ' + responseText.slice(0, 200));
    }

    try {
      const jsonStr = responseText.substring(jsonStart, jsonEnd);
      return JSON.parse(jsonStr);
    } catch (parseErr) {
      throw new Error('Failed to parse AI response: ' + parseErr.message);
    }
  } catch (error) {
    console.error('Winning Response Generation Error:', error);
    throw error;
  }
}

module.exports = { generateWinningResponse };
