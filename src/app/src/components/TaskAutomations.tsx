import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  Video, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  FileText, 
  PlayCircle,
  Zap,
  Loader2
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';

export const TaskAutomations = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('new');

  // Mock projects data
  const projects = [
    {
      id: '1',
      title: 'Document Verification for Accountants',
      description: 'Comparing and verifying documents with AI image processing',
      status: 'in_progress',
      progress: 65,
      type: 'Custom Automation',
      lastUpdated: '2 hours ago',
      nextStep: 'Finalizing AI model training',
    }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Task Automations</h1>
        <p className="text-muted-foreground text-lg">
          Automate your repetitive tasks with custom AI solutions.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="new">New Automation</TabsTrigger>
          <TabsTrigger value="projects">My Projects</TabsTrigger>
        </TabsList>

        {/* New Automation Tab */}
        <TabsContent value="new" className="mt-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Option 1: Live Setup Call */}
            <Card className="relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Bot className="w-32 h-32 text-primary" />
              </div>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Video className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Live Setup Call</CardTitle>
                <CardDescription className="text-base">
                  Book a 1-on-1 session to spec out your automation needs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Deep dive into your workflow
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Immediate feasibility assessment
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Custom roadmap creation
                  </li>
                </ul>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  60 minutes
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={() => navigate('/book-task-automation')}
                >
                  Book Setup Call
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>

            {/* Option 2: Async Video Instructions */}
            <Card className="relative overflow-hidden border-2 hover:border-blue-500/50 transition-all duration-300 group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-32 h-32 text-blue-500" />
              </div>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4">
                  <PlayCircle className="w-6 h-6 text-blue-500" />
                </div>
                <CardTitle className="text-xl">Async Video Request</CardTitle>
                <CardDescription className="text-base">
                  Record a video explaining your task and we'll build it.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Record at your convenience
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Clear step-by-step instructions
                  </li>
                  <li className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Review proposal within 24h
                  </li>
                </ul>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="w-4 h-4" />
                  ~5-10 min recording
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white" 
                  size="lg"
                  onClick={() => {
                    // For now, maybe open a loom link or a form. 
                    // Since specific implementation wasn't detailed, let's just show a toast or link to a placeholder
                    // User said "pay one time to send a video". Maybe link to a payment page first?
                    // Let's assume we reuse the booking flow but with a query param or a different page eventually.
                    // For now, let's link to the same setup page but maybe we can pass state.
                    // Actually user said "pay one time right there... to send a video".
                    // I'll leave this as a "Coming Soon" or link to a simple form.
                    // Let's just alert for now as I don't have a specific flow for this yet.
                    alert("Async Video Flow coming soon! Please use the Live Setup Call for now.");
                  }}
                >
                  Start Video Request
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* My Projects Tab */}
        <TabsContent value="projects" className="mt-6">
          <div className="space-y-4">
            {projects.map((project) => (
              <Card key={project.id} className="overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">{project.title}</h3>
                        <Badge variant={
                          project.status === 'in_progress' ? 'default' : 
                          project.status === 'completed' ? 'success' : 'secondary'
                        }>
                          {project.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{project.description}</p>
                    </div>
                    <Button variant="outline" className="shrink-0">
                      View Details
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    
                    <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t mt-4">
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Type</span>
                        <span className="font-medium flex items-center gap-2">
                          <Bot className="w-4 h-4 text-primary" />
                          {project.type}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Last Updated</span>
                        <span className="font-medium">{project.lastUpdated}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">Next Step</span>
                        <span className="font-medium text-primary">{project.nextStep}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TaskAutomations;
