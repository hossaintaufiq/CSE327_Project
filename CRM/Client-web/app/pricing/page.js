"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$29",
      period: "/month",
      description: "Perfect for small teams getting started",
      features: [
        "Up to 5 users",
        "1,000 contacts",
        "Basic CRM features",
        "Email support",
        "5GB storage",
        "Mobile app access"
      ],
      popular: false,
      cta: "Get Started"
    },
    {
      name: "Professional",
      price: "$79",
      period: "/month",
      description: "For growing businesses",
      features: [
        "Up to 25 users",
        "10,000 contacts",
        "Advanced CRM features",
        "Priority support",
        "50GB storage",
        "API access",
        "Custom fields",
        "Advanced analytics"
      ],
      popular: true,
      cta: "Most Popular"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations",
      features: [
        "Unlimited users",
        "Unlimited contacts",
        "All CRM features",
        "Dedicated support",
        "Unlimited storage",
        "Custom integrations",
        "Advanced security",
        "SLA guarantee",
        "Custom training"
      ],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  const faqs = [
    {
      question: "Can I change plans later?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, all plans include a 14-day free trial. No credit card required."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers for Enterprise plans."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied, we'll refund your payment."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-28 md:py-36">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/30 via-black to-purple-950/20"></div>
        <div className="relative max-w-4xl mx-auto px-6 sm:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-clip-text text-transparent">
              Simple, Transparent
            </span>
            <br />
            <span className="text-white">Pricing</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Choose the plan that's right for your business. 
            All plans include a 14-day free trial.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-gradient-to-b from-black to-gray-950">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-gray-900/50 backdrop-blur-sm rounded-xl border-2 p-8 transition-all duration-300 ${
                  plan.popular
                    ? "border-blue-500 shadow-2xl shadow-blue-500/20 md:scale-105"
                    : "border-gray-800 hover:border-gray-700"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                  <p className="text-gray-400 mb-6 text-sm">{plan.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-white">{plan.price}</span>
                    {plan.period && (
                      <span className="text-gray-400 ml-2 text-lg">{plan.period}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-4 mb-8 min-h-[280px]">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-blue-500 mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.name === "Enterprise" ? "#" : "/signup"}
                  className={`block w-full text-center py-3 rounded-lg font-medium transition-colors ${
                    plan.popular
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-800 text-white hover:bg-gray-700 border border-gray-700"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-gray-950">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-white">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-xl border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <h3 className="text-lg font-semibold mb-2 text-white">{faq.question}</h3>
                <p className="text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

