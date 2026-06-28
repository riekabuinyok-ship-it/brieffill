import os
from groq import Groq
import json

# Initialize the Groq client with your API key
client = Groq(
    api_key="gsk_YOUR_GROQ_API_KEY",
)

def analyze_brief(brief_text):
    """
    Analyze a client brief and identify missing critical fields.
    Returns structured analysis with completeness score and questions.
    """
    
    # The 12 critical fields for creative briefs
    critical_fields = [
        "Project Overview",
        "Target Audience",
        "Core Problem",
        "Solution/Offer",
        "Key Benefits",
        "Tone of Voice",
        "Brand Guidelines",
        "Deliverables",
        "Timeline",
        "Budget",
        "Competitors",
        "Call to Action"
    ]
    
    # ENHANCED SYSTEM PROMPT
    system_prompt = f"""You are BriefFill, an AI assistant that helps freelancers and agencies analyze client creative briefs.

Your task is to analyze the client's brief text and identify which of these 12 critical fields are present, partial, or missing:

{', '.join(critical_fields)}

For each field, determine:
- "present": The brief clearly provides this information with specific details
- "partial": The brief mentions this but lacks important details  
- "missing": The brief does not mention this at all

**CRITICAL INSTRUCTION:** When a field is "partial" or "missing", generate a **specific, actionable question** tailored to the client's industry and project type. Do NOT use generic questions like "Could you provide more detail on X?"

Instead, create questions that:
1. Reference the specific industry (fintech, healthcare, e-commerce, robotics, etc.)
2. Ask for concrete details (numbers, examples, preferences)
3. Show you understand their business context

**Examples of GOOD questions:**
- For Target Audience in fintech: "What age group and income level are you targeting? Are they tech-savvy millennials or older investors?"
- For Budget in e-commerce: "What is your target cost per acquisition? What's your expected ROI on this rebrand?"
- For Timeline in SaaS: "Do you need this ready for a specific conference or product launch date?"
- For Competitors in robotics: "Which 3-5 direct competitors do you admire most and why?"
- For Brand Guidelines in tech: "Do you have existing brand colors, fonts, or mood boards we should reference?"

**Examples of BAD questions (do NOT use):**
- "Could you provide more detail on target audience?"
- "Could you provide more detail on budget?"
- "Please provide more information about timeline."
- "Could you briefly describe the project and its primary goal?"

Then:
1. Calculate an overall completeness score (0-100)
2. Generate 3-5 clarifying questions for the missing or partial fields
3. Suggest a professional tone for follow-up email
4. Provide a brief summary of what's missing and what's strong

IMPORTANT: The summary should be honest. If the brief is excellent, say so. If it's missing key details, say that.

Respond ONLY with a valid JSON object in this exact format:
{{
    "completeness_score": 85,
    "fields": [
        {{"name": "Project Overview", "status": "present", "question": ""}},
        {{"name": "Target Audience", "status": "present", "question": ""}},
        {{"name": "Budget", "status": "present", "question": ""}},
        {{"name": "Competitors", "status": "partial", "question": "Which 3-5 direct competitors do you admire most and why?"}}
    ],
    "clarifying_questions": [
        "Which 3-5 direct competitors do you admire most and why?"
    ],
    "suggested_tone": "confident, data-driven, innovative",
    "summary": "This brief is comprehensive and well-structured. It covers all 12 critical fields with specific details, demonstrating a clear understanding of the project. The tone is bold but backed by data."
}}

If a field is "present", set the question to an empty string "".

Do not include any other text outside the JSON object."""
    
    # User prompt with the brief
    user_prompt = f"""Here is the client brief to analyze:

{brief_text}

Please analyze this brief against the 12 critical fields and provide your assessment in the JSON format specified.

IMPORTANT: Generate SPECIFIC, TAILORED questions for each missing or partial field based on the client's industry and project context. Do not use generic questions. If a field is clearly "present", mark it as such with an empty question.

BE HONEST about the completeness score. If the brief has all 12 fields with specific details, give it a high score (85-100%)."""
    
    # Make the API call
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=1024,
        )
        
        # Parse the response
        response_text = chat_completion.choices[0].message.content.strip()
        
        # Debug: Print raw response
        print("\n" + "="*60)
        print("🟡 RAW AI RESPONSE (for debugging)")
        print("="*60)
        print(response_text[:500] + "..." if len(response_text) > 500 else response_text)
        print("="*60 + "\n")
        
        # Try to extract JSON from the response
        try:
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end]
                result = json.loads(json_str)
            else:
                result = json.loads(response_text)
                
            return result
            
        except json.JSONDecodeError as e:
            print(f"⚠️ JSON Parse Error: {e}")
            return {
                "completeness_score": 0,
                "fields": [],
                "clarifying_questions": ["Unable to parse AI response. Please try again."],
                "suggested_tone": "professional",
                "summary": "Error: Could not parse AI response.",
                "raw_response": response_text
            }
            
    except Exception as e:
        return {
            "completeness_score": 0,
            "fields": [],
            "clarifying_questions": [f"API Error: {str(e)}"],
            "suggested_tone": "professional",
            "summary": f"Error: {str(e)}"
        }

