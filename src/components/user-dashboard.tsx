import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, Target, Clock, User, BarChart3, Trophy, Settings, Trash2 } from 'lucide-react';
import type { UserAnalytics } from '@/utils/user-session';

interface UserDashboardProps {
  analytics: UserAnalytics;
  isLoading?: boolean;
  onClearData?: () => void;
  onUpdatePreferences?: (preferences: Partial<UserAnalytics['preferences']>) => void;
}

export function UserDashboard({ analytics, isLoading = false, onClearData, onUpdatePreferences }: UserDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const lastVisitDate = new Date(analytics.lastVisit);
  const daysSinceFirstVisit = Math.floor((Date.now() - new Date(analytics.firstVisit).getTime()) / (1000 * 60 * 60 * 24));
  const tasksPerVisit = analytics.visitsCount > 0 ? (analytics.taskBreakdownsGenerated / analytics.visitsCount).toFixed(1) : '0';
  const downloadRate = analytics.taskBreakdownsGenerated > 0 ? ((analytics.downloadsCompleted / analytics.taskBreakdownsGenerated) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Your Personal Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Last visit: {lastVisitDate.toLocaleDateString()}
          </Badge>
          {onClearData && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearData}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Reset Data
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.visitsCount}</div>
                <p className="text-xs text-muted-foreground">
                  Keep coming back to build your productivity habits!
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Task Breakdowns</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.taskBreakdownsGenerated}</div>
                <p className="text-xs text-muted-foreground">
                  Plans created and downloaded
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.downloadsCompleted}</div>
                <p className="text-xs text-muted-foreground">
                  PDF breakdowns downloaded
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your productivity journey at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Task Planning Engagement</span>
                  <Progress value={(analytics.taskBreakdownsGenerated / Math.max(analytics.visitsCount, 1)) * 100} className="w-32" />
                </div>
                <div className="flex items-center justify-between">
                  <span>Download Rate</span>
                  <Progress value={(analytics.downloadsCompleted / Math.max(analytics.taskBreakdownsGenerated, 1)) * 100} className="w-32" />
                </div>
                {analytics.averageSessionTime && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Average Session
                    </span>
                    <span className="font-medium">{Math.round(analytics.averageSessionTime / 60)}m</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productivity Insights</CardTitle>
              <CardDescription>Personalized recommendations based on your usage</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analytics.visitsCount > 5 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800">Consistency Champion! 🏆</h4>
                  <p className="text-sm text-green-600 mt-1">
                    You've visited {analytics.visitsCount} times - you're building great planning habits!
                  </p>
                </div>
              )}
              
              {analytics.downloadsCompleted / Math.max(analytics.taskBreakdownsGenerated, 1) > 0.8 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800">Action Taker! 📋</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    You download most of your plans - that's the spirit of implementation!
                  </p>
                </div>
              )}

              {analytics.favoriteTaskTypes && analytics.favoriteTaskTypes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Your Learning Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {analytics.favoriteTaskTypes.slice(0, 3).map((task: string, index: number) => (
                      <Badge key={index} variant="outline">{task}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800">💡 Pro Tip</h4>
                <p className="text-sm text-yellow-600 mt-1">
                  Consider setting aside dedicated time each week to review and update your learning plans.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                User Preferences
              </CardTitle>
              <CardDescription>Customize your learning experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <h4 className="font-medium">Default Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Preferred Time Unit</label>
                    <select 
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                      value={analytics.preferences.defaultTimeUnit}
                      onChange={(e) => {
                        onUpdatePreferences?.({
                          defaultTimeUnit: e.target.value as 'days' | 'months'
                        });
                      }}
                    >
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Default Daily Commitment (hours)</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="12"
                      className="w-full mt-1 p-2 border rounded-md bg-background"
                      value={analytics.preferences.defaultCommitment}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 1 && value <= 12) {
                          onUpdatePreferences?.({
                            defaultCommitment: value
                          });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Skill Level</h4>
                <div className="flex gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                    <Button
                      key={level}
                      variant={analytics.preferences.skillLevel === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        onUpdatePreferences?.({
                          skillLevel: level
                        });
                      }}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  This helps us provide better recommendations for your learning plans.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Learning Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <div className="text-lg font-semibold">{analytics.visitsCount}</div>
                    <div className="text-xs text-muted-foreground">Total Visits</div>
                  </div>
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <div className="text-lg font-semibold">{analytics.taskBreakdownsGenerated}</div>
                    <div className="text-xs text-muted-foreground">Plans Created</div>
                  </div>
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <div className="text-lg font-semibold">{analytics.downloadsCompleted}</div>
                    <div className="text-xs text-muted-foreground">Downloads</div>
                  </div>
                  <div className="p-3 border rounded-lg bg-muted/30">
                    <div className="text-lg font-semibold">
                      {Math.round((analytics.downloadsCompleted / Math.max(analytics.taskBreakdownsGenerated, 1)) * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Follow-through</div>
                  </div>
                </div>
              </div>

              {analytics.completedTasks && analytics.completedTasks.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Recent Learning Goals</h4>
                  <div className="space-y-2">
                    {analytics.completedTasks.slice(0, 5).map((task, index) => (
                      <div key={index} className="p-2 bg-muted/30 rounded text-sm">
                        {task}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Privacy & Data</h4>
                    <p className="text-xs text-muted-foreground">
                      Your data is stored locally in your browser. User ID: {analytics.userId.slice(-8)}
                    </p>
                  </div>
                  {onClearData && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={onClearData}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear All Data
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
