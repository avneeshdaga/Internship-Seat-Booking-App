 # Seat Booking System

A comprehensive seat booking application with both vanilla JavaScript/TypeScript and modern React implementations. The system allows users to select seats for booking while providing administrators with powerful design tools to create and customize seating layouts.

## Overview

This project started as a vanilla JavaScript seat booking system and has evolved into a modern React application using Vite. The system supports:

- **User Mode**: Seat selection, booking confirmation, and zoom/pan functionality
- **Admin Mode**: Full layout design with drawing tools, shapes, text, and background images
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Live seat availability and selection tracking

The project demonstrates a complete migration from vanilla JS to React, maintaining all original functionality while improving code organization, type safety, and user experience.

## Features

### Core Functionality
- ✅ **Seat Selection**: Click to select/deselect seats with visual feedback
- ✅ **Booking System**: Confirm bookings with price calculation
- ✅ **Seat Availability**: Track occupied and available seats
- ✅ **Price Calculation**: Automatic total calculation based on selected seats
- ✅ **Grid Layouts**: Generate customizable grid-based seating arrangements

### Admin Design Tools
- ✅ **Pen Tool**: Draw custom bezier curves with control points
- ✅ **Shape Tools**: Add resizable rectangles and circles
- ✅ **Text Tool**: Add editable text elements with font controls
- ✅ **Background Images**: Upload and position background images for layout tracing
- ✅ **Rotation**: 90-degree rotation of elements
- ✅ **Zoom & Pan**: Smooth zooming and panning in both modes
- ✅ **Drag & Drop**: Intuitive element manipulation
- ✅ **Color Controls**: Customize stroke colors and widths
- ✅ **Layout Management**: Save/load layouts as JSON

### User Experience
- ✅ **Responsive Design**: Mobile-friendly touch interactions
- ✅ **Tooltips**: Seat information on hover
- ✅ **Success Animations**: Booking confirmation feedback
- ✅ **Keyboard Shortcuts**: Efficient admin controls
- ✅ **Touch Support**: Pinch-to-zoom and drag on mobile

## Tech Stack

### Vanilla Version
- **JavaScript/TypeScript**: Core logic and DOM manipulation
- **SVG**: Vector graphics for seats and drawing tools
- **HTML5**: Structure and file uploads
- **CSS3**: Styling and animations

### React Version (seat-booking-vite/)
- **React 18**: Component-based UI
- **TypeScript**: Type safety and better development experience
- **Vite**: Fast build tool and development server
- **Zustand**: Lightweight state management
- **SVG**: Canvas rendering
- **CSS Modules**: Scoped styling

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd booking-ticket-project
   ```

2. **Install React version dependencies**:
   ```bash
   cd seat-booking-vite
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   The application will open at `http://localhost:3000`

### Alternative: Run Vanilla Version
Simply open index.html in a web browser for the original vanilla implementation.

## Usage

### User Mode
1. Switch to "User" mode using the toggle in the header
2. Set maximum selectable seats if prompted
3. Click seats to select/deselect them
4. Use mouse wheel or zoom controls to zoom in/out
5. Drag to pan around the layout
6. Click "Confirm Booking" to complete your selection

### Admin Mode
1. Switch to "Admin" mode using the toggle in the header
2. **Grid Generation**: Set rows, columns, and seat size to create a grid
3. **Drawing Tools**:
   - **Pen Tool**: Click to add points, drag handles for curves
   - **Rectangle/Circle**: Click canvas to add shapes
   - **Text Tool**: Click to add editable text
4. **Background Images**: Upload images for layout tracing
5. **Element Manipulation**: Select elements to edit colors, sizes, and positions
6. **Layout Management**: Export/import layouts as JSON files

### Keyboard Shortcuts (Admin Mode)
- **Delete**: Remove selected elements
- **Escape**: Deselect current selection
- **Arrow Keys**: Rotate selected paths/shapes

## Project Structure

