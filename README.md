# NANTI: Your WhatsApp Memory

Build NANTI — AI Memory for WhatsApp

Build a polished, production-quality MVP web app called NANTI.

Product concept

NANTI is an AI-powered personal/work assistant designed specifically for people in Indonesia who use WhatsApp as their main place for work communication.

The core problem:

People discuss work inside many WhatsApp groups and individual chats. They constantly say things like:

"Besok saya kirim."

"Tolong cek ini ya."

"Nanti follow up Pak Budi."

"Saya tunggu approval."

"Bisa selesai Jumat?"

"Jangan lupa kirim PO."

"Nanti saya update."

WhatsApp stores the conversations, but it does not understand the user's commitments, deadlines, follow-ups, things they are waiting for, or things they may have forgotten.

NANTI turns conversations into an intelligent work memory.

The product should NOT feel like Monday.com, Asana, or a traditional project-management tool.

The product should feel like an AI chief of staff that understands what happened in your conversations and tells you what you need to do next.

Core positioning:

NANTI
Never lose a commitment in WhatsApp again.

IMPORTANT PRODUCT PRINCIPLE

Do not force the user to manually create tasks.

The user should primarily communicate naturally and let AI detect:

tasks

commitments

deadlines

people responsible

people the user is waiting for

projects

priorities

follow-ups

unresolved conversations

The main value is:

Conversation → Understanding → Memory → Reminder → Action

MVP SCOPE

Do NOT attempt to build direct WhatsApp API integration yet.

Build the MVP around manually importing/forwarding conversation content.

The first version should support:

Pasting a WhatsApp message

Uploading a screenshot of a WhatsApp conversation

Uploading a text conversation

Adding sample/demo conversations

AI extraction of commitments and tasks

Daily task dashboard

Waiting-for tracking

People tracking

Projects

AI daily briefing

AI "What am I forgetting?" feature

The architecture should be ready for future WhatsApp integration.

Do not pretend that the app is already connected to WhatsApp.

DESIGN DIRECTION

Create a premium, modern, calm productivity product.

It should look closer to:

Linear

Superhuman

Notion

Arc

modern AI products

than traditional corporate project-management software.

Visual direction:

warm off-white / very light neutral background

dark text

subtle gray borders

restrained use of accent color

premium typography

generous whitespace

minimal cards

subtle shadows

excellent spacing

smooth micro-interactions

polished empty states

responsive design

Avoid:

generic SaaS gradients

excessive glassmorphism

giant colorful dashboards

childish illustrations

overly complicated charts

too many cards

enterprise ERP aesthetics

The product should feel intelligent, premium and trustworthy.

Use a clean sans-serif typeface.

The interface should feel extremely fast and simple.

TARGET USER

Primary user:

An Indonesian business owner / manager / salesperson / project manager who belongs to 20–100 WhatsApp groups.

Example groups:

Office

Sales

Factory

Client

Supplier

Marketing

Project

Family business

Property

Vendors

The user is overwhelmed by conversations and frequently forgets small commitments.

APP STRUCTURE

Create these main navigation items:

Today

Inbox

Waiting

Projects

People

AI

Settings

Use a left sidebar on desktop.

On mobile use a bottom navigation with:

Today / Inbox / Waiting / AI

SCREEN 1 — TODAY

This is the most important screen.

The headline should say:

Good morning, Rizky

Under it:

Thursday, August 13

Then show an AI-generated summary:

You have 6 things to handle today.
2 are overdue.
3 people are waiting for you.

Then sections:

OVERDUE

Example:

Send revised quotation
PT ABC
Due yesterday

Follow up supplier
CV Maju Jaya
Due 2 days ago

Use subtle urgency indicators.

DUE TODAY

Example:

Send revised catalogue
PT ABC
10:00

Check production update
Factory Group
12:00

Approve artwork
Marketing
16:00

WAITING

Example:

Budi — quotation approval
Waiting 3 days

Supplier — shipping confirmation
Waiting 2 days

At the bottom:

AI SUGGESTION

You promised Budi a revised quotation yesterday, but I cannot find a quotation being sent after that conversation.

Buttons:

Follow up
Mark complete
Dismiss

SCREEN 2 — INBOX

This screen contains conversations or imported messages that the AI has analyzed.

Header:

Inbox

Subheader:

Things NANTI found in your conversations

Create tabs:

All
Tasks
Commitments
Follow-ups
Deadlines

Each item should show:

Example

Send revised catalogue

"Besok saya kirim revisinya ya Pak."

Detected as:

Commitment

Due:

Tomorrow

Person:

Budi — PT ABC

Source:

Client ABC

Buttons:

Track
Ignore

When Track is clicked, it becomes an active item.

