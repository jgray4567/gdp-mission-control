You are a principal product designer, UX architect, systems thinker, and front-end product strategist responsible for designing a production-ready Design Studio Administration Dashboard for Grayson Design Partners.

Your job is to create a clean, elegant, highly efficient admin platform that reflects the premium, strategic, and highly disciplined brand identity of Grayson Design Partners.

This is not a generic SaaS dashboard. It is the internal operating system of a high-end design and strategy studio.

The experience must feel:
Precise
Refined
Confident
Intelligent
Understated
Highly intentional
Operationally clear

The interface should embody the same level of craft and discipline that Grayson Design Partners delivers to its clients.

--------------------------------------------------
BRAND INTEGRATION: GRAYSON DESIGN PARTNERS
--------------------------------------------------

Design the system to reflect a premium, modern, restrained brand.

Visual tone:
Minimal
Architectural
Systematic
High-contrast where needed
Quiet but authoritative

Color system:
Primary background: clean white or soft off-white
Secondary surfaces: light neutrals (warm gray or cool gray)
Primary text: near-black
Secondary text: mid-gray
Accent color: a single refined accent (deep slate, muted navy, or desaturated green)
Success: restrained green
Warning: muted amber
Error: deep red (used sparingly)

Avoid:
Bright saturated colors
Playful palettes
Gradients unless extremely subtle
Overuse of accent color

Typography:
Modern sans-serif (e.g., Inter, Helvetica Now, or similar)
Strong hierarchy
Tight leading for headers
Comfortable spacing for body text
Numeric alignment for data-heavy areas

Spacing and layout:
Generous whitespace
Consistent grid system
Aligned edges
Predictable rhythm
No visual clutter

Components should feel:
Sharp
Precise
Lightweight
Intentional

Micro-interactions:
Fast
Subtle
No bounce or playful motion
Smooth opacity and position transitions only

Brand expression through UI:
Confidence comes from restraint
Clarity over decoration
Hierarchy over embellishment
Precision over density

--------------------------------------------------
CORE PRODUCT DIRECTION
--------------------------------------------------

The dashboard must be:
Super clean and visually restrained
Simple to use with minimal cognitive load
Highly structured and information-dense without feeling cluttered
Fast to scan, with strong hierarchy and obvious next actions
Desktop-first, tablet-compatible

Automation is deeply integrated via Jarvis (OpenClaw agent).

--------------------------------------------------
PRIMARY OBJECTIVE
--------------------------------------------------

Enable Grayson Design Partners to:
Track all active jobs in real time
Monitor deadlines and delivery risk
Surface client alerts immediately
Manage incoming inquiries efficiently
Access full client history
Trigger billing instantly via “Bill It”
Understand studio performance through refined data visualization
Minimize manual work via Jarvis automation

--------------------------------------------------
GLOBAL UX PRINCIPLES
--------------------------------------------------

Every screen must answer:
What needs attention?
What is at risk?
What is ready to move forward?
What can be billed?
What is automated vs manual?

Design for:
Speed of understanding
Low cognitive load
High signal / low noise
Clear next actions

--------------------------------------------------
INFORMATION ARCHITECTURE
--------------------------------------------------

Primary Navigation:
Dashboard
Live Jobs
Timeline
Clients
Inquiries
Billing
Alerts
Reports
Settings

Global utilities:
Search (persistent, fast)
Notifications
Jarvis activity
Quick actions
User profile

--------------------------------------------------
DASHBOARD (COMMAND CENTER)
--------------------------------------------------

Top KPI band:
Active Jobs
Due This Week
Overdue
At Risk
New Inquiries
Unread Alerts
Revenue Ready to Bill
Revenue Billed (MTD)
Avg Turnaround Time
Studio Capacity

Primary modules:
Urgent Alerts (top priority)
Live Jobs (condensed)
Ready to Bill queue
Upcoming Deadlines
Inquiry Pipeline snapshot
Client Activity summary

Secondary modules:
Workload distribution
Revenue trends
Job status distribution
Deadline heatmap

Design guidance:
Flat, structured cards
Minimal borders
Subtle dividers
No heavy shadows
Strong alignment

--------------------------------------------------
LIVE JOBS SYSTEM
--------------------------------------------------

Each job includes:
Job name
Client
Service type
Owner
Team
Stage
Priority
Status
Start date
Due date
Days remaining
Progress %
Budget
Billable amount
Risk flags
Next action
Recent activity
“Bill It” button

Views:
Table (default)
List
Grouped (status/stage)
Timeline
Kanban (optional)

Design:
Highly legible rows
Tight but breathable spacing
Status chips minimal and clear
Deadline emphasis via subtle color + typography

“Bill It” Button:
Primary but restrained
Only active when criteria met
Disabled state with explanation
Triggers Jarvis billing workflow

--------------------------------------------------
CLIENT ALERTS CENTER
--------------------------------------------------

Alert types:
Urgent messages
Approval delays
Missed deadlines
Budget issues
Scope creep
Payment issues
VIP alerts
SLA risks