def generate_clarification_email(analysis_result, client_name="Client", project_name="Project"):
    """Generate a professional clarification email based on the analysis."""
    questions = analysis_result.get("clarifying_questions", [])
    
    if not questions:
        return f"""Subject: Complete Brief Received for {project_name}

Hi {client_name},

Thank you for sending over the comprehensive brief for {project_name}. I've reviewed it and everything is clear and complete.

I'll start working on this immediately and will keep you updated on progress.

Best regards,
[Your Name]
[Your Title/Company]"""
    
    question_list = "\n".join([f"{i+1}. {q}" for i, q in enumerate(questions)])
    
    email_body = f"""Subject: A Few Clarifying Questions Regarding {project_name}

Hi {client_name},

Thank you for sending over the brief for {project_name}. I'm excited to get started!

After reviewing the brief, I have a few clarifying questions to ensure I fully understand your vision:

{question_list}

Once I have these details, I'll be able to provide you with a more accurate timeline and scope for the project.

Looking forward to working with you!

Best regards,
[Your Name]
[Your Title/Company]"""
    
    return email_body

def print_analysis_results(result, brief_text):
    """Pretty print the analysis results."""
    print("\n" + "="*60)
    print("📋 BRIEF ANALYSIS RESULTS")
    print("="*60)
    
    score = result.get("completeness_score", 0)
    if score >= 80:
        emoji = "🟢"
        grade = "Excellent"
    elif score >= 60:
        emoji = "🟡"
        grade = "Good"
    elif score >= 40:
        emoji = "🟠"
        grade = "Needs Work"
    else:
        emoji = "🔴"
        grade = "Needs Brief"
    
    print(f"\n{emoji} Completeness Score: {score}/100 ({grade})")
    print(f"\n📝 Summary: {result.get('summary', 'N/A')}")
    
    print("\n📊 Field Breakdown:")
    fields = result.get("fields", [])
    for field in fields:
        name = field.get("name", "Unknown")
        status = field.get("status", "unknown")
        question = field.get("question", "")
        
        if status == "present":
            icon = "✅"
        elif status == "partial":
            icon = "⚠️"
        else:
            icon = "❌"
        
        print(f"  {icon} {name}: {status.upper()}")
        if status != "present" and question:
            print(f"     → {question}")
    
    questions = result.get("clarifying_questions", [])
    if questions:
        print("\n❓ Clarifying Questions to Ask Client:")
        for i, q in enumerate(questions, 1):
            print(f"  {i}. {q}")
    else:
        print("\n✅ No clarifying questions needed. The brief is complete!")
    
    tone = result.get("suggested_tone", "professional")
    print(f"\n🗣️ Suggested Tone: {tone}")

