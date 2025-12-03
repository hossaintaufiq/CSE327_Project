"use client";

import { Target, Lightbulb, Heart, Award } from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: <Target className="w-6 h-6" />,
      title: "Our Mission",
      description: "To empower businesses of all sizes with powerful, intuitive CRM tools that drive growth and success."
    },
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Innovation",
      description: "We continuously innovate to bring you the latest features and technologies that keep you ahead of the competition."
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Customer First",
      description: "Your success is our success. We're committed to providing exceptional support and service to every customer."
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from product design to customer support."
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Users" },
    { value: "99.9%", label: "Uptime Guarantee" },
    { value: "24/7", label: "Support Available" }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-28 md:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-black to-purple-950/20"></div>
        <div className="relative max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent">
              About CRM Prime
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            We're building the future of customer relationship management, 
            one feature at a time.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center text-white">Our Story</h2>
          <div className="space-y-6 text-gray-300 leading-relaxed">
            <p className="text-base md:text-lg">
              CRM Prime was founded with a simple mission: to make powerful CRM tools 
              accessible to businesses of all sizes. We believe that every company, 
              regardless of size, deserves access to enterprise-grade customer 
              relationship management tools.
            </p>
            <p className="text-base md:text-lg">
              Since our launch, we've helped thousands of businesses streamline their 
              operations, improve customer relationships, and drive growth. Our platform 
              combines cutting-edge technology with intuitive design to deliver a CRM 
              solution that's both powerful and easy to use.
            </p>
            <p className="text-base md:text-lg">
              We're constantly evolving, adding new features and improvements based on 
              feedback from our community. Your success is our success, and we're 
              committed to providing you with the tools you need to thrive.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Our Values</h2>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="group bg-gray-900/50 backdrop-blur-sm p-8 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="text-blue-500 mb-5 group-hover:scale-110 transition-transform duration-300">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{value.title}</h3>
                <p className="text-gray-400 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Why Choose CRM Prime?</h2>
            <p className="text-lg text-gray-400">
              We're more than just a CRM platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-blue-500 mb-3">{stat.value}</div>
                <div className="text-gray-400 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

