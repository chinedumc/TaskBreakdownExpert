import type { TaskBreakdownFormValues } from '@/lib/schemas';
import type { TaskBreakdownOutput } from './flows/task-breakdown';

export interface UserPreferences {
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredTaskSize: 'small' | 'medium' | 'large';
  workingHours: 'morning' | 'afternoon' | 'evening' | 'flexible';
  focusAreas: string[];
}

export interface TaskAnalysis {
  complexity: 'low' | 'medium' | 'high';
  timeOptimizationOpportunities: string[];
  resourceRequirements: string[];
  riskFactors: string[];
  recommendations: string[];
}

export interface PersonalizedInsight {
  type: 'optimization' | 'warning' | 'suggestion' | 'encouragement';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'high' | 'medium' | 'low';
}

export class EnhancedTaskAI {
  /**
   * Analyzes a task breakdown for optimization opportunities
   */
  static async analyzeTaskBreakdown(
    formValues: TaskBreakdownFormValues,
    breakdown: TaskBreakdownOutput,
    userPreferences?: UserPreferences
  ): Promise<TaskAnalysis> {
    const totalWeeks = breakdown.breakdown.length;
    const totalTasks = breakdown.breakdown.reduce(
      (sum: number, week) => sum + week.tasks.length,
      0
    );
    
    const averageTasksPerWeek = totalTasks / totalWeeks;

    // Determine complexity based on multiple factors including skill level
    let complexity: 'low' | 'medium' | 'high' = 'medium';
    
    // Base complexity on task structure
    const baseComplexity = (() => {
      if (totalWeeks <= 4 && averageTasksPerWeek <= 15) return 'low';
      if (totalWeeks > 26 || averageTasksPerWeek > 25) return 'high';
      return 'medium';
    })();
    
    // Adjust complexity based on user skill level
    if (userPreferences?.skillLevel === 'beginner') {
      // For beginners, even medium tasks can feel high complexity
      if (baseComplexity === 'medium') complexity = 'high';
      else if (baseComplexity === 'low') complexity = 'medium';
      else complexity = 'high';
    } else if (userPreferences?.skillLevel === 'advanced') {
      // For advanced users, reduce perceived complexity
      if (baseComplexity === 'high') complexity = 'medium';
      else if (baseComplexity === 'medium') complexity = 'low';
      else complexity = 'low';
    } else {
      // Intermediate users use base complexity
      complexity = baseComplexity;
    }

    // Generate time optimization opportunities
    const timeOptimizationOpportunities: string[] = [];
    if (totalWeeks > 26) {
      timeOptimizationOpportunities.push(
        `Consider increasing daily commitment from ${formValues.hoursPerDayCommitment} to ${formValues.hoursPerDayCommitment + 1} hours to reduce plan duration`
      );
    }
    if (averageTasksPerWeek > 20) {
      timeOptimizationOpportunities.push(
        'Some weeks have high task density - consider redistributing tasks for better balance'
      );
    }
    if (formValues.targetTimeUnit === 'months' && formValues.targetTime > 6) {
      timeOptimizationOpportunities.push(
        'Long-term goals benefit from quarterly milestones and progress reviews'
      );
    }

    // Resource requirements based on task content
    const resourceRequirements: string[] = [];
    const taskContent = breakdown.breakdown
      .flatMap(week => week.tasks)
      .join(' ')
      .toLowerCase();

    if (taskContent.includes('programming') || taskContent.includes('coding') || taskContent.includes('development')) {
      resourceRequirements.push('Development environment and code editor');
      resourceRequirements.push('Practice projects and coding exercises');
    }
    if (taskContent.includes('design') || taskContent.includes('ui') || taskContent.includes('ux')) {
      resourceRequirements.push('Design tools (Figma, Adobe Creative Suite)');
      resourceRequirements.push('Design inspiration and reference materials');
    }
    if (taskContent.includes('language') || taskContent.includes('speaking') || taskContent.includes('communication')) {
      resourceRequirements.push('Language learning apps or courses');
      resourceRequirements.push('Practice conversation partners');
    }

    // Risk factors
    const riskFactors: string[] = [];
    if (totalWeeks > 40) {
      riskFactors.push('Long-term commitment may lead to motivation challenges');
    }
    if (formValues.hoursPerDayCommitment > 4) {
      riskFactors.push('High daily commitment may not be sustainable long-term');
    }
    if (averageTasksPerWeek > 25) {
      riskFactors.push('High task density may cause overwhelm');
    }

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      formValues,
      breakdown,
      complexity,
      userPreferences
    );

