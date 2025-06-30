#!/bin/bash

#!/bin/bash

# TaskBreakdown Expert Analytics Monitor
# Quick command-line script to check analytics

ANALYTICS_URL="https://task-breakdown-expert-hn7dpacui-nedums-projects-c8c3a59e.vercel.app/api/analytics"

echo "🔍 TaskBreakdown Expert Analytics Monitor"
echo "=========================================="
echo "Fetching data from: $ANALYTICS_URL"
echo ""

# Fetch analytics data
RESPONSE=$(curl -s "$ANALYTICS_URL")

# Check if response contains HTML (authentication page)
if echo "$RESPONSE" | grep -q "<!doctype html>"; then
    echo "🔐 Authentication Required"
    echo "=========================="
    echo ""
    echo "⚠️  The production API requires Vercel authentication."
    echo "📋 This is normal for Vercel-deployed applications."
    echo ""
    echo "🎯 Alternative Monitoring Options:"
    echo ""
    echo "1. 🖥️  Local Analytics Dashboard:"
    echo "   node run-analytics-dashboard.js"
    echo ""
    echo "2. 🌐 Vercel Dashboard:"
    echo "   • Visit: https://vercel.com/dashboard"
    echo "   • Go to: task-breakdown-expert project"
    echo "   • Check: Functions → /api/analytics"
    echo ""
    echo "3. 🔗 Direct Browser Access:"
    echo "   $ANALYTICS_URL"
    echo "   (Will prompt for authentication)"
    echo ""
    echo "4. 📊 Production App Usage:"
    echo "   https://task-breakdown-expert-hn7dpacui-nedums-projects-c8c3a59e.vercel.app"
    echo "   (Use the app to generate analytics data)"
else
    # Check if jq is available for pretty printing
    if command -v jq >/dev/null 2>&1; then
        echo "📊 Analytics Data:"
        echo "------------------"
        echo "$RESPONSE" | jq '.metrics'
        echo ""
        
        # Extract specific metrics
        echo "📈 Quick Summary:"
        echo "-----------------"
        TASK_BREAKDOWNS=$(echo "$RESPONSE" | jq -r '.metrics.taskBreakdownsGenerated // 0')
        DOWNLOADS=$(echo "$RESPONSE" | jq -r '.metrics.downloadsCompleted // 0')
        EMAILS=$(echo "$RESPONSE" | jq -r '.metrics.emailsSent // 0')
        RECENT_COUNT=$(echo "$RESPONSE" | jq -r '.metrics.recentTasksCount // 0')
        LAST_UPDATED=$(echo "$RESPONSE" | jq -r '.metrics.lastUpdated // "Unknown"')
        
        echo "• Task Breakdowns Generated: $TASK_BREAKDOWNS"
        echo "• Downloads Completed: $DOWNLOADS"
        echo "• Emails Sent: $EMAILS"
        echo "• Recent Tasks Tracked: $RECENT_COUNT"
        echo "• Last Updated: $LAST_UPDATED"
        
        # Show recent tasks sample if available
        RECENT_TASKS=$(echo "$RESPONSE" | jq -r '.metrics.recentTasksSample[]?' 2>/dev/null)
        if [ ! -z "$RECENT_TASKS" ]; then
            echo ""
            echo "🎯 Recent User Tasks:"
            echo "--------------------"
            echo "$RECENT_TASKS" | while read -r task; do
                echo "• $task"
            done
        fi
    else
        echo "📊 Raw Analytics Data:"
        echo "----------------------"
        echo "$RESPONSE"
        echo ""
        echo ""
        echo "💡 Tip: Install 'jq' for prettier output:"
        echo "   brew install jq  (on macOS)"
        echo "   apt-get install jq  (on Ubuntu/Debian)"
    fi
fi

echo ""
echo "✅ Analytics check complete!"
echo ""
echo "� Quick Start Options:"
echo "• Local Dashboard: node run-analytics-dashboard.js"
echo "• Production App: https://task-breakdown-expert-hn7dpacui-nedums-projects-c8c3a59e.vercel.app"
