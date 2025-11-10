import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

const ageGroups = [
  { value: 'any', label: 'Any Age Group' },
  { value: 'preschool', label: 'Preschool (3-5 years)' },
  { value: 'elementary', label: 'Elementary School (6-10 years)' },
  { value: 'middle_school', label: 'Middle School (11-13 years)' },
  { value: 'high_school', label: 'High School (14-18 years)' },
  { value: 'higher_education', label: 'Higher Education' },
  { value: 'adult', label: 'Adult Learners' },
];

const mechanismTypes = [
  { value: 'any', label: 'Any Type' },
  { value: 'Conceptual', label: 'Conceptual' },
  { value: 'Motivation', label: 'Motivational' },
  { value: 'Meta cognition', label: 'Metacognitive' },
];

const getMechanismId = (mechanism) => `${mechanism.name}-${mechanism.sourceLabel}`;

const App = () => {
  const [mechanisms, setMechanisms] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [currentIdea, setCurrentIdea] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ageGroup, setAgeGroup] = useState('any');
  const [mechanismType, setMechanismType] = useState('any');
  const [learningGoals, setLearningGoals] = useState('');
  const [usedMechanisms, setUsedMechanisms] = useState(new Set());
  const [lastShownMechanismId, setLastShownMechanismId] = useState(null);

  useEffect(() => {
    const parseCSV = (text) => {
        const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
        const lines = text.trim().split('\n');
        const headerLine = lines.shift();
        const headers = headerLine.split(',').map(h => h.trim());
        const titleIndex = headers.indexOf('Title');
        const typeIndex = headers.indexOf('Type');
        const descriptionIndex = headers.indexOf('Description');
        const referenceIndex = headers.indexOf('Reference');

        if (titleIndex === -1 || typeIndex === -1 || descriptionIndex === -1 || referenceIndex === -1) {
            console.error("CSV headers are missing or incorrect.");
            return [];
        }

        return lines.map(line => {
            const values = line.split(regex);
            const cleanValue = (str) => {
                if (!str) return '';
                return str.trim().replace(/^"|"$/g, '').trim();
            };

            const mechanism = {
                name: cleanValue(values[titleIndex]),
                type: cleanValue(values[typeIndex]),
                description: cleanValue(values[descriptionIndex]),
                sourceLabel: cleanValue(values[referenceIndex]),
            };
            return mechanism;
        }).filter(m => m.name && m.description);
    };

    fetch('/Design_principles_vibe_website_expanded.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(csvText => {
            const parsedData = parseCSV(csvText);
            setMechanisms(parsedData);
            setIsDataLoading(false);
        })
        .catch(error => {
            console.error('Failed to load learning mechanisms:', error);
            setError('Could not load learning mechanisms. Please refresh the page.');
            setIsDataLoading(false);
        });
  }, []);

  const generateIdea = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCurrentIdea(null);
    try {
      if (!mechanisms || mechanisms.length === 0) {
        setError("Learning mechanisms are not loaded.");
        setIsLoading(false);
        return;
      }

      let availableMechanisms = mechanisms;
      if (mechanismType !== 'any') {
        availableMechanisms = mechanisms.filter(m => m.type === mechanismType);
      }

      if (availableMechanisms.length === 0) {
        setError(`Sorry, no mechanisms found for the "${mechanismType}" type. Please select another.`);
        setIsLoading(false);
        return;
      }

      let potentialMechanisms = availableMechanisms.filter(m => !usedMechanisms.has(getMechanismId(m)));

      if (potentialMechanisms.length === 0) {
        // All mechanisms of this type have been seen. For simplicity, reset all used mechanisms.
        setUsedMechanisms(new Set());
        potentialMechanisms = availableMechanisms;
      }
      
      if (potentialMechanisms.length > 1 && lastShownMechanismId) {
        potentialMechanisms = potentialMechanisms.filter(m => getMechanismId(m) !== lastShownMechanismId);
      }

      const selectedMechanism = potentialMechanisms[Math.floor(Math.random() * potentialMechanisms.length)];
      const selectedMechanismId = getMechanismId(selectedMechanism);
      setUsedMechanisms(prev => new Set(prev).add(selectedMechanismId));
      setLastShownMechanismId(selectedMechanismId);

      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const selectedExperience = 'any kind of learning experience';
      const selectedAgeGroup = ageGroups.find(a => a.value === ageGroup)?.label || 'any age group';
      const learningGoalContext = learningGoals.trim() ? `\n- Learning Goal: ${learningGoals.trim()}` : '';
      
      const prompt = `You are an expert in learning design, skilled at making complex theories accessible. I will provide a learning mechanism, its definition, and its source. Your task is to generate additional, user-friendly content for it, contextualized for a specific audience and experience. Please use relevant emojis to make the response engaging.

      Learning Mechanism: "${selectedMechanism.name}" (from ${selectedMechanism.sourceLabel})
      Definition: "${selectedMechanism.description}"
      
      Context:
      - Target Audience: ${selectedAgeGroup}
      - Desired Experience: ${selectedExperience}${learningGoalContext}
      
      Requirements (be very brief):
      1. **Accessible Description:** In 1-2 sentences, explain the mechanism in a simple, friendly way as if to a beginner.
      2. **Simple Example:** Write a short, creative example (3-4 sentences maximum) for the desired experience and audience described above. If a learning goal is provided, the example MUST be tailored to it.
      3. **Implementation Tips:** Offer 3-4 clear, actionable bullet points on how to implement this. Use '*' for bullet points.
      4. **Tradeoffs:** Detail the pros and cons in 2-3 concise bullet points using '*'. After the bullet points, add a new line starting with "Best for:" followed by a short sentence describing the best-fit scenario.
      5. **Search Query:** Provide a concise search query suitable for Google Scholar to find academic papers about this mechanism and reference.
      
      Return the response as a single JSON object.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              accessibleDescription: {
                type: Type.STRING,
                description: "A 1-2 sentence, friendly explanation of the mechanism."
              },
              example: {
                type: Type.STRING,
                description: "A simple, concrete example of the mechanism in a learning scenario (3-4 sentences max)."
              },
              tips: {
                type: Type.STRING,
                description: "3-4 bullet points of practical tips for implementation. Use '*' for bullet points."
              },
              tradeoffs: {
                type: Type.STRING,
                description: "Pros and cons as bullet points using '*', followed by a new line starting with 'Best for:' and the best-fit scenario."
              },
              searchQuery: {
                type: Type.STRING,
                description: "A concise and effective search query for Google Scholar based on the reference."
              }
            },
            required: ["accessibleDescription", "example", "tips", "tradeoffs", "searchQuery"],
          },
        },
      });

      const generatedData = JSON.parse(response.text.trim());
      const [prosCons, bestFit] = generatedData.tradeoffs.split('Best for:');
      const learnMoreLink = `https://scholar.google.com/scholar?q=${encodeURIComponent(generatedData.searchQuery)}`;
      
      const idea = {
        title: selectedMechanism.name,
        sourceLabel: selectedMechanism.sourceLabel,
        description: selectedMechanism.description,
        accessibleDescription: generatedData.accessibleDescription,
        example: generatedData.example,
        tips: generatedData.tips,
        tradeoffs: {
          prosCons: prosCons || '',
          bestFit: bestFit || 'N/A'
        },
        learnMoreLink
      };
      
      setCurrentIdea(idea);

    } catch (err) {
      console.error(err);
      setError("Sorry, I couldn't spark an idea right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [ageGroup, learningGoals, usedMechanisms, lastShownMechanismId, mechanisms, mechanismType]);

  const ExternalLinkIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="1em" 
        height="1em" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ marginLeft: '4px', verticalAlign: 'text-bottom' }}>
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
        <polyline points="15 3 21 3 21 9"></polyline>
        <line x1="10" y1="14" x2="21" y2="3"></line>
    </svg>
  );

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
            <p><strong>In other words:</strong> {currentIdea.accessibleDescription}</p>
            <p className="source-label">
               From the work of {currentIdea.sourceLabel}
               <br />
               <a href={currentIdea.learnMoreLink} target="_blank" rel="noopener noreferrer">Learn more<ExternalLinkIcon/></a>
            </p>
          </div>
          <div className="card">
            <h3>🎨 Simple Example</h3>
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
              {currentIdea.tradeoffs.prosCons.split('*').filter(t => t.trim()).map((t, index) => (
                <li key={index}>{t.trim()}</li>
              ))}
            </ul>
            <p className="best-fit"><strong>Best for:</strong> {currentIdea.tradeoffs.bestFit.trim()}</p>
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
  
  if (isDataLoading) {
    return (
      <div className="app-container" style={{ textAlign: 'center', paddingTop: '5rem' }}>
        <div className="loader"></div>
        <p style={{ marginTop: '1rem', color: '#102a43', fontSize: '1.1rem' }}>Loading learning design principles...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <h1>🧠 Learning Mechanism Idea Generator</h1>
        <p>Spark your next great learning experience with a little help from Gemini. ✨</p>
      </header>
      <main>
        <div className="controls-container">
          <div className="control-group">
            <label htmlFor="mechanism-type">Show me a mechanism that is... ⚙️</label>
            <select id="mechanism-type" value={mechanismType} onChange={(e) => setMechanismType(e.target.value)} disabled={isLoading}>
              {mechanismTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
           <div className="control-group">
            <label htmlFor="age-group">For learners who are... 🧑‍🎓</label>
            <select id="age-group" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} disabled={isLoading}>
              {ageGroups.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
           <div className="control-group">
            <label htmlFor="learning-goals">With the learning goal of... (optional) 🌱</label>
            <input 
              type="text" 
              id="learning-goals" 
              placeholder="e.g., understanding photosynthesis"
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>
        <div className="button-container">
            <button className="generate-button" onClick={generateIdea} disabled={isLoading}>
                Spark a new idea ✨
            </button>
        </div>
        {renderContent()}
      </main>
      <footer className="footer">
        <p>Powered by the Google Gemini API</p>
      </footer>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);