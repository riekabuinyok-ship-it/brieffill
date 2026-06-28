// server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

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

app.post('/api/briefs/analyze', async (req, res) => {
  try {
    const { briefText, clientName, projectName } = req.body;
    
    if (!briefText) {
      return res.status(400).json({ error: 'Brief text is required' });
    }

    const systemPrompt = `You are BriefFill, an AI assistant that analyzes client creative briefs.

Your task is to read the client's brief and evaluate it against these 12 fields:
${CRITICAL_FIELDS.map((f, i) => `${i+1}. ${f}`).join('\n')}

For each field, determine if the brief:
- "present": Has specific details about this field
- "partial": Mentions it but lacks details
- "missing": Doesn't mention it at all

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
    
    let result;
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonStr = responseText.substring(jsonStart, jsonEnd);
      result = JSON.parse(jsonStr);
    } else {
      result = JSON.parse(responseText);
    }

    result.clientName = clientName;
    result.projectName = projectName;
    
    res.json(result);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: error.message,
      completeness_score: 0,
      fields: CRITICAL_FIELDS.map(name => ({ name, status: 'unknown', question: '' })),
      clarifying_questions: ['Error analyzing brief'],
      suggested_tone: 'professional',
      summary: 'An error occurred during analysis'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});