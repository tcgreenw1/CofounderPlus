import React from 'react';
import { X, CheckCircle, Unlock, AlertCircle, Sparkles, DollarSign } from 'lucide-react';

interface RoadmapAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: {
    readyForNextStage: boolean;
    autoCompletedCount: number;
    newTasksUnlocked: number;
    totalAlteredTasks: number;
    currentStageName: string;
    nextStageName?: string;
    progressInsights?: string;
    autoCompletedTasks?: Array<{
      departmentName: string;
      taskTitle: string;
      reason: string;
    }>;
    unlockedTasks?: Array<{
      departmentName: string;
      taskTitle: string;
      reason: string;
    }>;
    departmentHealth?: Array<{
      name: string;
      health: string;
      reason: string;
    }>;
  };
}

export function RoadmapAssessmentModal({ isOpen, onClose, assessment }: RoadmapAssessmentModalProps) {
  if (!isOpen) return null;

  const creditCost = assessment.totalAlteredTasks * 5;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="w-full max-w-2xl max-h-[85vh] overflow-y-auto pointer-events-auto"
          style={{
            backgroundColor: 'var(--card, #ffffff)',
            borderRadius: 'var(--radius-lg, 16px)',
            border: '1px solid var(--border, rgba(226, 232, 240, 0.6))',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.05)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="sticky top-0 px-6 py-4 flex items-start justify-between"
            style={{
              backgroundColor: 'var(--card, #ffffff)',
              borderBottom: '1px solid var(--border, rgba(226, 232, 240, 0.6))',
              zIndex: 10,
            }}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-5" style={{ color: 'var(--primary, #2F80FF)' }} />
                <h2
                  style={{
                    color: 'var(--foreground, #0f172a)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {assessment.readyForNextStage ? '🎉 Ready for Next Stage!' : 'Roadmap Assessment'}
                </h2>
              </div>
              <p
                style={{
                  fontSize: 'var(--text-sm, 14px)',
                  color: 'var(--muted-foreground, #64748b)',
                }}
              >
                Current Stage: {assessment.currentStageName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ml-4"
              style={{
                padding: 'var(--spacing-2, 8px)',
                borderRadius: 'var(--radius-md, 8px)',
                color: 'var(--muted-foreground, #64748b)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--muted, rgba(248, 252, 255, 0.8))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Credit Cost */}
            <div
              className="p-4 flex items-center justify-between"
              style={{
                backgroundColor: 'var(--muted, rgba(248, 252, 255, 0.8))',
                borderRadius: 'var(--radius-md, 8px)',
                border: '1px solid var(--border, rgba(226, 232, 240, 0.6))',
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="p-2"
                  style={{
                    backgroundColor: 'var(--primary, #2F80FF)',
                    borderRadius: 'var(--radius-md, 8px)',
                    opacity: 0.1,
                  }}
                >
                  <DollarSign className="size-5" style={{ color: 'var(--primary, #2F80FF)' }} />
                </div>
                <div>
                  <p style={{ color: 'var(--foreground, #0f172a)' }}>
                    Total Credits Used
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-sm, 14px)',
                      color: 'var(--muted-foreground, #64748b)',
                    }}
                  >
                    {assessment.totalAlteredTasks} task{assessment.totalAlteredTasks !== 1 ? 's' : ''} altered × 5 credits each
                  </p>
                </div>
              </div>
              <div style={{ color: 'var(--primary, #2F80FF)' }}>
                {creditCost} credits
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
              {/* Auto-Completed */}
              {assessment.autoCompletedCount > 0 && (
                <div
                  className="p-4"
                  style={{
                    backgroundColor: 'var(--card, #ffffff)',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--border, rgba(226, 232, 240, 0.6))',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="size-5" style={{ color: 'var(--success, #27D17C)' }} />
                    <p style={{ color: 'var(--foreground, #0f172a)' }}>
                      Auto-Completed
                    </p>
                  </div>
                  <p style={{ fontSize: '2rem', color: 'var(--success, #27D17C)' }}>
                    {assessment.autoCompletedCount}
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-sm, 14px)',
                      color: 'var(--muted-foreground, #64748b)',
                    }}
                  >
                    task{assessment.autoCompletedCount !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Unlocked */}
              {assessment.newTasksUnlocked > 0 && (
                <div
                  className="p-4"
                  style={{
                    backgroundColor: 'var(--card, #ffffff)',
                    borderRadius: 'var(--radius-md, 8px)',
                    border: '1px solid var(--border, rgba(226, 232, 240, 0.6))',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Unlock className="size-5" style={{ color: 'var(--primary, #2F80FF)' }} />
                    <p style={{ color: 'var(--foreground, #0f172a)' }}>
                      New Tasks
                    </p>
                  </div>
                  <p style={{ fontSize: '2rem', color: 'var(--primary, #2F80FF)' }}>
                    {assessment.newTasksUnlocked}
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--text-sm, 14px)',
                      color: 'var(--muted-foreground, #64748b)',
                    }}
                  >
                    unlocked
                  </p>
                </div>
              )}
            </div>

            {/* Progress Insights */}
            {assessment.progressInsights && (
              <div>
                <h3
                  className="mb-3"
                  style={{
                    color: 'var(--foreground, #0f172a)',
                  }}
                >
                  Business Insights
                </h3>
                <p
                  className="leading-relaxed"
                  style={{
                    color: 'var(--muted-foreground, #64748b)',
                    fontSize: 'var(--text-sm, 14px)',
                  }}
                >
                  {assessment.progressInsights}
                </p>
              </div>
            )}

            {/* Ready for Next Stage */}
            {assessment.readyForNextStage && assessment.nextStageName && (
              <div
                className="p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.1) 0%, rgba(157, 78, 221, 0.1) 100%)',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: '1px solid var(--primary, #2F80FF)',
                }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 mt-0.5" style={{ color: 'var(--primary, #2F80FF)' }} />
                  <div>
                    <p style={{ color: 'var(--foreground, #0f172a)' }}>
                      You're ready to advance to <strong>{assessment.nextStageName}</strong>!
                    </p>
                    <p
                      className="mt-1"
                      style={{
                        fontSize: 'var(--text-sm, 14px)',
                        color: 'var(--muted-foreground, #64748b)',
                      }}
                    >
                      Continue completing tasks to unlock this next stage.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-Completed Tasks Details */}
            {assessment.autoCompletedTasks && assessment.autoCompletedTasks.length > 0 && (
              <div>
                <h3
                  className="mb-3"
                  style={{
                    color: 'var(--foreground, #0f172a)',
                  }}
                >
                  Tasks Completed Automatically
                </h3>
                <div className="space-y-3">
                  {assessment.autoCompletedTasks.map((task, index) => (
                    <div
                      key={index}
                      className="p-3"
                      style={{
                        backgroundColor: 'var(--muted, rgba(248, 252, 255, 0.8))',
                        borderRadius: 'var(--radius-md, 8px)',
                        borderLeft: '3px solid var(--success, #27D17C)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle className="size-4 mt-0.5" style={{ color: 'var(--success, #27D17C)' }} />
                        <div className="flex-1 min-w-0">
                          <p
                            style={{
                              color: 'var(--foreground, #0f172a)',
                              fontSize: 'var(--text-sm, 14px)',
                            }}
                          >
                            <strong>{task.departmentName}:</strong> {task.taskTitle}
                          </p>
                          <p
                            className="mt-1"
                            style={{
                              fontSize: 'var(--text-xs, 12px)',
                              color: 'var(--muted-foreground, #64748b)',
                            }}
                          >
                            {task.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unlocked Tasks Details */}
            {assessment.unlockedTasks && assessment.unlockedTasks.length > 0 && (
              <div>
                <h3
                  className="mb-3"
                  style={{
                    color: 'var(--foreground, #0f172a)',
                  }}
                >
                  Newly Unlocked Tasks
                </h3>
                <div className="space-y-3">
                  {assessment.unlockedTasks.map((task, index) => (
                    <div
                      key={index}
                      className="p-3"
                      style={{
                        backgroundColor: 'var(--muted, rgba(248, 252, 255, 0.8))',
                        borderRadius: 'var(--radius-md, 8px)',
                        borderLeft: '3px solid var(--primary, #2F80FF)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <Unlock className="size-4 mt-0.5" style={{ color: 'var(--primary, #2F80FF)' }} />
                        <div className="flex-1 min-w-0">
                          <p
                            style={{
                              color: 'var(--foreground, #0f172a)',
                              fontSize: 'var(--text-sm, 14px)',
                            }}
                          >
                            <strong>{task.departmentName}:</strong> {task.taskTitle}
                          </p>
                          <p
                            className="mt-1"
                            style={{
                              fontSize: 'var(--text-xs, 12px)',
                              color: 'var(--muted-foreground, #64748b)',
                            }}
                          >
                            {task.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Department Health */}
            {assessment.departmentHealth && assessment.departmentHealth.length > 0 && (
              <div>
                <h3
                  className="mb-3"
                  style={{
                    color: 'var(--foreground, #0f172a)',
                  }}
                >
                  Department Health
                </h3>
                <div className="space-y-2">
                  {assessment.departmentHealth.map((dept, index) => (
                    <div
                      key={index}
                      className="p-3 flex items-center justify-between"
                      style={{
                        backgroundColor: 'var(--card, #ffffff)',
                        borderRadius: 'var(--radius-md, 8px)',
                        border: '1px solid var(--border, rgba(226, 232, 240, 0.6))',
                      }}
                    >
                      <div className="flex-1">
                        <p
                          style={{
                            color: 'var(--foreground, #0f172a)',
                            fontSize: 'var(--text-sm, 14px)',
                          }}
                        >
                          {dept.name}
                        </p>
                        <p
                          style={{
                            fontSize: 'var(--text-xs, 12px)',
                            color: 'var(--muted-foreground, #64748b)',
                          }}
                        >
                          {dept.reason}
                        </p>
                      </div>
                      <span
                        className="px-3 py-1"
                        style={{
                          fontSize: 'var(--text-xs, 12px)',
                          borderRadius: 'var(--radius-full, 9999px)',
                          backgroundColor: dept.health === 'healthy' 
                            ? 'rgba(39, 209, 124, 0.1)' 
                            : dept.health === 'needs-attention'
                            ? 'rgba(242, 201, 76, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                          color: dept.health === 'healthy'
                            ? 'var(--success, #27D17C)'
                            : dept.health === 'needs-attention'
                            ? '#F2C94C'
                            : '#EF4444',
                        }}
                      >
                        {dept.health === 'healthy' ? '✓ Healthy' : dept.health === 'needs-attention' ? '⚠ Needs Attention' : '⚠ Critical'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="sticky bottom-0 px-6 py-4 flex justify-end"
            style={{
              backgroundColor: 'var(--card, #ffffff)',
              borderTop: '1px solid var(--border, rgba(226, 232, 240, 0.6))',
            }}
          >
            <button
              onClick={onClose}
              className="px-6 py-2.5"
              style={{
                backgroundColor: 'var(--primary, #2F80FF)',
                color: '#ffffff',
                borderRadius: 'var(--radius-md, 8px)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
