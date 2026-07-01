const Groq = require('groq-sdk');

const API_KEY = process.env.GROQ_API_KEY;
if (!API_KEY) {
  console.error("winningResponseService: GROQ_API_KEY is not set");
}

const groq = new Groq({
  apiKey: API_KEY,
});

function extractJSON(responseText) {
  const jsonStart = responseText.indexOf('{');
  const jsonEnd = responseText.lastIndexOf('}') + 1;

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON found in AI response');
  }

  let jsonStr = responseText.substring(jsonStart, jsonEnd);

  // Remove control characters (except newline, tab)
  jsonStr = jsonStr.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // First attempt: try direct parse
  try {
    return JSON.parse(jsonStr);
  } catch (firstErr) {
    console.warn('First JSON parse failed, attempting recovery...');

    // Replace literal newlines/tabs with escaped versions inside the body
    // (the AI often inserts real newlines instead of \\n inside the body string)
    jsonStr = jsonStr
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');

    // Strip remaining non-ASCII chars
    jsonStr = jsonStr.replace(/[^\x20-\x7E]/g, ' ');

    try {
      return JSON.parse(jsonStr);
    } catch (secondErr) {
      console.error('JSON parse recovery failed:', secondErr.message);
      console.error('Raw JSON excerpt:', jsonStr.slice(0, 500));
      throw new Error('Failed to parse AI response');
    }
  }
}

const SYSTEM_PROMPT = `You are a professional proposal writer who helps freelancers and agencies win projects.

## The Winning Response Formula
1. Hook: A personalized opening that references the client's specific project
2. Problem: Restate their challenge in your own words
3. Approach: 2-3 bullet points on how you'd solve it
4. Proof: One relevant example with a specific result
5. Timeline: Clear delivery timeframe
6. Investment: Specific price or range
7. CTA: Clear next step

## Rules
- Under 300 words
- Mirror the client's language
- Focus on outcomes
- Be specific with numbers
- End with a clear call to action

## CRITICAL — Output Format
Return ONLY a JSON object. Do NOT include markdown, code fences, or text outside the JSON.
Use \\n (escaped backslash-n) for line breaks inside the body string, NOT real newlines.
Do NOT use unescaped quotes inside string values.

{
  "subject": "Proposal for [project]",
  "body": "Paragraph one.\\n\\nParagraph two.",
  "wordCount": 280,
  "readTime": 1
}`;

async function generateWinningResponse(briefData) {
  const { briefText, clientName, projectName, analysis } = briefData;

  const userPrompt = `Generate a winning proposal response for this brief:

Client: ${clientName}
Project: ${projectName}
Brief: ${briefText}
${analysis ? `\nKey analysis:\n${JSON.stringify(analysis, null, 2)}` : ''}

Use the 7-step formula: Hook, Problem, Approach, Proof, Timeline, Investment, CTA.
Return ONLY valid JSON. Use \\n for line breaks, not real newlines.`;

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

    const parsed = extractJSON(responseText);
    if (!parsed.subject || !parsed.body) {
      throw new Error('AI response missing required fields (subject, body)');
    }

    return parsed;
  } catch (error) {
    console.error('Winning Response Generation Error:', error);
    throw new Error(error.message || 'Failed to generate winning response');
  }
}

module.exports = { generateWinningResponse };
