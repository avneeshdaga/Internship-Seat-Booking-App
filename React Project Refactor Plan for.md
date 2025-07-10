🧠 React Project Refactor Plan for Seat Booking App



===========================

PHASE 1: Core Setup \& State Management

===========================

🎯 Goal: Establish foundation with all current state variables



Files:

\- src/types/index.ts          → All TypeScript interfaces

\- src/hooks/useSeatStore.ts   → Zustand store replicating ALL script.ts variables

\- src/App.tsx                 → Root component with admin/user mode switching

\- src/components/AppLayout.tsx → Basic layout structure with layout wrapper



===========================

PHASE 2: Layout \& Modern Sidebar

===========================

🎯 Goal: Modern UI with left sidebar containing organized tools



Files:

\- src/components/Sidebar.tsx        → Left sidebar with grouped tool sections

\- src/components/MainContent.tsx    → Main SVG/canvas area

\- src/styles/globals.css            → Clean modern styles (no fieldsets)

\- Update: AppLayout.tsx             → Connect sidebar to main content



===========================

PHASE 3: User Functionality

===========================

🎯 Goal: Implement user-side seat selection + pan/zoom



Files:

\- src/components/UserCanvas.tsx         → SVG layout rendered for users

\- src/components/shared/SVGSeat.tsx     → Individual seat rendering + interaction

\- src/components/shared/ZoomControls.tsx→ UI controls for zoom/pan

\- src/utils/useSVGUtils.ts              → Utility functions for SVG manipulation



===========================

PHASE 4: Designer Core Tools

===========================

🎯 Goal: Add/drag/select seats for layout creation



Files:

\- src/components/DesignerCanvas.tsx → Canvas for layout designing

\- src/utils/svgHelpers.ts           → Core SVG logic functions

Implement:

✔ Add seat

✔ Drag/drop

✔ Selection

✔ Basic tool actions



===========================

PHASE 5: Advanced Drawing Tools

===========================

🎯 Goal: Bring in full set of advanced features



Tools:

✔ Pen tool with bezier path drawing

✔ Rectangle \& circle with resizable handles

✔ Text tool with in-place editing

✔ Background image support

✔ Rotation for elements



===========================

PHASE 6: Polish \& Final Features

===========================

🎯 Goal: Achieve full feature parity + improved UX



Tasks:

✔ Save/load layouts (no localStorage)

✔ Grid layout generation (rows/cols/size)

✔ Zoom \& pan refinements

✔ Clean, modern button \& icon styling

✔ Fully responsive UI



===========================

✅ Confirmed Requirements:

===========================

✔ Keep ALL existing features:

   - Pen, shapes, text, background images, zoom/pan, rotation, drag



✔ Modern Sidebar:

   - Grouped tool sections, no clutter



✔ Better UI/UX:

   - Clean layout, modern buttons, no `<fieldset>`



✔ No LocalStorage:

   - Prepare for client-server sync later



✔ Same Functionality:

   - Everything behaves same — just cleaner + scalable



===========================

🔧 Target Structure Summary:

===========================

📦 Left sidebar → tools grouped cleanly

📐 Clean interface → no clutter or legacy styles

🔁 Maintain all current functionality

🧠 Zustand for state → easy updates \& scale

🛠 TypeScript → safer, scalable code

📱 Responsive Design → mobile ready