    return {
      complexity,
      timeOptimizationOpportunities,
      resourceRequirements,
      riskFactors,
      recommendations
    };
  }

  /**
   * Generates personalized recommendations based on user data
   */
  static async generatePersonalizedInsights(
    userHistory: { taskBreakdowns: number; visits: number; downloads: number },
    currentTask: TaskBreakdownFormValues,
    userPreferences?: UserPreferences
  ): Promise<PersonalizedInsight[]> {
    const insights: PersonalizedInsight[] = [];

    // Engagement insights
    if (userHistory.visits > 10 && userHistory.taskBreakdowns < 3) {
      insights.push({
        type: 'suggestion',
        title: 'Ready to Take Action?',
        description: `You've visited ${userHistory.visits} times but only created ${userHistory.taskBreakdowns} plans. Maybe it's time to commit to a learning goal?`,
        actionable: true,
        priority: 'high'
      });
    }

    // Success patterns
    if (userHistory.downloads / Math.max(userHistory.taskBreakdowns, 1) > 0.8) {
      // Adjust messaging and priority based on skill level
      let description = 'You download most of your plans - that shows real commitment to following through!';
      let priority: 'low' | 'medium' | 'high' = 'medium';
      
      if (userPreferences?.skillLevel === 'beginner') {
        description = 'Excellent! You\'re downloading your plans consistently. This habit is key to success for new learners.';
        priority = 'high';
      } else if (userPreferences?.skillLevel === 'advanced') {
        description = 'Strong execution pattern! Your consistent follow-through will accelerate your advanced learning goals.';
        priority = 'medium';
      }
      
      insights.push({
        type: 'encouragement',
        title: 'Implementation Champion!',
        description,
        actionable: false,
        priority
      });
    }

    // Time commitment warnings
    if (currentTask.hoursPerDayCommitment > 3 && userPreferences?.skillLevel === 'beginner') {
      insights.push({
        type: 'warning',
        title: 'Consider a Gentler Start',
        description: 'For beginners, 1-2 hours daily often leads to better long-term success than intensive schedules.',
        actionable: true,
        priority: 'high'
      });
    }

    // Optimization suggestions
    if (currentTask.targetTimeUnit === 'months' && currentTask.targetTime > 3) {
      // Determine priority based on skill level
      let priority: 'low' | 'medium' | 'high' = 'medium';
      let description = 'Long-term goals benefit from monthly milestones. Consider setting 30-day checkpoints.';
      
      if (userPreferences?.skillLevel === 'beginner') {
        priority = 'high';
        description = 'For beginners, breaking long-term goals into monthly milestones is crucial for maintaining motivation and tracking progress.';
      } else if (userPreferences?.skillLevel === 'advanced') {
        priority = 'low';
        description = 'Consider quarterly milestones with aggressive weekly targets to maximize your learning velocity.';
      }
      
      insights.push({
        type: 'optimization',
        title: 'Break It Down Further',
        description,
        actionable: true,
        priority
      });
    }

    return insights;
  }

  /**
   * Generates smart recommendations based on task analysis
   */
  private static async generateRecommendations(
    formValues: TaskBreakdownFormValues,
    breakdown: TaskBreakdownOutput,
    complexity: 'low' | 'medium' | 'high',
    userPreferences?: UserPreferences
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Skill-level based recommendations
    if (userPreferences?.skillLevel === 'beginner') {
      recommendations.push('Start with shorter daily sessions to build consistency');
      recommendations.push('Focus on understanding fundamentals before moving to advanced topics');
    } else if (userPreferences?.skillLevel === 'advanced') {
      recommendations.push('Consider taking on challenging projects to accelerate learning');
      recommendations.push('Look for opportunities to teach or mentor others in this area');
    }

    // Complexity-based recommendations
    if (complexity === 'high') {
      recommendations.push('Break down complex weeks into smaller, manageable daily goals');
      recommendations.push('Schedule regular progress reviews to stay on track');
      recommendations.push('Prepare for challenges by building in buffer time');
    }

    // Time-based recommendations
    const totalWeeks = breakdown.breakdown.length;
    if (totalWeeks > 26) {
      recommendations.push('Consider quarterly goal reviews and plan adjustments');
      recommendations.push('Build in motivation strategies for long-term commitment');
    } else if (totalWeeks < 4) {
      recommendations.push('Make the most of your intensive timeline with daily progress tracking');
    }

    // Commitment-based recommendations
    if (formValues.hoursPerDayCommitment >= 3) {
      recommendations.push('Schedule regular breaks to prevent burnout');
      recommendations.push('Consider alternating between intensive and lighter days');
    }

    return recommendations;
  }

  /**
   * Analyzes task content to suggest relevant resources
   */
  static async suggestResources(taskDescription: string): Promise<string[]> {
    const resources: string[] = [];
    const content = taskDescription.toLowerCase();

    // Programming resources
    if (content.includes('programming') || content.includes('coding') || content.includes('development')) {
      resources.push('FreeCodeCamp for interactive coding practice');
      resources.push('GitHub for version control and portfolio projects');
      resources.push('Stack Overflow for problem-solving');
    }

    // Design resources
    if (content.includes('design') || content.includes('ui') || content.includes('ux')) {
      resources.push('Figma for design prototyping');
      resources.push('Dribbble for design inspiration');
      resources.push('Adobe Creative Suite for professional tools');
    }

    // Business resources
    if (content.includes('business') || content.includes('entrepreneurship') || content.includes('startup')) {
      resources.push('Y Combinator Startup School for business fundamentals');
      resources.push('Lean Canvas for business model planning');
      resources.push('Google Analytics for market research');
    }

    // Language learning resources
    if (content.includes('language') || content.includes('speaking') || content.includes('communication')) {
      resources.push('Duolingo for vocabulary building');
      resources.push('iTalki for conversation practice');
      resources.push('Anki for spaced repetition learning');
    }

    // Generic learning resources
    resources.push('YouTube for tutorial videos');
    resources.push('Notion for organizing learning materials');
    resources.push('Pomodoro timer for focused study sessions');

    return resources;
  }
}