```
booking-ticket-project/
├── index.html                    # Vanilla version entry point
├── script.js                     # Vanilla JavaScript implementation
├── script.ts                     # TypeScript version of vanilla code
├── styles.css                    # Vanilla version styles
├── tsconfig.json                 # TypeScript config for vanilla
├── list of functions.txt         # Feature checklist
├── structure react plan.txt      # React architecture plan
├── React Project Refactor Plan.md # Development roadmap
├── seat-booking-vite/           # React application
│   ├── index.html               # Vite entry point
│   ├── package.json             # Dependencies and scripts
│   ├── tsconfig.json            # TypeScript config
│   ├── vite.config.ts           # Vite configuration
│   ├── src/
│   │   ├── main.tsx             # React app entry
│   │   ├── App.tsx              # Root component
│   │   ├── components/
│   │   │   ├── AppLayout.tsx    # Main layout wrapper
│   │   │   ├── Sidebar.tsx      # Admin/user controls
│   │   │   ├── MainContent.tsx  # SVG canvas and seats
│   │   │   └── shared/
│   │   │       ├── SVGSeat.tsx  # Individual seat component
│   │   │       ├── ZoomControls.tsx # Zoom UI
│   │   │       └── SuccessNotification.tsx # Booking feedback
│   │   ├── hooks/
│   │   │   ├── useSeatStore.ts  # Zustand state management
│   │   │   └── useSVGUtils.ts   # SVG utilities hook
│   │   ├── types/
│   │   │   └── index.ts         # TypeScript interfaces
│   │   ├── utils/
│   │   │   └── svgHelpers.ts    # SVG helper functions
│   │   └── styles/
│   │       └── globals.css      # Global styles
│   ├── fix-imports.bat          # Windows import fix script
│   ├── fix-imports.ps1          # PowerShell import fix script
│   └── verify-phase2.ps1        # Verification script
└── .gitignore                   # Git ignore rules
```

## Development Timeline

This project was developed over approximately 2 months, following a structured phased approach:

### Phase 1: Core Setup & State Management (Week 1)
- ✅ Established TypeScript interfaces and types
- ✅ Implemented Zustand store replicating all vanilla state
- ✅ Created basic React app structure
- ✅ Set up Vite build system

### Phase 2: Layout & Modern Sidebar (Week 2-3)
- ✅ Built modern sidebar with grouped tool sections
- ✅ Implemented MainContent component with SVG canvas
- ✅ Migrated core functionality from vanilla to React
- ✅ Added responsive design and mobile support

### Phase 3: User Experience Polish (Week 4)
- ✅ Added seat tooltips and hover effects
- ✅ Implemented touch interactions for mobile
- ✅ Created success notification system
- ✅ Reduced unnecessary animations for better performance

### Phase 4: Designer Core Tools (Week 5-6)
- ✅ Implemented pen tool with bezier curves
- ✅ Added rectangle and circle shape tools
- ✅ Created text tool with editing capabilities
- ✅ Added background image support

### Phase 5: Advanced Drawing Tools (Week 7-8)
- ✅ Enhanced shape manipulation (resize, rotate)
- ✅ Added color and stroke width controls
- ✅ Implemented element selection and editing
- ✅ Added layout export/import functionality

### Phase 6: Final Polish (Ongoing)
- 🔄 Code Organisation and readability for outside developers
- 🔄 Performance optimizations
- 🔄 SVG export functionality
- 🔄 Final testing and bug fixes

### Key Commits and Milestones
- **Initial Setup**: Basic React structure and state management
- **UI Migration**: Complete sidebar and main content components
- **Feature Parity**: All vanilla features migrated to React
- **UX Improvements**: Mobile support and animations
- **Drawing Tools**: Complete admin design functionality
- **Polish**: Performance and final refinements

## Building and Deployment for Advanced Use

### Development
```bash
cd seat-booking-vite
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Type Checking
```bash
npm run type-check  # If configured
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing TypeScript and React patterns
- Maintain feature parity between vanilla and React versions
- Add proper type definitions for new features
- Test on both desktop and mobile devices
- Update documentation for new features
- Maintain original vanilla code for reuasabilty and going back to look at

## Acknowledgments

- Original vanilla implementation provided the foundation
- React migration maintained all existing functionality
- Vite enabled fast development and building
- Zustand simplified state management
- SVG provides crisp, scalable graphics

---

**Note**: To Recruiters: This project showcases my ability to manage a full-scale refactor, troubleshoot complex SVG coordinate systems, and utilize AI-assisted refactoring alongside senior mentorship to deliver a production-ready interface.

**Note**: This project demonstrates a complete web application lifecycle from vanilla JavaScript to modern React, showcasing (almost)best practices in code organization, type safety, and user experience design.