def main():
    """Main test function."""
    
    # Test briefs
    test_briefs = [
        {
            "name": "Terrible (15-25%)",
            "client": "Sarah Chen",
            "project": "FinTech App Redesign",
            "text": """We need a redesign for our fintech app. It's called MoneyMind. Make it look modern and trustworthy. Our current app is outdated. Please send us some design concepts. We need this done as soon as possible. Budget is flexible. Just make it look good."""
        },
        {
            "name": "Poor (30-40%)",
            "client": "James O'Brien",
            "project": "Nonprofit Annual Report",
            "text": """Annual report for "Ocean Guardians" — a nonprofit focused on marine conservation. Audience is donors and grant organizations. Need to showcase impact of our 2024 programs. We saved 500 sea turtles, cleaned 200 beaches, educated 10,000 students. Design should be inspiring and data-heavy. We have some photos but need more. Budget is limited ($2,000). Deadline is end of month."""
        },
        {
            "name": "Medium (50-60%)",
            "client": "Alex Thompson",
            "project": "Explainer Video",
            "text": """Need an animated explainer video for "CloudSync" — file sharing for small businesses. Target audience: small business owners (30-55) who aren't tech-savvy. Need to explain value proposition in 60 seconds. Should show how easy it is to use, security features, team collaboration. We have a script draft but it needs work. Brand colors: blue and green. Competitors: Dropbox, Google Drive. Differentiator: military-grade encryption and simpler UX. Budget is $3,000-5,000."""
        },
        {
            "name": "Good (70-80%)",
            "client": "Jessica White",
            "project": "Website Redesign",
            "text": """We're redesigning "NutriGuide" — a nutrition education platform. Target audience is health-conscious adults 25-45. Current website feels cluttered and outdated. Need clean, modern design with improved user experience. Goals: increase newsletter signups by 40% and reduce bounce rate. We have brand guidelines (green and white, clean typography). Competitors include Healthline and WebMD but we focus on practical nutrition advice. Content is already written. Need 5-7 page design. Timeline: 8 weeks. Budget: $12,000."""
        },
        {
            "name": "Very Good (80-85%)",
            "client": "Jennifer Park",
            "project": "Full Brand Identity",
            "text": """Complete brand identity for "BloomWell" — a mental wellness app. Target audience: professionals 25-45 experiencing burnout and anxiety. We're launching in 6 months and need everything: logo suite (primary, secondary, icon), color palette, typography system, illustration style, UI kit for mobile app, social media templates, and brand guidelines. Brand personality: gentle, science-backed, supportive. Colors: soft pink, sage green, and cream. Competitors: Headspace, Calm, BetterHelp. Differentiator: personalized plans and clinical research. We have a detailed brief attached with mood boards. Budget: $15,000. Timeline: 12 weeks. We're a funded startup with a team of 8."""
        },
        {
            "name": "Excellent (90-95%)",
            "client": "Thomas Mueller",
            "project": "Quantum Robotics Pitch Deck",
            "text": """Creating a pitch deck for "Quantum Robotics" — Series A funding round ($5M). Target audience: venture capital firms and angel investors. Need 15-18 slides covering: problem, solution, market size ($50B), traction (300 customers, 200% YoY growth), team (ex-MIT, ex-Google), competitive landscape, financial projections ($10M ARR in Year 3), and use of funds. Brand guidelines attached. Tone: confident, data-driven, innovative. Competitors: Boston Dynamics, inVia Robotics. Differentiator: AI-driven learning algorithms, 40% cheaper. Deadline: 3 weeks. Budget: $7,000. Need both presentation and PDF formats."""
        }
    ]
    
    print("\n" + "🚀"*30)
    print("BRIEFFILL - ENHANCED TEST MODE")
    print("🚀"*30)
    print("\nSelect a brief to analyze:")
    print("1. Terrible Brief (should score 15-25%)")
    print("2. Poor Brief (should score 30-40%)")
    print("3. Medium Brief (should score 50-60%)")
    print("4. Good Brief (should score 70-80%)")
    print("5. Very Good Brief (should score 80-85%)")
    print("6. Excellent Brief (should score 90-95%)")
    print("7. Enter your own brief")
    
    choice = input("\nEnter choice (1-7): ").strip()
    
    if choice == "7":
        print("\nPaste your brief text below (press Enter twice when done):")
        lines = []
        while True:
            line = input()
            if line == "" and lines and lines[-1] == "":
                break
            lines.append(line)
        brief_text = "\n".join(lines).strip()
        client_name = input("Client name (optional): ").strip() or "Client"
        project_name = input("Project name (optional): ").strip() or "Project"
    else:
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(test_briefs):
                brief_data = test_briefs[idx]
                brief_text = brief_data["text"]
                client_name = brief_data["client"]
                project_name = brief_data["project"]
                print(f"\n📌 Selected: {brief_data['name']}")
            else:
                print("Invalid choice. Using first brief.")
                brief_text = test_briefs[0]["text"]
                client_name = test_briefs[0]["client"]
                project_name = test_briefs[0]["project"]
        except:
            print("Invalid choice. Using first brief.")
            brief_text = test_briefs[0]["text"]
            client_name = test_briefs[0]["client"]
            project_name = test_briefs[0]["project"]
    
    print("\n" + "⏳ Analyzing brief with enhanced AI... (this may take 5-10 seconds)")
    
    result = analyze_brief(brief_text)
    print_analysis_results(result, brief_text)
    
    print("\n" + "="*60)
    print("📧 GENERATED CLARIFICATION EMAIL")
    print("="*60)
    email = generate_clarification_email(result, client_name, project_name)
    print(email)
    
    save = input("\n\nSave results to file? (y/n): ").strip().lower()
    if save == 'y':
        filename = f"brieffill_analysis_{project_name.replace(' ', '_')}.txt"
        with open(filename, 'w') as f:
            f.write("="*60 + "\n")
            f.write("BRIEFFILL ANALYSIS RESULTS\n")
            f.write("="*60 + "\n\n")
            f.write(f"Project: {project_name}\n")
            f.write(f"Client: {client_name}\n")
            f.write(f"Completeness Score: {result.get('completeness_score', 0)}/100\n")
            f.write(f"Summary: {result.get('summary', 'N/A')}\n\n")
            f.write("Fields:\n")
            for field in result.get("fields", []):
                f.write(f"  {field.get('name')}: {field.get('status')}\n")
                if field.get('question'):
                    f.write(f"    Question: {field.get('question')}\n")
            f.write("\n" + "="*60 + "\n")
            f.write("CLARIFICATION EMAIL\n")
            f.write("="*60 + "\n\n")
            f.write(email)
        print(f"✅ Results saved to {filename}")
    
    print("\n✅ Test complete!")

if __name__ == "__main__":
    main()