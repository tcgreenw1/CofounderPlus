import React, { useState, useEffect } from 'react';
import { 
  Save, 
  X, 
  Plus, 
  Trash2,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

interface BusinessMemory {
  businessId: string;
  businessName?: string;
  industry?: string;
  description?: string;
  
  // Business details
  targetMarket?: string;
  customerPersona?: string;
  valueProposition?: string;
  revenueModel?: string;
  competitors?: string[];
  
  // Goals and challenges
  shortTermGoals?: string[];
  longTermGoals?: string[];
  currentChallenges?: string[];
  
  // Progress tracking
  keyMetrics?: Record<string, any>;
  
  lastUpdated?: string;
}

interface BusinessMemoryEditorProps {
  memory: BusinessMemory;
  onSave: (updatedMemory: Partial<BusinessMemory>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function BusinessMemoryEditor({ memory, onSave, onCancel, loading = false }: BusinessMemoryEditorProps) {
  // Business details state
  const [targetMarket, setTargetMarket] = useState(memory.targetMarket || '');
  const [customerPersona, setCustomerPersona] = useState(memory.customerPersona || '');
  const [valueProposition, setValueProposition] = useState(memory.valueProposition || '');
  const [revenueModel, setRevenueModel] = useState(memory.revenueModel || '');
  
  // Competitors state
  const [competitors, setCompetitors] = useState<string[]>(memory.competitors || []);
  const [newCompetitor, setNewCompetitor] = useState('');
  
  // Goals state
  const [shortTermGoals, setShortTermGoals] = useState<string[]>(memory.shortTermGoals || []);
  const [newShortTermGoal, setNewShortTermGoal] = useState('');
  const [longTermGoals, setLongTermGoals] = useState<string[]>(memory.longTermGoals || []);
  const [newLongTermGoal, setNewLongTermGoal] = useState('');
  
  // Challenges state
  const [currentChallenges, setCurrentChallenges] = useState<string[]>(memory.currentChallenges || []);
  const [newChallenge, setNewChallenge] = useState('');

  const handleAddCompetitor = () => {
    if (newCompetitor.trim()) {
      setCompetitors([...competitors, newCompetitor.trim()]);
      setNewCompetitor('');
    }
  };

  const handleRemoveCompetitor = (index: number) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const handleAddShortTermGoal = () => {
    if (newShortTermGoal.trim()) {
      setShortTermGoals([...shortTermGoals, newShortTermGoal.trim()]);
      setNewShortTermGoal('');
    }
  };

  const handleRemoveShortTermGoal = (index: number) => {
    setShortTermGoals(shortTermGoals.filter((_, i) => i !== index));
  };

  const handleAddLongTermGoal = () => {
    if (newLongTermGoal.trim()) {
      setLongTermGoals([...longTermGoals, newLongTermGoal.trim()]);
      setNewLongTermGoal('');
    }
  };

  const handleRemoveLongTermGoal = (index: number) => {
    setLongTermGoals(longTermGoals.filter((_, i) => i !== index));
  };

  const handleAddChallenge = () => {
    if (newChallenge.trim()) {
      setCurrentChallenges([...currentChallenges, newChallenge.trim()]);
      setNewChallenge('');
    }
  };

  const handleRemoveChallenge = (index: number) => {
    setCurrentChallenges(currentChallenges.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const updatedMemory: Partial<BusinessMemory> = {
      targetMarket: targetMarket.trim() || undefined,
      customerPersona: customerPersona.trim() || undefined,
      valueProposition: valueProposition.trim() || undefined,
      revenueModel: revenueModel.trim() || undefined,
      competitors: competitors.length > 0 ? competitors : undefined,
      shortTermGoals: shortTermGoals.length > 0 ? shortTermGoals : undefined,
      longTermGoals: longTermGoals.length > 0 ? longTermGoals : undefined,
      currentChallenges: currentChallenges.length > 0 ? currentChallenges : undefined,
    };

    await onSave(updatedMemory);
  };

  return (
    <div className="space-y-6">
      {/* Business Details Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="size-5" style={{ color: 'var(--primary, #2F80FF)' }} />
            <CardTitle style={{ fontSize: 'var(--text-lg, 18px)' }}>Business Details</CardTitle>
          </div>
          <CardDescription>Core information about your business and market</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="targetMarket">Target Market</Label>
            <Textarea
              id="targetMarket"
              value={targetMarket}
              onChange={(e) => setTargetMarket(e.target.value)}
              placeholder="Describe who your business is targeting (e.g., small business owners in healthcare, millennials interested in sustainable fashion...)"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerPersona">Customer Persona</Label>
            <Textarea
              id="customerPersona"
              value={customerPersona}
              onChange={(e) => setCustomerPersona(e.target.value)}
              placeholder="Describe your ideal customer (e.g., age, income, pain points, behaviors...)"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="valueProposition">Value Proposition</Label>
            <Textarea
              id="valueProposition"
              value={valueProposition}
              onChange={(e) => setValueProposition(e.target.value)}
              placeholder="What makes your business unique? What problem do you solve?"
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="revenueModel">Revenue Model</Label>
            <Textarea
              id="revenueModel"
              value={revenueModel}
              onChange={(e) => setRevenueModel(e.target.value)}
              placeholder="How does your business make money? (e.g., subscription, one-time sales, advertising...)"
              rows={2}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Competitors Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5" style={{ color: 'var(--primary, #2F80FF)' }} />
            <CardTitle style={{ fontSize: 'var(--text-lg, 18px)' }}>Competitors</CardTitle>
          </div>
          <CardDescription>Companies or products competing in your space</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCompetitor();
                }
              }}
              placeholder="Enter competitor name..."
            />
            <Button onClick={handleAddCompetitor} type="button">
              <Plus className="size-4 mr-2" />
              Add
            </Button>
          </div>

          {competitors.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {competitors.map((competitor, idx) => (
                <Badge key={idx} variant="outline" className="flex items-center gap-2">
                  {competitor}
                  <button
                    onClick={() => handleRemoveCompetitor(idx)}
                    className="hover:text-red-600"
                    type="button"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goals Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="size-5" style={{ color: 'var(--primary, #2F80FF)' }} />
            <CardTitle style={{ fontSize: 'var(--text-lg, 18px)' }}>Goals</CardTitle>
          </div>
          <CardDescription>What you want to achieve in the short and long term</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Short-term Goals */}
          <div className="space-y-3">
            <Label style={{ fontSize: 'var(--text-sm, 14px)', fontWeight: 'var(--font-semibold, 600)' }}>
              Short-term Goals (3-6 months)
            </Label>
            <div className="flex gap-2">
              <Input
                value={newShortTermGoal}
                onChange={(e) => setNewShortTermGoal(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddShortTermGoal();
                  }
                }}
                placeholder="Enter a short-term goal..."
              />
              <Button onClick={handleAddShortTermGoal} type="button">
                <Plus className="size-4 mr-2" />
                Add
              </Button>
            </div>
            {shortTermGoals.length > 0 && (
              <ul className="space-y-2">
                {shortTermGoals.map((goal, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start justify-between gap-2 rounded-lg p-3"
                    style={{ background: 'var(--muted, rgba(241, 245, 249, 0.8))', border: '1px solid var(--border, #e2e8f0)' }}
                  >
                    <span style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--foreground, #1e293b)' }}>
                      {goal}
                    </span>
                    <button
                      onClick={() => handleRemoveShortTermGoal(idx)}
                      className="hover:text-red-600 flex-shrink-0"
                      type="button"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Long-term Goals */}
          <div className="space-y-3">
            <Label style={{ fontSize: 'var(--text-sm, 14px)', fontWeight: 'var(--font-semibold, 600)' }}>
              Long-term Goals (1-3 years)
            </Label>
            <div className="flex gap-2">
              <Input
                value={newLongTermGoal}
                onChange={(e) => setNewLongTermGoal(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddLongTermGoal();
                  }
                }}
                placeholder="Enter a long-term goal..."
              />
              <Button onClick={handleAddLongTermGoal} type="button">
                <Plus className="size-4 mr-2" />
                Add
              </Button>
            </div>
            {longTermGoals.length > 0 && (
              <ul className="space-y-2">
                {longTermGoals.map((goal, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start justify-between gap-2 rounded-lg p-3"
                    style={{ background: 'var(--muted, rgba(241, 245, 249, 0.8))', border: '1px solid var(--border, #e2e8f0)' }}
                  >
                    <span style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--foreground, #1e293b)' }}>
                      {goal}
                    </span>
                    <button
                      onClick={() => handleRemoveLongTermGoal(idx)}
                      className="hover:text-red-600 flex-shrink-0"
                      type="button"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Challenges Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="size-5" style={{ color: 'var(--warning, #f59e0b)' }} />
            <CardTitle style={{ fontSize: 'var(--text-lg, 18px)' }}>Current Challenges</CardTitle>
          </div>
          <CardDescription>Obstacles or problems your business is facing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={newChallenge}
              onChange={(e) => setNewChallenge(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddChallenge();
                }
              }}
              placeholder="Enter a current challenge..."
            />
            <Button onClick={handleAddChallenge} type="button">
              <Plus className="size-4 mr-2" />
              Add
            </Button>
          </div>
          {currentChallenges.length > 0 && (
            <ul className="space-y-2">
              {currentChallenges.map((challenge, idx) => (
                <li 
                  key={idx} 
                  className="flex items-start justify-between gap-2 rounded-lg p-3"
                  style={{ background: 'var(--muted, rgba(241, 245, 249, 0.8))', border: '1px solid var(--border, #e2e8f0)' }}
                >
                  <span style={{ fontSize: 'var(--text-sm, 14px)', color: 'var(--foreground, #1e293b)' }}>
                    {challenge}
                  </span>
                  <button
                    onClick={() => handleRemoveChallenge(idx)}
                    className="hover:text-red-600 flex-shrink-0"
                    type="button"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end sticky bottom-0 bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 -mx-4 -mb-4">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          <X className="size-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
        >
          <Save className="size-4 mr-2" />
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
