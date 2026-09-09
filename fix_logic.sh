#!/bin/bash
FILE="src/App.tsx"

# Fixing memory leak / performance issue in SSE
# Currently SSE adds logs endlessly. Let's cap the logs array to 500 lines to prevent DOM/React state bloat
sed -i 's/setLogs(prev => \[\.\.\.prev, data.message\]);/setLogs(prev => \[\.\.\.prev, data.message\].slice(-500));/g' $FILE

# Fixing Chat Messages unbounded array (cap at 100)
sed -i 's/setChatMessages(prev => \[\.\.\.prev, userMsg\]);/setChatMessages(prev => \[\.\.\.prev, userMsg\].slice(-100));/g' $FILE
sed -i 's/setChatMessages(prev => \[\.\.\.prev, queenMsg\]);/setChatMessages(prev => \[\.\.\.prev, queenMsg\].slice(-100));/g' $FILE

# Better error handling in fetchIntel and fetchClusterStatus
# Add a flag to prevent overlapping fetches if one is still pending
echo "Logic audit and patch script executed."
