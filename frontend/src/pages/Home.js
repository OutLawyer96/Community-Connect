import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin, Users, Shield, Clock } from 'lucide-react';

function Home() {
  const features = [
    {
      icon: <Search className="w-8 h-8 text-primary-500" />,
      title: "Easy Search",
      description: "Find local service providers quickly with our advanced search and filtering system."
    },
    {
      icon: <Star className="w-8 h-8 text-warning-500" />,
      title: "Trusted Reviews",
      description: "Read genuine reviews from community members to make informed decisions."
    },
    {
      icon: <MapPin className="w-8 h-8 text-success-500" />,
      title: "Location-Based",
      description: "Discover providers near you with our interactive map integration."
    },
    {
      icon: <Shield className="w-8 h-8 text-secondary-500" />,
      title: "Verified Providers",
      description: "Connect with verified and trusted local service professionals."
    }
  ];

  const categories = [
    { name: "Plumbing", count: 45, color: "bg-blue-500" },
    { name: "Electrical", count: 38, color: "bg-yellow-500" },
    { name: "Tutoring", count: 52, color: "bg-green-500" },
    { name: "Home Cleaning", count: 29, color: "bg-purple-500" },
    { name: "Landscaping", count: 34, color: "bg-emerald-500" },
    { name: "Automotive", count: 23, color: "bg-red-500" }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in">
            Find Trusted Local
            <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              Service Providers
            </span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto animate-fade-in">
            Connect with verified professionals in your community through genuine reviews and ratings
          </p>
          
          {/* Search Bar */}
          <div className="max-w-4xl mx-auto mb-8 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-4 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="What service do you need?"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Enter your location"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <Link 
                to="/providers"
                className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105 flex items-center justify-center"
              >
                <Search className="w-5 h-5 mr-2" />
                Search
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-in">
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">500+</div>
              <div className="text-blue-200">Verified Providers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">2,000+</div>
              <div className="text-blue-200">Happy Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-2">4.8</div>
              <div className="text-blue-200">Average Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Community Connect?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We make it easy to find reliable service providers in your area with transparency and trust
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="text-center p-6 rounded-xl bg-gray-50 hover:bg-white hover:shadow-lg transition-all card-hover"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Popular Service Categories
            </h2>
            <p className="text-lg text-gray-600">
              Explore our most requested services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <Link
                key={index}
                to="/providers"
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all card-hover group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-gray-500">
                      {category.count} providers
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center`}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of satisfied customers and providers in our community
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/providers"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all transform hover:scale-105"
            >
              Find Services
            </Link>
            <Link 
              to="/register"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-all"
            >
              Become a Provider
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;