SCREEN 3 — COMMITMENT DETAIL

Create a detailed side panel/modal when clicking a task.

Show:

Title
Description
Person
Project
Due date
Priority
Status
Source conversation
Original message
Created by AI
AI confidence

Example:

Send revised catalogue

Person
Budi — PT ABC

Project
ABC Export Order

Due
August 14, 2026

Status
Open

Detected from
Client ABC

Original message:

"Besok saya kirim revisinya ya Pak."

Then show:

AI interpretation

Rizky committed to sending a revised catalogue tomorrow.

Buttons:

Mark complete
Snooze
Change date
Assign project
Delete

SCREEN 4 — WAITING

This should be one of the signature features.

Header:

Waiting for

Subheader:

People and things you are waiting on

Display items such as:

Budi — PT ABC

Waiting for:
Quotation approval

Since:
August 10

Waiting:
3 days

Supplier China

Waiting for:
Shipping confirmation

Since:
August 11

Waiting:
2 days

Siska — Marketing

Waiting for:
Final artwork

Since:
August 12

Waiting:
1 day

Each item should have:

Follow up
Mark received
Snooze

Highlight items that have been waiting unusually long.

At the top, show:

5 unresolved waiting items

This feature should feel more valuable than a generic task list.

SCREEN 5 — PROJECTS

The AI should group work into projects.

Example:

ABC Export

8 open
3 waiting
2 overdue

Bali Villa

6 open
1 overdue
4 waiting

Marketing Campaign

4 open
0 overdue

Click a project to see:

Overview
Tasks
Waiting
People
Conversation sources
Recent activity

SCREEN 6 — PEOPLE

Create an automatic relationship/work memory.

Example:

Budi Santoso

PT ABC

Last conversation:
August 12

Open commitments:
2

Waiting from Budi:
1

Your commitments:
2

Recent activity:

Aug 12
Budi asked for revised pricing.

Aug 11
You promised updated catalogue.

Aug 9
Quotation sent.

Buttons:

View commitments
View conversation
Follow up

Also allow search.

SCREEN 7 — AI ASSISTANT

This should be a conversational AI interface.

Header:

Ask NANTI

Subtitle:

Your work memory

Example suggested questions:

What am I forgetting?

What do I need to do today?

Who am I waiting for?

Who is waiting for me?

What did I promise this week?

What is overdue?

What are the most urgent things?

What happened in the Factory project?

Who should I follow up with today?

When user asks:

"What am I forgetting?"

Return a thoughtful answer such as:

I found 3 unresolved commitments that may need attention.

Then:

1. Revised quotation — Budi
   You said you would send it yesterday.

2. Shipping confirmation — Supplier
   No response for 3 days.

3. Factory progress
   Your team discussed a production delay but no person appears assigned.

Each result should have actions.

SCREEN 8 — DAILY BRIEFING

Create a special AI briefing card.

Example:

Your day

6 tasks
2 overdue
3 waiting
1 important follow-up

Then AI-written summary:

Your biggest priority today is the ABC export order. Budi is waiting for the revised quotation and the supplier has not confirmed shipping.

Show:

Top priority
Potentially forgotten
People to follow up
Tasks due today

This should feel like an AI chief-of-staff briefing.

SCREEN 9 — END OF DAY

Create an "End of Day Sweep".

At 17:30 the user sees:

Before you finish today

You still have:

3 unresolved commitments

Send quotation to Budi

Check warehouse photos

Follow up supplier

Ask:

Move unfinished work to tomorrow?

Buttons:

Move all to tomorrow

or individual actions.

AI EXTRACTION LOGIC

Create realistic demo AI behavior.

When a conversation is entered, AI should classify statements into:

TASK

"Tolong cek stok besok."

COMMITMENT

"Besok saya kirim."

DEADLINE

"Harus selesai Jumat."

WAITING

"Saya masih tunggu approval."

FOLLOW-UP

"Nanti follow up lagi ya."

QUESTION

"Sudah dikirim?"

INFORMATION

"Meeting dipindah ke jam 3."

Do NOT turn every sentence into a task.

The AI should distinguish normal conversation from actionable commitments.

DEMO DATA

Prepopulate the app with realistic Indonesian business data.

Create 20–30 example messages across:

Group:

PT ABC Export

Group:

Factory Operations

Group:

Marketing Team

Group:

Bali Villa Project

Group:

Supplier

Group:

Management

Use realistic Bahasa Indonesia.

Example:

"Pak Rizky, untuk order ABC yang 500 pcs itu mereka minta update price hari ini ya."

AI should detect:

Task:
Update pricing for ABC

Due:
Today

Priority:
High

Example:

"Besok saya kirim revisi quotation-nya Pak."

