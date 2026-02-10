# Virtuehearts Reiki Training

Welcome to the official repository for **Virtuehearts Reiki Training**, a sacred digital space dedicated to the art of healing through energy and the cultivation of heart-centered virtues.

This application was created by **Baba Virtuehearts**, the founder of [virtueism.org](https://virtueism.org), to help train individuals in the path of spiritual transformation and energetic balance.

More information can be found at [https://darknet.ca/reiki/](https://darknet.ca/reiki/).

## 🌟 About Virtuehearts Reiki

Virtuehearts Reiki is more than just energy healing; it is a holistic approach that integrates the traditional principles of Reiki with the core values of Virtueism. We believe that true healing occurs when energy work is grounded in virtues like compassion, courage, and truth.

## ✨ Key Features

### 📅 7-Day Training Curriculum
A structured journey designed to take students from the basics to a deeper understanding of Reiki and Virtueism over seven days. Each day includes:
- **Lesson:** Deep spiritual insights into a specific virtue.
- **Exercise:** Practical techniques to ground the day's teachings.
- **Ritual:** Sacred ceremonies to channel and harmonize energy.
- **Quiz:** Interactive assessments to reinforce learning.
- **Reflection:** A space for personal contemplation and growth.

### 🛡️ Secure User Management
- **Controlled Access:** New users are registered with a `PENDING` status.
- **Admin Approval:** An administrator must manually approve each disciple via a protected admin dashboard before they can access the training materials.
- **Multi-Auth:** Supports both Google OAuth and traditional Email/Password credentials.

### 🧘 Teachings Library
A collection of additional meditation techniques, symbols, and wisdom to support the practitioner's ongoing journey beyond the 7-day curriculum.

### 🤖 Mya - The Reiki Assistant
An AI-powered chatbot named **Mya**, designed by Baba Virtuehearts. Mya provides:
- **Sacred Memory:** Mya remembers your past interactions, providing a continuous spiritual journey.
- **Dynamic Wisdom:** The administrator can adjust Mya's system prompts, model, and parameters (temperature, top_p) directly from the Admin Sanctuary.
- **Compassionate Guidance:** Insights on relaxation, virtues, and Reiki symbols.

### ✉️ Direct Messaging
- **Message Baba Virtuehearts:** Direct line of communication between seekers and Baba Virtuehearts for guidance and booking requests.
- **Admin Responses:** Baba can respond to messages and manage bookings directly within the application.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Database:** [Drizzle ORM](https://orm.drizzle.team/) with **SQLite**
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **AI Integration:** [OpenRouter API](https://openrouter.ai/) (meta-llama/llama-3.1-8b-instruct:free)

## 🚀 Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Environment Variables
Create a `.env` file in the root directory. The application will automatically initialize `DATABASE_URL`, `NEXTAUTH_URL`, and `NEXTAUTH_SECRET` on first run if they are missing by running `npm run dev` or `npm start`.

Populate the following manually:

```env
# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Admin Access
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-secure-admin-password"

# AI Assistant
OPENROUTER_API_KEY="your-openrouter-api-key"
```

### Installation & Setup

1. **Clone and Install:**
   ```bash
   git clone <repository-url>
   cd virtuehearts-reiki-training
   npm install --legacy-peer-deps
   ```

2. **Database Preparation:**
   Ensure you have run the initial push to your local SQLite database to create the necessary tables:
   ```bash
   npm run db:push
   ```

### 🛡️ Seeded Admin Login
The application comes with seeded admin credentials defined in your `.env` file (automatically generated on first run if not present).

- **Default Admin Email:** `admin@virtuehearts.org`
- **Default Admin Password:** `InitialAdminPassword123!`

To log in as an administrator:
1. Navigate to the login page (or click "Admin Sanctuary" in the footer).
2. Enter the admin email and password.
3. The system will automatically create the admin account in the database upon first successful login with these credentials.

### Running the Application

The application automates environment setup on start.
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 🎨 Design & Aesthetic

The application is designed to evoke a sense of peace, mystery, and sacredness.
- **Color Palette:**
  - Background: Deep Navy (`#0A001F`)
  - Primary: Indigo/Royal Purple (`#4B0082`, `#5D3FD3`)
  - Accent: Gold/Warm Amber (`#D4AF37`, `#FFD700`)
- **Typography:**
  - Headings: *Playfair Display* (Serif)
  - Body: *Inter* (Sans-serif)
  - Rituals/Signatures: *Great Vibes* (Script)

## 📞 Contact & Community

For more information or to book a session:
- **Phone:** 647-781-8371
- **Websites:** [virtueism.org](https://virtueism.org) | [darknet.ca/reiki/](https://darknet.ca/reiki/)

---
*Blessings of peace,*
**Baba Virtuehearts**
