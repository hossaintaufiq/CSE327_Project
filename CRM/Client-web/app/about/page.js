"use client";

import { Target, Lightbulb, Heart, Award } from "lucide-react";

export default function AboutPage() {
  const values = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Our Mission",
      description: "To empower businesses of all sizes with powerful, intuitive CRM tools that drive growth and success."
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "Innovation",
      description: "We continuously innovate to bring you the latest features and technologies that keep you ahead of the competition."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Customer First",
      description: "Your success is our success. We're committed to providing exceptional support and service to every customer."
    },
    {
      icon: <Award className="w-8 h-8" />,
      title: "Excellence",
      description: "We strive for excellence in everything we do, from product design to customer support."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
              About CRM Prime
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed">
              We're building the future of customer relationship management, 
              one feature at a time.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Our Story</h2>
          <div className="space-y-4 text-gray-300 leading-relaxed">
            <p>
              CRM Prime was founded with a simple mission: to make powerful CRM tools 
              accessible to businesses of all sizes. We believe that every company, 
              regardless of size, deserves access to enterprise-grade customer 
              relationship management tools.
            </p>
            <p>
              Since our launch, we've helped thousands of businesses streamline their 
              operations, improve customer relationships, and drive growth. Our platform 
              combines cutting-edge technology with intuitive design to deliver a CRM 
              solution that's both powerful and easy to use.
            </p>
            <p>
              We're constantly evolving, adding new features and improvements based on 
              feedback from our community. Your success is our success, and we're 
              committed to providing you with the tools you need to thrive.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-gray-400">
              The principles that guide everything we do
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-gray-900 p-8 rounded-lg border border-gray-800 hover:border-blue-500 transition-all"
              >
                <div className="text-blue-400 mb-4">{value.icon}</div>
                <h3 className="text-2xl font-semibold mb-3 text-white">{value.title}</h3>
                <p className="text-gray-400 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Choose CRM Prime?</h2>
            <p className="text-xl text-gray-400">
              We're more than just a CRM platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">10K+</div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">99.9%</div>
              <div className="text-gray-400">Uptime Guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">24/7</div>
              <div className="text-gray-400">Support Available</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

