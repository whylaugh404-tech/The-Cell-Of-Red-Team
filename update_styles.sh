#!/bin/bash
FILE="src/App.tsx"

# Backgrounds
sed -i 's/bg-neutral-50/bg-black/g' $FILE
sed -i 's/bg-neutral-100/bg-black/g' $FILE
sed -i 's/bg-neutral-200/bg-red-950\/30/g' $FILE
sed -i 's/bg-white/bg-black/g' $FILE
sed -i 's/bg-rose-50/bg-red-950\/30/g' $FILE
sed -i 's/bg-rose-100/bg-red-950\/30/g' $FILE
sed -i 's/bg-emerald-50/bg-black/g' $FILE
sed -i 's/bg-blue-50/bg-black/g' $FILE
sed -i 's/bg-purple-50/bg-black/g' $FILE
sed -i 's/bg-gradient-to-r from-rose-950 via-neutral-900 to-black/bg-black/g' $FILE

# Borders
sed -i 's/border-neutral-100/border-red-900\/50/g' $FILE
sed -i 's/border-neutral-200/border-red-900/g' $FILE
sed -i 's/border-rose-100/border-red-900/g' $FILE
sed -i 's/border-rose-200/border-red-900/g' $FILE
sed -i 's/border-emerald-200/border-red-900/g' $FILE
sed -i 's/border-blue-200/border-red-900/g' $FILE
sed -i 's/border-purple-200/border-red-900/g' $FILE
sed -i 's/border-b border-rose-200/border-b border-red-900/g' $FILE
sed -i 's/border-white\/10/border-red-900\/50/g' $FILE
sed -i 's/border-white\/20/border-red-900\/50/g' $FILE

# Text colors (Fonts)
sed -i 's/text-neutral-900/text-red-500/g' $FILE
sed -i 's/text-neutral-800/text-red-500/g' $FILE
sed -i 's/text-neutral-700/text-red-600/g' $FILE
sed -i 's/text-neutral-600/text-red-600/g' $FILE
sed -i 's/text-neutral-500/text-red-700/g' $FILE
sed -i 's/text-neutral-400/text-red-800/g' $FILE
sed -i 's/text-neutral-300/text-red-700/g' $FILE
sed -i 's/text-rose-600/text-red-500/g' $FILE
sed -i 's/text-rose-700/text-red-600/g' $FILE
sed -i 's/text-emerald-900/text-red-500/g' $FILE
sed -i 's/text-emerald-700/text-red-600/g' $FILE
sed -i 's/text-emerald-600/text-red-500/g' $FILE
sed -i 's/text-emerald-400/text-red-500/g' $FILE
sed -i 's/text-blue-700/text-red-600/g' $FILE
sed -i 's/text-blue-600/text-red-500/g' $FILE
sed -i 's/text-purple-700/text-red-600/g' $FILE
sed -i 's/text-white/text-red-500/g' $FILE
sed -i 's/text-black/text-red-500/g' $FILE

# Buttons and interactive backgrounds
sed -i 's/bg-rose-600/bg-red-900/g' $FILE
sed -i 's/hover:bg-rose-500/hover:bg-red-800/g' $FILE
sed -i 's/hover:bg-rose-700/hover:bg-red-950/g' $FILE
sed -i 's/hover:bg-neutral-50/hover:bg-red-950\/20/g' $FILE
sed -i 's/hover:bg-neutral-100/hover:bg-red-950\/40/g' $FILE
sed -i 's/hover:text-neutral-900/hover:text-red-400/g' $FILE
sed -i 's/hover:border-neutral-300/hover:border-red-700/g' $FILE
sed -i 's/hover:border-rose-300/hover:border-red-700/g' $FILE
sed -i 's/focus:border-rose-500/focus:border-red-500/g' $FILE
sed -i 's/focus:bg-white/focus:bg-black/g' $FILE
sed -i 's/bg-white\/10/bg-black/g' $FILE
sed -i 's/hover:bg-white\/20/hover:bg-red-950\/30/g' $FILE
sed -i 's/bg-white\/5/bg-black/g' $FILE
sed -i 's/bg-white\/80/bg-black/g' $FILE
sed -i 's/bg-white\/90/bg-black/g' $FILE

# Widths (Buat lebih luas)
sed -i 's/max-w-6xl/max-w-[140rem] w-full px-4/g' $FILE
sed -i 's/max-w-3xl/max-w-6xl/g' $FILE
sed -i 's/max-w-4xl/max-w-7xl/g' $FILE
sed -i 's/max-w-2xl/max-w-5xl/g' $FILE

# Selections & Special
sed -i 's/selection:bg-rose-200/selection:bg-red-900 selection:text-white/g' $FILE
sed -i 's/bg-rose-400/bg-red-500/g' $FILE
sed -i 's/border-b-2 border-rose-600/border-b-2 border-red-500/g' $FILE
sed -i 's/ring-rose-500/ring-red-500/g' $FILE

echo "Style update complete."
