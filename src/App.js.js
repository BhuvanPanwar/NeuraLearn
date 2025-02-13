import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NeuraLearnApp() {
  const [debugMode, setDebugMode] = useState(false);
  const [language, setLanguage] = useState("English");
  const [content, setContent] = useState({
    title: "NeuraLearn - AI Literacy Platform",
    description: "An interactive platform to understand AI, its risks, governance, and compliance in a user-friendly way.",
    modules: [
      "Introduction to AI & Its Applications",
      "Understanding AI Risks & Ethics",
      "AI Governance & Compliance Frameworks",
      "Best Practices for Responsible AI Development"
    ],
  });

  const toggleDebugMode = () => {
    setDebugMode(!debugMode);
  };

  const updateContent = (field, value) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardContent>
          <h1 className="text-2xl font-bold">{content.title}</h1>
          <p className="mt-2">{content.description}</p>
        </CardContent>
      </Card>
      
      <Card className="mb-6">
        <CardContent>
          <h2 className="text-xl font-semibold">Learning Modules</h2>
          <ul className="mt-2 list-disc pl-6">
            {content.modules.map((module, index) => (
              <li key={index}>{module}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button onClick={toggleDebugMode}>{debugMode ? "Exit Debug Mode" : "Enter Debug Mode"}</Button>
      </div>
      
      {debugMode && (
        <Card className="mt-6">
          <CardContent>
            <h2 className="text-xl font-semibold">Debug Mode - Update Content</h2>
            <div className="mt-4 space-y-4">
              <Input 
                placeholder="Update Title" 
                value={content.title} 
                onChange={(e) => updateContent("title", e.target.value)} 
              />
              <Textarea 
                placeholder="Update Description" 
                value={content.description} 
                onChange={(e) => updateContent("description", e.target.value)} 
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
