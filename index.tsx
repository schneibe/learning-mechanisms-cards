import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

const mechanisms = [
    { "name": "Glassboxing", "sourceLabel": "Blikstein" },
    { "name": "Restructuration", "sourceLabel": "Wilensky" },
    { "name": "Cultural Forms", "sourceLabel": "Horn" },
    { "name": "Contrasting Cases", "sourceLabel": "Schwartz" },
    { "name": "Scaffolding", "sourceLabel": "Wood, Bruner, & Ross (1976)" },
    { "name": "Self-explanation", "sourceLabel": "Chi" },
    { "name": "Activate Prior Knowledge", "sourceLabel": "Ausubel (1968)" },
    { "name": "Foster Cognitive Conflict", "sourceLabel": "Piaget" },
    { "name": "Promote Sensemaking", "sourceLabel": "(Duschl, Schweingruber & Shouse, 2007)" },
    { "name": "Concreteness fading", "sourceLabel": "Fyfe, McNeil, Son, & Goldstone (2014)" },
    { "name": "Worked Examples", "sourceLabel": "Sweller & Cooper (1985)" },
    { "name": "Analogical Reasoning", "sourceLabel": "Gentner, D. (1983)" },
    { "name": "Inquiry Cycles", "sourceLabel": "(Kolodner et al., 2003; Linn, Davis & Bell, 2004)." },
    { "name": "Make the invisible visible", "sourceLabel": "diSessa, A. A. (1993)" },
    { "name": "Learning-by-Making", "sourceLabel": "Papert" },
    { "name": "Microworlds", "sourceLabel": "Papert" },
    { "name": "Debugging", "sourceLabel": "Papert" },
    { "name": "Tangible Thinking", "sourceLabel": "Papert; Resnick" },
    { "name": "Low Floor, High Ceiling", "sourceLabel": "Resnick" },
    { "name": "Computational Thinking", "sourceLabel": "Papert & Wing" },
    { "name": "Complementary", "sourceLabel": "Ainsworth" },
    { "name": "Constraining Interpretation", "sourceLabel": "Ainsworth" },
    { "name": "Deeper Understanding", "sourceLabel": "Ainsworth" },
    { "name": "Explicit Purpose", "sourceLabel": "Ainsworth" },
    { "name": "Appropriateness", "sourceLabel": "Ainsworth" },
    { "name": "Availability", "sourceLabel": "Ainsworth" },
    { "name": "Translation", "sourceLabel": "Ainsworth" },
    { "name": "Sequence", "sourceLabel": "Ainsworth" },
    { "name": "Self-Explanation", "sourceLabel": "Ainsworth" },
    { "name": "Coherence", "sourceLabel": "Ainsworth" },
    { "name": "Interactivity", "sourceLabel": "Ainsworth" },
    { "name": "Feedback", "sourceLabel": "Ainsworth" },
    { "name": "Deliberate Practice", "sourceLabel": "Ericsson" },
    { "name": "Feedback", "sourceLabel": "Ericsson, Krampe & Teschmer" },
    { "name": "Mental Representation", "sourceLabel": "Ericsson & Smith" },
    { "name": "Progressive Challenge", "sourceLabel": "Ericsson" },
    { "name": "Error Correction", "sourceLabel": "Ericsson; Chi" },
    { "name": "Transfer", "sourceLabel": "Ericsson; Barnett & Ceci" },
    { "name": "Embodied Cognition", "sourceLabel": "Lakoff & Johnson; Barsalou" },
    { "name": "Narrative Coherence", "sourceLabel": "Bruner; Schank" },
    { "name": "Feedback Loops", "sourceLabel": "Cybernetics: Wiener; Hattie" },
    { "name": "Boundary Object", "sourceLabel": "Star & Griesemer; Engestrom" },
    { "name": "Affordance", "sourceLabel": "Norman; Gibson" },
    { "name": "Analogical Transfer", "sourceLabel": "Gentner" },
    { "name": "Story-Driven Design Principle", "sourceLabel": "Bruner, 1990" },
    { "name": "Tinker-to-Learn Principle", "sourceLabel": "Resnick, 2017; Papert, 1993" },
    { "name": "Transparency Principle", "sourceLabel": "Blikstein & Worsley, 2016" },
    { "name": "Public Artifacts", "sourceLabel": "Papert & Harel" },
    { "name": "Iterative Design", "sourceLabel": "Resnick & Rosenbaum" },
    { "name": "Collaboration", "sourceLabel": "Harel & Papert" },
    { "name": "Reflection", "sourceLabel": "Harel & Kafai" },
    { "name": "Empowerment", "sourceLabel": "Papert" },
    { "name": "Community of Makers", "sourceLabel": "Resnick & Kafai" },
    { "name": "Self-Monitoring", "sourceLabel": "Ericsson; Zimmerman" },
    { "name": "Reflective Practice", "sourceLabel": "Schoen; Ericsson" },
    { "name": "Reflection-in-Action Principle", "sourceLabel": "Schoen, 1983" },
    { "name": "Personal Meaning", "sourceLabel": "Papert" },
    { "name": "Playful Learning", "sourceLabel": "Resnick" },
    { "name": "Situated Construction", "sourceLabel": "Papert; Kafai" },
    { "name": "Persistence", "sourceLabel": "Ericsson; Deci & Ryan" },
    { "name": "Flow", "sourceLabel": "Csikszentmihalyi" },
    { "name": "Design for Curiosity", "sourceLabel": "Loewenstein; Berlyne" },
    { "name": "Resonance", "sourceLabel": "hooks; Palmer" },
    { "name": "Agency and Voice", "sourceLabel": "Freire; hooks; Resnick" },
    { "name": "Safe-to-Fail Principle", "sourceLabel": "Edmondson, 1999; Resnick, 2017" },
    { "name": "Agency and Ownership Principle", "sourceLabel": "Freire, 1970; hooks, 1994" }
];

