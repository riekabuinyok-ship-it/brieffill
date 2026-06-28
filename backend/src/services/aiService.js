// backend/src/services/aiService.js
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const CRITICAL_FIELDS = [
  'Project Overview',
  'Target Audience',
  'Core Problem',
  'Solution/Offer',
  'Key Benefits',
  'Tone of Voice',
  'Brand Guidelines',
  'Deliverables',
  'Timeline',
  'Budget',
  'Competitors',
  'Call to Action'
];

function normalizeResponse(raw) {
  return {
    completenessScore: raw.completeness_score ?? raw.completenessScore ?? 0,
    fields: Array.isArray(raw.fields || raw.fields)
      ? (raw.fields || raw.fields).map(f => ({
          name: f.name || '',
          status: ['present', 'partial', 'missing'].includes(f.status) ? f.status : 'missing',
          question: typeof f.question === 'string' ? f.question : '',
        }))
      : [],
    clarificationQuestions: Array.isArray(raw.clarifying_questions || raw.clarificationQuestions)
      ? (raw.clarifying_questions || raw.clarificationQuestions).filter(q => typeof q === 'string')
      : [],
    suggestedTone: raw.suggested_tone || raw.suggestedTone || 'professional and collaborative',
    summary: raw.summary || '',
  };
}

export async function analyzeBrief(briefText) {
  const systemPrompt = `You are BriefFill, an AI assistant that analyzes client creative briefs.

Your task is to read the client's brief and evaluate it against these 12 fields:

Project Overview
Target Audience
Core Problem
Solution/Offer
Key Benefits
Tone of Voice
Brand Guidelines
Deliverables
Timeline
Budget
Competitors
Call to Action

For each field, determine if the brief:
"present": Has specific details about this field
"partial": Mentions it but lacks details
"missing": Doesn't mention it at all

For ANY field that is "partial" or "missing", create ONE specific, direct question asking for exactly what's missing.

The questions MUST be specific to the industry. Examples:
- For robotics: "Which 3-5 robotics competitors do you admire most and why?"
- For fintech: "What age group and income level are you targeting?"
- For SaaS: "Do you need this ready for a specific product launch date?"

NEVER use generic questions like "Could you provide more detail" or "Please provide more information".

Calculate a completeness score: 100% - (number of partial/missing fields * 8.3%).

Respond ONLY with a JSON object:
{
"completeness_score": number,
"fields": [
{"name": "Project Overview", "status": "present", "question": ""},
...
],
"clarifying_questions": ["question1", "question2"],
"suggested_tone": "tone description",
"summary": "2-3 sentence honest summary"
}

Set question to "" for fields marked "present".`;

  const userPrompt = `Analyze this brief and evaluate each of the 12 fields. Be SPECIFIC and HONEST.

Brief:
${briefText}

Return ONLY the JSON object with your analysis.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      max_tokens: 1024,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '';

    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}') + 1;

    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonStr = responseText.substring(jsonStart, jsonEnd);
      const parsed = JSON.parse(jsonStr);
      return normalizeResponse(parsed);
    }

    throw new Error('No JSON found in response');

  } catch (error) {
    console.error('AI Analysis Error:', error);
    return {
      completenessScore: 0,
      fields: CRITICAL_FIELDS.map(name => ({ name, status: 'unknown', question: '' })),
      clarificationQuestions: [`Error: ${error.message}`],
      suggestedTone: 'professional',
      summary: `Error analyzing brief: ${error.message}`,
    };
  }
}