Design:
Priority-based stacking
Subtle color coding
Clear action text
Direct links to job/client

Jarvis generates alerts automatically.

--------------------------------------------------
TIMELINE + DEADLINES
--------------------------------------------------

Views:
Master timeline
Calendar
Milestones
Per-job timeline

Features:
Today marker
Late indicators
Dependency visualization
Risk indicators
Deadline confidence

Design:
Minimal grid
Clean horizontal flow
Muted lines
Clear emphasis on critical dates

--------------------------------------------------
INQUIRY PIPELINE
--------------------------------------------------

Fields:
Source
Date
Contact
Project type
Budget
Urgency
Stage
Assigned owner
Follow-up status
Conversion likelihood
Jarvis summary

Stages:
New
Review
Qualified
Discovery
Proposal
Negotiation
Won
Lost

Jarvis automates:
Parsing
Scoring
Routing
Follow-ups
Conversion

--------------------------------------------------
CLIENT PROFILES
--------------------------------------------------

Include:
Contacts
All jobs
Inquiry history
Billing history
Alerts
Communication log
Notes
Jarvis summary
Lifetime value
Relationship health

Design:
Structured sections
Expandable panels
Chronological clarity

--------------------------------------------------
BILLING + FINANCIAL VISIBILITY
--------------------------------------------------

Show:
Ready to bill
Outstanding invoices
Revenue pending
Monthly totals
Billing lag
Milestones complete

“Bill It” available everywhere relevant.

Jarvis automates:
Invoice prep
Logging
Notifications
Status updates

--------------------------------------------------
WORKLOAD + OPERATIONS
--------------------------------------------------

Show:
Team workload
Capacity
Overload risk
Job distribution
Review bottlenecks

Visuals:
Bar charts
Heatmaps
Distribution charts

--------------------------------------------------
DATA VISUALIZATION PRINCIPLES
--------------------------------------------------

Use only when valuable.

Preferred:
Line charts
Bar charts
Stacked bars
Progress bars
Heatmaps
Sparklines

Avoid:
3D charts
Decorative visuals
Bright colors

Style:
Minimal axes
Subtle gridlines
Clear labels
No chart clutter

--------------------------------------------------
JARVIS (AUTOMATION LAYER)
--------------------------------------------------

Jarvis handles:
Inquiry intake + parsing
Lead scoring
Job creation
Timeline updates
Risk detection
Alert generation
Billing triggers
Notifications
Daily summaries
Workflow automation

UI should show:
Jarvis insights
Recommendations
Auto-generated summaries
Activity log

No gimmicks. No chat-first UI required.

--------------------------------------------------
KEY INTERACTION PATTERNS
--------------------------------------------------

Fast navigation
Inline editing
Expandable rows
Side panels instead of page jumps
One-click access to critical actions
Immediate visibility of next steps

--------------------------------------------------
JOB DETAIL VIEW
--------------------------------------------------

Header:
Job name
Client
Stage
Owner
Due date
Priority
Billing status

Sections:
Progress
Timeline
Tasks/milestones
Activity log
Client communication
Jarvis insights
Risk flags
Dependencies

“Bill It” in header

--------------------------------------------------
ACCESSIBILITY + CLARITY
--------------------------------------------------

High contrast
Readable typography
Clear status beyond color
Large hit targets
Keyboard-friendly where possible

--------------------------------------------------
DESIGN SYSTEM
--------------------------------------------------

Define:
Grid system
Spacing scale
Typography scale
Color tokens
Component library

Components:
Navigation
Cards
Tables
Filters
Alerts
Buttons
Charts
Timeline
Drawers
Forms
Status chips
Empty states
Loading states

All components must reflect Grayson Design Partners brand:
Minimal
Precise
Elegant
Consistent

--------------------------------------------------
USER ROLES
--------------------------------------------------

Studio Owner
Operations Manager
Project Manager
Account Lead
Finance/Admin
Creative Lead

Support role-based views and priorities.

--------------------------------------------------
CRITICAL WORKFLOWS
--------------------------------------------------

Review dashboard priorities
Resolve alert
Manage live job
Update job status
Trigger “Bill It”
Process inquiry
Convert inquiry to job
Review client history
Analyze workload
Act on Jarvis recommendations

--------------------------------------------------
EDGE CASES
--------------------------------------------------

On-hold projects
Rush jobs
Multiple jobs per client
Partial billing
Delayed approvals
Scope changes
Over-budget jobs
VIP clients
Incomplete inquiries
Stalled projects

--------------------------------------------------
FINAL INSTRUCTION
--------------------------------------------------

Design a complete, production-ready dashboard system for Grayson Design Partners that functions as a refined operational command center.

The system must:
Feel premium and intentional
Be effortless to use
Surface what matters instantly
Leverage Jarvis automation deeply
Enable fast, confident decision-making
Support scaling without adding complexity

Clarity, precision, and restraint define the experience.
