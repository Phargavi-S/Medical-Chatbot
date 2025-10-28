# Medical Chatbot Design Guidelines

## Design Approach

**Selected Approach:** Hybrid - Design System with Reference-Based Elements

**Primary Inspiration:** ChatGPT's conversational interface + Linear's clean minimalism + professional medical portals (Mayo Clinic, WebMD) for trust and credibility

**Key Design Principles:**
- Trust through clarity: Medical information demands exceptional readability and clear visual hierarchy
- Conversational ease: Chat should feel natural while maintaining professional credibility
- Citation prominence: Source references must be immediately visible and accessible
- Information density: Balance comprehensive medical data with scannable layouts

---

## Core Design Elements

### A. Typography

**Font Stack:**
- Primary: Inter (via Google Fonts) - Clean, highly legible for medical content
- Monospace: JetBrains Mono - For citations, references, technical terms

**Type Scale:**
- Page Title: text-4xl font-bold (Medical Chatbot)
- Chat Message Headers: text-sm font-semibold uppercase tracking-wide
- Primary Message Text: text-base leading-relaxed
- Citations/References: text-sm font-mono
- Metadata (timestamps): text-xs
- Input Field: text-base

**Hierarchy Rules:**
- User messages: Regular weight, clear contrast from bot responses
- Bot responses: Slightly bolder weight for medical answers
- Citations: Distinct monospace treatment with subtle background panels
- Medical terms: Maintain consistent weight, use subtle background highlighting for emphasis

---

### B. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, and 16 (e.g., p-4, gap-6, space-y-8)

**Core Layout Structure:**

1. **Application Shell** (Full viewport height)
   - Header: h-16 with logo, settings icon
   - Chat Container: flex-1 with max-w-4xl mx-auto
   - Input Area: Fixed bottom with backdrop blur

2. **Chat Message Layout:**
   - Message bubbles: max-w-3xl with p-6
   - User messages: ml-auto (right-aligned) with max-w-2xl
   - Bot responses: full width utilization for medical content
   - Gap between messages: space-y-6

3. **Grid System for Citations:**
   - Citation cards: grid grid-cols-1 md:grid-cols-2 gap-4
   - Each citation: p-4 rounded-lg border

4. **Responsive Breakpoints:**
   - Mobile: Single column, p-4 container padding
   - Tablet (md:): p-6 container padding, max-w-3xl
   - Desktop (lg:): p-8 container padding, max-w-4xl

---

### C. Component Library

#### 1. Navigation/Header
- Fixed header: h-16 with px-6 py-4
- Left: Logo/branding with "Medical Chatbot" text
- Center: Optional conversation title
- Right: Settings icon, new chat button

#### 2. Chat Message Components

**User Message Bubble:**
- Right-aligned with ml-auto
- Rounded-2xl with rounded-br-sm (chat tail effect)
- p-4 padding
- max-w-2xl width constraint
- Shadow: shadow-sm

**Bot Response Container:**
- Full width with subtle border-l-4 accent
- p-6 padding
- Rounded-lg
- Space-y-4 for internal sections

**Bot Response Structure:**
1. Header: Small label "Medical AI Response" with timestamp
2. Main Content: Prose formatting with leading-relaxed
3. Citations Section: Border-t mt-6 pt-6
4. Individual Citations: Grid layout with cards

#### 3. Citation Cards
- Border rounded-lg with p-4
- Grid: grid-cols-1 md:grid-cols-2 gap-4
- Each card contains:
  - Source title: font-semibold text-sm
  - Excerpt: text-sm line-clamp-2
  - Link icon/button: text-xs with external link indicator

#### 4. Input Area
- Fixed bottom with backdrop-blur-xl
- Border-t with subtle elevation
- Container: max-w-4xl mx-auto px-6 py-4
- Textarea: flex-1 with rounded-xl border
- Min height: min-h-[60px]
- Max height: max-h-[200px] with overflow-y-auto
- Send button: Positioned absolute right-2 bottom-2

#### 5. Empty State
- Centered content with max-w-2xl mx-auto
- Illustration placeholder or medical icon (96x96)
- Heading: text-2xl font-semibold mb-4
- Subtitle: text-base mb-8
- Suggested questions: Grid of 2x2 cards (grid-cols-1 md:grid-cols-2 gap-4)
- Each suggestion card: p-6 rounded-xl border hover:shadow-md transition

#### 6. Loading States
- Typing indicator: Three animated dots (w-2 h-2 rounded-full)
- Skeleton for bot response: Animated pulse with space-y-3
- Loading overlay for file processing: Backdrop with spinner

#### 7. Medical Content Formatting
- Symptoms lists: List with pl-6 space-y-2
- Treatment steps: Ordered list with counter styling
- Warning callouts: Border-l-4 with p-4 rounded-r-lg
- Dosage information: Monospace font in subtle containers

---

### D. Interaction Patterns

**Message Sending:**
- Enter key sends (Shift+Enter for new line)
- Send button disabled when empty
- Auto-focus on input after sending
- Smooth scroll to bottom on new message

**Citation Interactions:**
- Hover on citation cards: Subtle elevation increase (shadow-md)
- Click expands full source or opens in modal
- Copy citation button for easy reference

**Chat History:**
- Smooth scroll with momentum
- Auto-scroll to bottom on new messages
- Scroll indicator when new message arrives while scrolled up

**Responsive Behavior:**
- Mobile: Full-screen chat, collapsible citation panels
- Tablet/Desktop: Side-by-side citation viewing option

---

## Images

**Hero/Welcome State Image:**
- **Location:** Center of empty state (before first message)
- **Type:** Medical illustration or abstract healthcare visual
- **Size:** 240x240 (w-60 h-60)
- **Description:** Clean, modern medical icon set or stethoscope/DNA helix illustration in line art style
- **Treatment:** Subtle opacity (opacity-20) as background element

**No large hero image** - This is a utility application where functionality takes precedence

---

## Accessibility & Polish

- Ensure all interactive elements meet 44x44px touch target minimum
- Maintain 4.5:1 text contrast ratios throughout
- Keyboard navigation: Tab through input, send button, citation cards
- Focus indicators: ring-2 ring-offset-2 on all interactive elements
- Screen reader labels: Descriptive aria-labels for icons and actions
- Message timestamps: Include aria-live regions for new messages
- Citation links: Clear indication of external links

---

## Special Considerations for Medical Context

1. **Trust Indicators:**
   - Always show citation sources prominently
   - Include disclaimer text at bottom: "This chatbot provides information, not medical advice. Consult healthcare professionals for diagnosis."
   - Timestamp all responses for reference tracking

2. **Information Density:**
   - Use collapsible sections for lengthy medical explanations
   - Implement "Read more" for extended content
   - Highlight key medical terms with subtle background treatment

3. **Citation Prominence:**
   - Citations are first-class citizens, not footnotes
   - Each citation includes: Source name, relevant excerpt, confidence indicator
   - Easy copy-to-clipboard functionality

4. **Professional Presentation:**
   - Avoid playful or casual design elements
   - Maintain serious, credible aesthetic throughout
   - Use precise, medical-appropriate terminology in UI labels