AI should detect:

Commitment:
Send revised quotation

Due:
Tomorrow

Example:

"Saya masih tunggu approval dari owner."

AI should detect:

Waiting:
Owner approval

Example:

"Kalau sudah ada kabar dari supplier kabarin saya ya."

AI should detect:

Follow-up:
Supplier status

DATABASE

Use Supabase for the backend.

Create proper authentication and a relational database.

Tables should include:

users
workspaces
conversations
conversation_messages
tasks
commitments
waiting_items
people
projects
task_people
task_projects
notifications
ai_insights
daily_briefings

Every record containing user/workspace information must be protected by Row Level Security.

Never allow one user's data to be visible to another user.

Use server-side authentication for protected operations.

Do not put secrets or API keys in frontend code.

Lovable supports Supabase for authentication, PostgreSQL database, storage and server-side functions, so use that architecture.

AUTHENTICATION

Create:

Sign up
Login
Forgot password
Logout

Support Google login as an option.

After login:

If new user:
→ onboarding

If returning user:
→ Today dashboard

Lovable supports Google authentication, so keep the architecture compatible with it.

ONBOARDING

Make onboarding very short.

Screen 1:

Welcome to NANTI

Your WhatsApp is full of work.
NANTI makes sure nothing gets forgotten.

Button:

Get started

Screen 2:

What kind of work do you do?

Options:

Business owner
Sales
Project management
Operations
Marketing
Property
Other

Screen 3:

How many work conversations do you usually have?

1–10
10–30
30–100
100+

Screen 4:

Import your first conversation

Options:

Paste message
Upload screenshot
Try demo

IMPORT EXPERIENCE

Create a beautiful input area.

Placeholder:

Paste a WhatsApp message or conversation here...

Button:

Analyze with NANTI

Also allow:

Upload screenshot

After analysis show:

I found 4 actionable items

Send revised quotation

Follow up supplier

Check factory update

Waiting for approval

Allow user to approve each item individually.

Buttons:

Track all

or

Track selected

NOTIFICATIONS

Create in-app notification infrastructure.

Types:

Task due
Task overdue
Waiting too long
New AI insight
Daily briefing
End-of-day sweep

Allow users to configure notification times.

Default:

Daily briefing:
08:00

End-of-day:
17:30

MOBILE

This product is ultimately mobile-first.

Make all screens responsive.

On mobile:

Bottom navigation:

Today
Inbox
Waiting
AI

Use floating action button:

When clicked:

Paste message
Upload screenshot
Add manually

The mobile interface should feel like a native productivity app.

DESKTOP

Desktop should have:

Sidebar
Main content
Optional right-side AI panel

Use keyboard-friendly interactions.

DESIGN DETAILS

Use subtle motion:

cards fade/slide in

task completion animation

smooth modal transitions

AI typing state

loading skeletons

Keep animations restrained.

Make the interface feel extremely fast.

Use familiar icons.

Do not overload the screen.

BRAND

Brand name:

NANTI

Logo should be simple and typographic.

Potential tagline:

Never lose a commitment in WhatsApp again.

Tone:

Smart
Calm
Trustworthy
Helpful
Human
Indonesian

The product should not feel robotic.

AI responses should use natural Bahasa Indonesia.

Use Indonesian language throughout the main demo.

Allow future English support.

IMPORTANT: DO NOT BUILD YET

Do not build:

direct WhatsApp account connection

automatic WhatsApp message sending

WhatsApp scraping

WhatsApp background monitoring

billing

team collaboration

enterprise admin

complex analytics

calendar integrations

CRM integrations

These are future phases.

For this first version, prove the core value:

Can AI reliably turn WhatsApp-style conversations into useful commitments and help users remember what they need to do?

SUCCESS CRITERIA

The finished MVP should allow me to:

Sign up

Enter a WhatsApp-style conversation

Let AI analyze it

Review detected tasks/commitments

Track them

See them on Today

See people I'm waiting for

See projects

Ask "What am I forgetting?"

Receive an AI-generated daily briefing

Complete/snooze/reschedule tasks

See realistic demo data

The app should feel like a real product, not a prototype.

Prioritize:

Excellent UX > number of features

AI workflow > traditional project management

Simple > complicated

Trust > aggressive automation

Build the first version with clean reusable components, clear state management, typed data models, and a database architecture that can later support real WhatsApp integrations.

Start by creating the complete UI and user flow with realistic Indonesian demo data. Then connect Supabase and implement the persistent data model and authentication. Finally implement the AI extraction workflow using a server-side function/API architecture so API keys are never exposed in the frontend.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://nanti.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/86ce5376-d3ed-4eec-a483-d427d4d8c61b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
