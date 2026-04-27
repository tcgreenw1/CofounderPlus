import React from 'react';
import {
  TimelineBar,
  TimelineBarDark,
  ChapterMarkerLocked,
  ChapterMarkerCurrent,
  ChapterMarkerCompleted,
  ChapterMarkerNextBoss,
  TimelineBossNode,
  TimelineBossNodeDark,
} from './TimelineComponents';
import { Trophy, Swords, Target, Sparkles } from 'lucide-react';

/**
 * Comprehensive showcase for Timeline components
 */
export function TimelineShowcase() {
  return (
    <div className="min-h-screen p-8 md:p-12 bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-semibold text-slate-900">
            Timeline Components Library
          </h1>
          <p className="text-slate-600 text-xl">
            Progress bars, chapter markers, and boss nodes
          </p>
        </div>

        {/* 1. Timeline Bar Demo */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              1. Timeline / Bar
            </h2>
            <p className="text-slate-600">
              Horizontal frosted glass bar with chapter dividers, progress ribbon, and iridescent edges
            </p>
          </div>

          <div className="space-y-8 p-8 bg-white/60 rounded-3xl backdrop-blur-sm border border-slate-200">
            {/* 20% Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-600 uppercase">
                  20% Progress
                </h3>
                <span className="text-xs text-slate-500">Chapter 1 of 5</span>
              </div>
              <TimelineBar
                totalChapters={5}
                currentChapter={1}
                progress={20}
                onChapterClick={(chapter) => console.log('Chapter clicked:', chapter)}
              />
            </div>

            {/* 40% Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-600 uppercase">
                  40% Progress
                </h3>
                <span className="text-xs text-slate-500">Chapter 2 of 5</span>
              </div>
              <TimelineBar
                totalChapters={5}
                currentChapter={2}
                progress={40}
              />
            </div>

            {/* 75% Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-600 uppercase">
                  75% Progress
                </h3>
                <span className="text-xs text-slate-500">Chapter 4 of 5</span>
              </div>
              <TimelineBar
                totalChapters={5}
                currentChapter={4}
                progress={75}
              />
            </div>

            {/* 100% Progress */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-600 uppercase">
                  100% Complete
                </h3>
                <span className="text-xs text-slate-500">All chapters done!</span>
              </div>
              <TimelineBar
                totalChapters={5}
                currentChapter={5}
                progress={100}
              />
            </div>

            {/* Custom chapter count */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-600 uppercase">
                  8 Chapters
                </h3>
                <span className="text-xs text-slate-500">Mid-journey</span>
              </div>
              <TimelineBar
                totalChapters={8}
                currentChapter={4}
                progress={50}
              />
            </div>
          </div>
        </section>

        {/* 2. Chapter Markers Demo */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              2. Timeline / Chapter Marker Variants
            </h2>
            <p className="text-slate-600">
              Four states: Locked, Current, Completed, NextBoss
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 p-12 bg-white/60 rounded-3xl backdrop-blur-sm border border-slate-200 place-items-center">
            {/* Locked */}
            <div className="space-y-4">
              <ChapterMarkerLocked
                chapterNumber={5}
                label="Chapter 5"
              />
              <div className="text-center">
                <p className="text-xs font-semibold text-slate-600">LOCKED</p>
                <p className="text-xs text-slate-500 mt-1">Grayed out • Lock icon</p>
              </div>
            </div>

            {/* Current */}
            <div className="space-y-4">
              <ChapterMarkerCurrent
                chapterNumber={2}
                label="Chapter 2"
              />
              <div className="text-center">
                <p className="text-xs font-semibold text-blue-600">CURRENT</p>
                <p className="text-xs text-slate-500 mt-1">Pulsing glow • Rotating ring</p>
              </div>
            </div>

            {/* Completed */}
            <div className="space-y-4">
              <ChapterMarkerCompleted
                chapterNumber={1}
                label="Chapter 1"
              />
              <div className="text-center">
                <p className="text-xs font-semibold text-green-600">COMPLETED</p>
                <p className="text-xs text-slate-500 mt-1">Green • Checkmark</p>
              </div>
            </div>

            {/* NextBoss */}
            <div className="space-y-4">
              <ChapterMarkerNextBoss
                chapterNumber={3}
                label="Boss Fight"
              />
              <div className="text-center">
                <p className="text-xs font-semibold text-yellow-600">BOSS</p>
                <p className="text-xs text-slate-500 mt-1">Crown • Rotating glow</p>
              </div>
            </div>
          </div>

          {/* Full Timeline with Markers */}
          <div className="space-y-6 p-8 bg-gradient-to-br from-slate-100 to-blue-100 rounded-3xl border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800">
              Complete Timeline Example
            </h3>
            
            <div className="space-y-8">
              <TimelineBar
                totalChapters={5}
                currentChapter={2}
                progress={35}
              />

              <div className="flex justify-between items-start px-4">
                <ChapterMarkerCompleted chapterNumber={1} label="Intro" />
                <ChapterMarkerCurrent chapterNumber={2} label="Build" />
                <ChapterMarkerNextBoss chapterNumber={3} label="Boss" />
                <ChapterMarkerLocked chapterNumber={4} label="Scale" />
                <ChapterMarkerLocked chapterNumber={5} label="Exit" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Boss Node Demo */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              3. Timeline / BossNode
            </h2>
            <p className="text-slate-600">
              Larger node with dual-layer glass and stronger glow
            </p>
          </div>

          <div className="space-y-8 p-12 bg-white/60 rounded-3xl backdrop-blur-sm border border-slate-200">
            {/* Default Boss Node */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-600 uppercase">
                Default Boss Node
              </h3>
              <div className="flex justify-center">
                <TimelineBossNode />
              </div>
            </div>

            {/* Custom Boss Nodes */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-slate-600 uppercase">
                Custom Boss Challenges
              </h3>
              
              <div className="space-y-6">
                <TimelineBossNode
                  icon={
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.3) 0%, rgba(255, 140, 140, 0.2) 100%)',
                        border: '2px solid rgba(235, 87, 87, 0.5)',
                        boxShadow: '0 4px 12px rgba(235, 87, 87, 0.3)',
                      }}
                    >
                      <Swords className="w-8 h-8 text-red-600" />
                    </div>
                  }
                  title="Final Boss Battle"
                  subtitle="Defeat the ultimate challenge"
                  xpBadge={
                    <div
                      className="px-4 py-2 rounded-full flex items-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, rgba(235, 87, 87, 0.3) 0%, rgba(255, 140, 140, 0.25) 100%)',
                        border: '2px solid rgba(235, 87, 87, 0.5)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <Trophy className="w-5 h-5 text-red-600" />
                      <span className="text-red-700 font-bold text-lg">
                        +1000
                      </span>
                    </div>
                  }
                />

                <TimelineBossNode
                  icon={
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.3) 0%, rgba(180, 170, 240, 0.2) 100%)',
                        border: '2px solid rgba(108, 92, 231, 0.5)',
                        boxShadow: '0 4px 12px rgba(108, 92, 231, 0.3)',
                      }}
                    >
                      <Sparkles className="w-8 h-8 text-purple-600" />
                    </div>
                  }
                  title="AI Master Challenge"
                  subtitle="Build an intelligent system"
                  xpBadge={
                    <div
                      className="px-4 py-2 rounded-full flex items-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, rgba(108, 92, 231, 0.3) 0%, rgba(180, 170, 240, 0.25) 100%)',
                        border: '2px solid rgba(108, 92, 231, 0.5)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      <span className="text-purple-700 font-bold text-lg">
                        +750
                      </span>
                    </div>
                  }
                />

                <TimelineBossNode
                  icon={
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.3) 0%, rgba(180, 220, 255, 0.2) 100%)',
                        border: '2px solid rgba(47, 128, 255, 0.5)',
                        boxShadow: '0 4px 12px rgba(47, 128, 255, 0.3)',
                      }}
                    >
                      <Target className="w-8 h-8 text-blue-600" />
                    </div>
                  }
                  title="Product Launch"
                  subtitle="Ship to 1000 users"
                  xpBadge={
                    <div
                      className="px-4 py-2 rounded-full flex items-center gap-2"
                      style={{
                        background: 'linear-gradient(135deg, rgba(47, 128, 255, 0.3) 0%, rgba(180, 220, 255, 0.25) 100%)',
                        border: '2px solid rgba(47, 128, 255, 0.5)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      <Trophy className="w-5 h-5 text-blue-600" />
                      <span className="text-blue-700 font-bold text-lg">
                        +600
                      </span>
                    </div>
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* Dark Mode Examples */}
        <section className="space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold text-slate-800">
              Dark Mode Variants
            </h2>
            <p className="text-slate-600">
              Timeline components with dark theme styling
            </p>
          </div>

          <div className="space-y-8 p-12 bg-slate-900 rounded-3xl">
            {/* Dark Timeline Bar */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300 uppercase">
                Timeline Bar - Dark
              </h3>
              <TimelineBarDark
                totalChapters={5}
                currentChapter={3}
                progress={55}
              />
            </div>

            {/* Dark Boss Node */}
            <div className="space-y-3 pt-8">
              <h3 className="text-sm font-semibold text-slate-300 uppercase">
                Boss Node - Dark
              </h3>
              <div className="flex justify-center">
                <TimelineBossNodeDark
                  title="Epic Challenge"
                  subtitle="Conquer the darkness"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Technical Specifications */}
        <section className="space-y-6 p-8 bg-white rounded-3xl border-2 border-slate-200">
          <h2 className="text-3xl font-semibold text-slate-800">
            Technical Specifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">Timeline / Bar</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ Height: 16px, Radius: 12px</li>
                <li>✓ 28px backdrop blur</li>
                <li>✓ Iridescent top/bottom edges</li>
                <li>✓ Progress ribbon gradient</li>
                <li>✓ Shimmer animation (3s)</li>
                <li>✓ Chapter divider markers</li>
                <li>✓ Smooth 700ms transitions</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">Chapter Markers</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ Size: 48px (56px for Boss)</li>
                <li>✓ 16px backdrop blur</li>
                <li>✓ State-specific colors</li>
                <li>✓ Current: Pulsing glow + spin</li>
                <li>✓ Boss: Multi-color rotation</li>
                <li>✓ Locked: 50% saturation</li>
                <li>✓ Completed: Green checkmark</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-slate-700 text-lg">BossNode</h3>
              <ul className="text-sm text-slate-600 space-y-1.5">
                <li>✓ Dual-layer glass (32px + 24px blur)</li>
                <li>✓ Triple glow layers</li>
                <li>✓ 32px outer radius</li>
                <li>✓ Larger size (16px icon, 24px text)</li>
                <li>✓ Crown badge animation</li>
                <li>✓ Specular highlight overlay</li>
                <li>✓ Hover scale: 1.02</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
