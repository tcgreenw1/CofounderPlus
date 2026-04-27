import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { MapPin, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';
import { useIsMobile } from './ui/use-mobile';

interface DepartmentTask {
  id: string;
  title: string;
  department: string;
  completed: boolean;
}

interface RoadmapProgressWidgetProps {
  businessId: string;
}

export const RoadmapProgressWidget: React.FC<RoadmapProgressWidgetProps> = ({ businessId }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [roadmapData, setRoadmapData] = useState<{
    incompleteTasks: DepartmentTask[];
    progress: number;
    completedCount: number;
    totalCount: number;
  }>({
    incompleteTasks: [],
    progress: 0,
    completedCount: 0,
    totalCount: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRoadmapProgress = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token || !businessId) return;

        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-373d8b09/roadmap/${businessId}/progress`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.ok) {
          const data = await response.json();
          
          // Extract incomplete tasks grouped by department
          const allTasks = data.tasks || [];
          const incomplete = allTasks.filter((t: DepartmentTask) => !t.completed);
          const completedCount = allTasks.filter((t: DepartmentTask) => t.completed).length;
          const totalCount = allTasks.length;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          setRoadmapData({
            incompleteTasks: incomplete.slice(0, 5), // Show first 5 incomplete tasks
            progress,
            completedCount,
            totalCount
          });
        }
      } catch (error) {
        console.error('Error loading roadmap progress:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoadmapProgress();
  }, [businessId]);

  // Group incomplete tasks by department
  const tasksByDepartment = roadmapData.incompleteTasks.reduce((acc, task) => {
    if (!acc[task.department]) {
      acc[task.department] = [];
    }
    acc[task.department].push(task);
    return acc;
  }, {} as Record<string, DepartmentTask[]>);

  return (
    <Card
      style={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden'
      }}
    >
      <CardHeader>
        <CardTitle 
          className="flex items-center gap-2"
          style={{ color: 'var(--foreground)' }}
        >
          <MapPin 
            className="w-5 h-5"
            style={{ color: 'var(--accent)' }}
          />
          Roadmap Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div 
            className="text-center py-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Loading roadmap...
          </div>
        ) : roadmapData.incompleteTasks.length === 0 && roadmapData.totalCount === 0 ? (
          <div 
            className="text-center py-4"
            style={{ color: 'var(--muted-foreground)' }}
          >
            <p className="mb-3">No roadmap data available.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/roadmap')}
              style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
            >
              View Roadmap
            </Button>
          </div>
        ) : (
          <>
            {/* Overall Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span 
                  className="font-medium"
                  style={{ 
                    color: 'var(--foreground)',
                    fontSize: '0.875rem'
                  }}
                >
                  Overall Progress
                </span>
                <span 
                  className="font-semibold"
                  style={{ 
                    color: 'var(--primary)',
                    fontSize: '0.875rem'
                  }}
                >
                  {roadmapData.completedCount} / {roadmapData.totalCount}
                </span>
              </div>
              <Progress 
                value={roadmapData.progress} 
                className="h-2"
                style={{
                  backgroundColor: 'var(--muted)'
                }}
              />
              <div 
                className="text-center mt-1"
                style={{ 
                  color: 'var(--muted-foreground)',
                  fontSize: '0.75rem'
                }}
              >
                {roadmapData.progress}% Complete
              </div>
            </div>

            {/* Incomplete Tasks by Department */}
            {roadmapData.incompleteTasks.length > 0 ? (
              <>
                <div 
                  className="text-xs font-medium mb-3"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  INCOMPLETE TASKS TO DO
                </div>
                <div className="space-y-3 mb-4">
                  {Object.entries(tasksByDepartment).map(([department, tasks]) => (
                    <div key={department}>
                      <div 
                        className="text-xs font-semibold mb-1.5 uppercase"
                        style={{ color: 'var(--primary)' }}
                      >
                        {department}
                      </div>
                      <div className="space-y-1.5">
                        {tasks.map((task) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-start gap-2 p-2 rounded"
                            style={{
                              backgroundColor: 'var(--muted)'
                            }}
                          >
                            <Circle 
                              className="w-4 h-4 flex-shrink-0 mt-0.5"
                              style={{ color: 'var(--muted-foreground)' }}
                            />
                            <span
                              className="flex-1 text-sm"
                              style={{
                                color: 'var(--foreground)'
                              }}
                            >
                              {task.title}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div 
                className="mb-4 p-3 rounded-lg text-center"
                style={{
                  backgroundColor: 'var(--success-soft)',
                  color: 'var(--success)'
                }}
              >
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">All tasks complete!</div>
                <div className="text-sm opacity-80">Great work!</div>
              </div>
            )}

            {/* View Full Roadmap Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => navigate('/roadmap')}
              style={{
                borderColor: 'var(--border)',
                color: 'var(--foreground)'
              }}
            >
              View Full Roadmap
              <ArrowRight className="w-4 h-4" />
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};
