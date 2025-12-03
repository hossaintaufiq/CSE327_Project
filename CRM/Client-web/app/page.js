"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, BarChart3, Shield, Zap, Settings, TrendingUp } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      if (user) {
        router.push("/dashboard");
      }
    }
  }, [router]);

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "Work seamlessly with your team in real-time. Assign tasks and share updates effortlessly."
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Advanced Analytics",
      description: "Get powerful insights with customizable dashboards and detailed business metrics."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime. Your data is always protected."
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Built for performance with instant load times and smooth user experience."
    },
    {
      icon: <Settings className="w-6 h-6" />,
      title: "Fully Customizable",
      description: "Tailor every aspect to your needs with extensive customization options."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Easy Integration",
      description: "Connect with your favorite tools through our robust API and integrations."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-black to-purple-950/20"></div>
        <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-32 md:py-40">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent">
                Powerful CRM
              </span>
              <br />
              <span className="text-white">for Modern Businesses</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Manage your customers, projects, and teams all in one place. 
              Streamline workflows and boost productivity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/signup"
                className="px-8 py-3.5 bg-blue-600 text-white rounded-lg font-medium text-base hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="px-8 py-3.5 bg-transparent text-white rounded-lg font-medium text-base border border-gray-700 hover:border-gray-600 hover:bg-gray-900/50 transition-colors"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-28 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Powerful features designed to help you manage your business effectively
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-gray-900/50 backdrop-blur-sm p-8 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="text-blue-500 mb-5 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            Join thousands of companies using CRM Prime to streamline their operations and drive growth.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3.5 bg-blue-600 text-white rounded-lg font-medium text-base hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
          >
            Start Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
