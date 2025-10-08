# School Portal - Tertiary Institution Management System

A comprehensive portal system built with Next.js 14, TypeScript, and PostgreSQL for managing students, lecturers, and administrators in tertiary institutions.

## 🚀 Features

### For Students
- View enrolled courses and course materials
- Submit assignments and track submission status
- Access grades and academic progress
- Check attendance records
- View academic calendar and important announcements

### For Lecturers
- Create and manage courses
- Upload course materials and assignments
- Grade student submissions
- Take and manage attendance
- Monitor student progress and performance
- Generate course reports

### For Administrators
- Manage user accounts (students, lecturers, admins)
- System configuration and settings
- Generate comprehensive reports
- Monitor system activity and usage
- Manage academic terms and semesters

## 🛠️ Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with role-based access control
- **Forms:** React Hook Form with Zod validation
- **State Management:** React Query (TanStack Query)
- **UI Components:** Radix UI with custom styling

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/
│   │   ├── admin/           # Admin dashboard pages
│   │   ├── lecturer/        # Lecturer dashboard pages
│   │   └── student/         # Student dashboard pages
│   ├── api/                 # API routes
│   └── globals.css          # Global styles
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── forms/               # Form components
│   └── layout/              # Layout components
├── lib/
│   ├── auth.ts              # NextAuth configuration
│   ├── prisma.ts            # Prisma client
│   └── utils.ts             # Utility functions
└── types/
    └── index.ts             # TypeScript type definitions
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd school-portal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Update the `.env.local` file with your configuration:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_SECRET`: Random secret for NextAuth.js
   - `NEXTAUTH_URL`: Your application URL
   - Email configuration (optional)
   - OAuth provider credentials (optional)

4. **Set up the database**
   
   **For PostgreSQL (Recommended for Production):**
   ```bash
   # Install PostgreSQL and create database
   createdb school_portal
   
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run db:migrate
   
   # (Optional) Seed the database
   npm run db:seed
   
   # Check database health
   npm run db:health
   ```
   
   **For SQLite (Development only):**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # (Optional) Seed the database
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The application uses a comprehensive database schema with the following main entities:

- **Users**: Base user accounts with role-based access
- **Students**: Student-specific information and academic records
- **Lecturers**: Lecturer profiles and course assignments
- **Admins**: Administrative user accounts
- **Courses**: Course information and enrollment
- **Enrollments**: Student-course relationships
- **Assignments**: Course assignments and submissions
- **Grades**: Academic grading system
- **Attendance**: Student attendance tracking

## 🔐 Authentication & Authorization

The system implements role-based access control with three main roles:

- **STUDENT**: Access to personal academic information
- **LECTURER**: Course management and grading capabilities
- **ADMIN**: Full system administration access

Authentication is handled by NextAuth.js with support for:
- Email/password authentication
- Google OAuth (optional)
- GitHub OAuth (optional)

## 🎨 UI Components

The application uses a custom component library built on Radix UI primitives with Tailwind CSS styling. Key components include:

- Form components with validation
- Data tables with sorting and filtering
- Modal dialogs and popovers
- Navigation components
- Dashboard widgets

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile devices

## 🧪 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Run database migrations
- `npm run db:migrate:deploy` - Deploy migrations to production
- `npm run db:migrate:reset` - Reset database and run migrations
- `npm run db:studio` - Open Prisma Studio
- `npm run db:seed` - Seed database with sample data
- `npm run db:health` - Check database connection health
- `npm run db:backup` - Create database backup
- `npm run db:restore <file>` - Restore database from backup

### Code Style

The project uses:
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Tailwind CSS for styling

## 🚀 Deployment

### Environment Setup

1. Set up a PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Build and deploy the application

### Recommended Platforms

- **Vercel** (recommended for Next.js)
- **Railway**
- **Heroku**
- **DigitalOcean App Platform**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Future Enhancements

- Mobile app development
- Advanced analytics and reporting
- Integration with external systems
- Real-time notifications
- Video conferencing integration
- Advanced file management
- Multi-language support
