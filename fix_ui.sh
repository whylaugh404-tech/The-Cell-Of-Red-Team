#!/bin/bash
FILE="src/App.tsx"

# Restore backgrounds to a clean black theme, but with proper grey/red highlights
sed -i 's/bg-red-950\/30/bg-neutral-900\/50/g' $FILE
sed -i 's/bg-red-950\/40/bg-neutral-800\/50/g' $FILE
sed -i 's/bg-red-950\/20/bg-neutral-900\/30/g' $FILE

# Borders adjust to subtle dark reds
sed -i 's/border-red-900/border-red-900\/40/g' $FILE
sed -i 's/border-red-900\/50\/40/border-red-900\/40/g' $FILE

# Adjust button sizes and padding
sed -i 's/px-5 py-4/px-6 py-3/g' $FILE
sed -i 's/px-8 py-4/px-6 py-3/g' $FILE

# Adjust fonts for better readability (white/gray with red accents)
sed -i 's/text-red-500/text-neutral-200/g' $FILE
sed -i 's/text-red-600/text-red-500/g' $FILE
sed -i 's/text-red-700/text-neutral-400/g' $FILE
sed -i 's/text-red-800/text-neutral-500/g' $FILE
sed -i 's/text-red-400/text-red-400/g' $FILE

# Ensure headers are red/white
sed -i 's/text-neutral-200/text-white/g' $FILE

# Fix max width to a standard responsive size instead of 140rem which is too big
sed -i 's/max-w-\[140rem\]/max-w-7xl/g' $FILE

# Add some specific targeting for the swarm expedition buttons
sed -i 's/flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto/flex flex-wrap items-center gap-3 w-full lg:w-auto/g' $FILE

echo "UI fixed."
