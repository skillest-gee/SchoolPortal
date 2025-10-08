import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  Shield, 
  Award, 
  Clock, 
  Globe, 
  CheckCircle, 
  Star, 
  TrendingUp, 
  MessageSquare, 
  Calendar, 
  FileText, 
  BarChart3, 
  Smartphone, 
  Lock,
  ArrowRight,
  Play,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  // If user is authenticated, redirect to appropriate dashboard
  if (session?.user?.role) {
    switch (session.user.role) {
      case 'ADMIN':
        redirect('/admin/dashboard')
      case 'LECTURER':
        redirect('/lecturer/dashboard')
      case 'STUDENT':
        redirect('/student/dashboard')
      default:
        redirect('/dashboard')
    }
  }
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">EduPortal</h1>
                <p className="text-sm text-gray-500">University Management System</p>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#programs" className="text-gray-600 hover:text-blue-600 transition-colors">Programs</a>
              <a href="#about" className="text-gray-600 hover:text-blue-600 transition-colors">About</a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors">Contact</a>
            </nav>
            <div className="flex space-x-3">
              <Link href="/auth/apply">
                <Button variant="outline" className="hidden sm:inline-flex">
                  Apply Now
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              <Award className="h-4 w-4 mr-2" />
              Trusted by 50+ Universities
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Transform Your
              <span className="text-blue-600 block">Academic Experience</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
              A comprehensive, modern university management system that streamlines academic operations, 
              enhances student engagement, and empowers educators with powerful tools for success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/apply">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                  Start Your Application
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            <div className="mt-12 flex justify-center items-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Free to Apply
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Secure Platform
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                24/7 Support
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Academic Excellence
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools and features needed for modern 
              university management and student success.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Student Features */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl">For Students</CardTitle>
                <CardDescription className="text-base">
                  Comprehensive tools for academic success and engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Course enrollment and management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Assignment submission and tracking</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Real-time grade monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Attendance tracking and reports</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Academic calendar and events</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Fee payment and financial tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Lecturer Features */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="bg-green-100 p-3 rounded-lg w-fit mb-4">
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-xl">For Lecturers</CardTitle>
                <CardDescription className="text-base">
                  Powerful tools for course management and student engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Course creation and management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Assignment creation and grading</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Attendance management system</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Student progress analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Timetable and schedule management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Communication tools and messaging</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Admin Features */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="bg-purple-100 p-3 rounded-lg w-fit mb-4">
                  <Shield className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl">For Administrators</CardTitle>
                <CardDescription className="text-base">
                  Complete system oversight and management capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">User account management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Application review and processing</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Financial management and reporting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">System analytics and insights</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Announcement and notification system</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">Security and access control</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Academic Programs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our diverse range of undergraduate and postgraduate programs designed 
              to prepare you for success in your chosen field.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Computer Science", icon: "💻", students: "1,200+" },
              { name: "Business Administration", icon: "📊", students: "950+" },
              { name: "Engineering", icon: "⚙️", students: "800+" },
              { name: "Medicine", icon: "🏥", students: "600+" },
              { name: "Law", icon: "⚖️", students: "400+" },
              { name: "Arts & Humanities", icon: "🎨", students: "500+" },
              { name: "Sciences", icon: "🔬", students: "700+" },
              { name: "Education", icon: "📚", students: "350+" }
            ].map((program, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow text-center">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{program.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-2">{program.name}</h3>
                  <p className="text-sm text-gray-500">{program.students} students</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-4xl font-bold mb-2">15,000+</div>
              <div className="text-blue-100">Active Students</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">Faculty Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Academic Programs</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">25+</div>
              <div className="text-blue-100">Years of Excellence</div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to providing the best possible experience for students, 
              faculty, and administrators.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Smartphone className="h-8 w-8" />,
                title: "Mobile-First Design",
                description: "Access your academic information anywhere, anytime with our responsive mobile platform."
              },
              {
                icon: <Lock className="h-8 w-8" />,
                title: "Enterprise Security",
                description: "Your data is protected with bank-level security and privacy measures."
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: "Real-Time Analytics",
                description: "Get instant insights into academic performance and system usage."
              },
              {
                icon: <MessageSquare className="h-8 w-8" />,
                title: "Integrated Communication",
                description: "Seamless messaging and notification system for better collaboration."
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: "Comprehensive Reporting",
                description: "Detailed reports and analytics for informed decision making."
              },
              {
                icon: <Globe className="h-8 w-8" />,
                title: "Global Accessibility",
                description: "Cloud-based platform accessible from anywhere in the world."
              }
            ].map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4 text-blue-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Academic Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students and educators who have already made the switch to our 
            comprehensive university management platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/apply">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3">
                Apply for Admission
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/application-status">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3">
                Check Application Status
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3">
                Access Portal
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold">EduPortal</span>
              </div>
              <p className="text-gray-400 mb-4">
                Empowering educational institutions with modern, comprehensive management solutions.
              </p>
              <div className="flex space-x-4">
                <div className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
                  <Globe className="h-5 w-5" />
                </div>
                <div className="bg-gray-800 p-2 rounded-lg hover:bg-gray-700 cursor-pointer">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#programs" className="hover:text-white transition-colors">Programs</a></li>
                <li><a href="/auth/apply" className="hover:text-white transition-colors">Apply Now</a></li>
                <li><a href="/application-status" className="hover:text-white transition-colors">Check Status</a></li>
                <li><a href="/auth/login" className="hover:text-white transition-colors">Sign In</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-3" />
                  <span>123 University Avenue, Academic City</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3" />
                  <span>info@eduportal.edu</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 EduPortal. All rights reserved. | Privacy Policy | Terms of Service</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