const experienceTypes = [
  { value: 'any', label: 'Any Kind of Experience' },
  { value: 'physical', label: 'An Experience with Physical Artifacts' },
  { value: 'digital', label: 'A Digital Simulation' },
  { value: 'collaborative', label: 'A Collaborative Project' },
  { value: 'self-paced', label: 'A Self-Paced Exploration' },
  { value: 'workshop', label: 'An Instructor-Led Workshop' },
];

const ageGroups = [
  { value: 'any', label: 'Any Age Group' },
  { value: 'preschool', label: 'Preschool (3-5 years)' },
  { value: 'elementary', label: 'Elementary School (6-10 years)' },
  { value: 'middle_school', label: 'Middle School (11-13 years)' },
  { value: 'high_school', label: 'High School (14-18 years)' },
  { value: 'higher_education', label: 'Higher Education' },
  { value: 'adult', label: 'Adult Learners' },
];

const getMechanismId = (mechanism) => `${mechanism.name}-${mechanism.sourceLabel}`;

const App = () => {
  const [currentIdea, setCurrentIdea] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [experienceType, setExperienceType] = useState('any');
  const [ageGroup, setAgeGroup] = useState('any');
  const [usedMechanisms, setUsedMechanisms] = useState(new Set());
  const [lastShownMechanismId, setLastShownMechanismId] = useState(null);

  const generateIdea = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCurrentIdea(null);
    try {
      // 1. All mechanisms are available
      let availableMechanisms = mechanisms;
      
      // 2. Exclude recently used mechanisms
      let potentialMechanisms = availableMechanisms.filter(m => !usedMechanisms.has(getMechanismId(m)));

      // 3. If all mechanisms have been used, reset the used set
      if (potentialMechanisms.length === 0) {
        setUsedMechanisms(new Set());
        potentialMechanisms = availableMechanisms; // Allow reuse
      }
      
      // 4. Exclude the very last shown mechanism if there are other options
      if (potentialMechanisms.length > 1 && lastShownMechanismId) {
        potentialMechanisms = potentialMechanisms.filter(m => getMechanismId(m) !== lastShownMechanismId);
      }

      if (potentialMechanisms.length === 0) {
        setError("No learning mechanisms available.");
        setIsLoading(false);
        return;
      }

      // 5. Select a random mechanism
      const selectedMechanism = potentialMechanisms[Math.floor(Math.random() * potentialMechanisms.length)];
      const selectedMechanismId = getMechanismId(selectedMechanism);
      setUsedMechanisms(prev => new Set(prev).add(selectedMechanismId));
      setLastShownMechanismId(selectedMechanismId);


      // 6. Use AI to generate contextual content
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const selectedExperience = experienceTypes.find(e => e.value === experienceType)?.label || 'any kind of learning experience';
      const selectedAgeGroup = ageGroups.find(a => a.value === ageGroup)?.label || 'any age group';
      
      const prompt = `You are an expert in learning design. I will provide a learning mechanism. Your task is to define it and then contextualize it for a specific audience and experience, keeping your answers concise and to the point. Please use relevant emojis throughout your response to make it more engaging.

      Learning Mechanism: "${selectedMechanism.name}" (from ${selectedMechanism.sourceLabel})
      
      Context:
      - Target Audience: ${selectedAgeGroup}
      - Desired Experience: ${selectedExperience}
      
      Requirements (be very brief):
      1. **Description:** A concise, one-sentence definition of the learning mechanism.
      2. **Creative Example:** Write a short, creative example (2-3 sentences maximum).
      3. **Implementation Tips:** Offer 2-3 brief, bulleted tips for implementing this mechanism.
      4. **Tradeoffs:** Detail the pros, cons, and best-fit scenarios in 2-3 concise bullet points.
      
      Return the response as a single JSON object. Use '*' for bullet points in tips and tradeoffs.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: {
                type: Type.STRING,
                description: "A concise, one-sentence definition of the learning mechanism."
              },
              example: {
                type: Type.STRING,
                description: "A creative and concrete example of the mechanism in a learning scenario."
              },
              tips: {
                type: Type.STRING,
                description: "A few bullet points of practical tips for implementation. Use '*' for bullet points."
              },
              tradeoffs: {
                type: Type.STRING,
                description: "The pros, cons, and best-fit scenarios for this mechanism. Use '*' for bullet points."
              }
            },
            required: ["description", "example", "tips", "tradeoffs"],
          },
        },
      });

      const generatedData = JSON.parse(response.text.trim());
      
      const idea = {
        title: selectedMechanism.name,
        sourceLabel: selectedMechanism.sourceLabel,
        ...generatedData
      };
      
      setCurrentIdea(idea);

    } catch (err) {
      console.error(err);
      setError("Sorry, I couldn't spark an idea right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [experienceType, ageGroup, usedMechanisms, lastShownMechanismId]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="card-container">
            <div className="card loading-container">
                <div className="loader"></div>
                <p>Retrieving learning theory... 🧐</p>
            </div>
            <div className="card loading-container">
                 <div className="loader"></div>
                 <p>Brewing up examples... 🧪</p>
            </div>
            <div className="card loading-container">
                 <div className="loader"></div>
                 <p>Considering tradeoffs... 🤔</p>
            </div>
             <div className="card loading-container">
                 <div className="loader"></div>
                 <p>Finalizing the idea... 🎉</p>
            </div>
        </div>
      );
    }
    
    if (error) {
       return <p className="error-message">{error}</p>
    }

    if (currentIdea) {
      return (
        <div className="card-container">
          <div className="card">
            <h2>{currentIdea.title}</h2>
            <p>{currentIdea.description}</p>
            <p className="source-label">
               From the work of {currentIdea.sourceLabel}
            </p>
          </div>
          <div className="card">
            <h3>🎨 Creative Example</h3>
            <p>{currentIdea.example}</p>
          </div>
          <div className="card">
            <h3>📝 Implementation Tips</h3>
            <ul>
              {currentIdea.tips.split('*').filter(tip => tip.trim()).map((tip, index) => (
                <li key={index}>{tip.trim()}</li>
              ))}
            </ul>
          </div>
          <div className="card">
             <h3>⚖️ Tradeoffs</h3>
             <ul>
              {currentIdea.tradeoffs.split('*').filter(t => t.trim()).map((t, index) => (
                <li key={index}>{t.trim()}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    
    return (
        <div className="initial-message">
            <p>Ready to design an amazing learning experience? 🚀</p>
            <p>Select your criteria above and click "Spark a new idea" to begin! 👇</p>
        </div>
    );
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>🧠 Learning Mechanism Idea Generator</h1>
        <p>Spark your next great learning experience with a little help from Gemini. ✨</p>
      </header>
      <main>
        <div className="controls-container">
           <div className="control-group">
            <label htmlFor="age-group">For learners who are... 🧑‍🎓</label>
            <select id="age-group" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} disabled={isLoading}>
              {ageGroups.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div className="control-group">
            <label htmlFor="experience-type">I want to design... 🎨</label>
            <select id="experience-type" value={experienceType} onChange={(e) => setExperienceType(e.target.value)} disabled={isLoading}>
              {experienceTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
        </div>
        
        <div className="button-container">
            <button className="generate-button" onClick={generateIdea} disabled={isLoading}>
              {isLoading ? 'Sparking... ⏳' : 'Spark a new idea ✨'}
            </button>
        </div>

        {renderContent()}
      </main>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);