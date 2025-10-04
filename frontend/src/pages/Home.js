import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import AutocompleteSearch from "../components/AutocompleteSearch";
import AnimatedPage from "../components/animations/AnimatedPage";
import ScrollReveal from "../components/animations/ScrollReveal";
import StaggeredList from "../components/animations/StaggeredList";
import InteractiveCard from "../components/animations/InteractiveCard";
import Iridescence from "../components/Iridescence";

function Home() {
  const heroImageVariants = {
    initial: { opacity: 0, scale: 1.1 },
    animate: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  };

  const heroContentVariants = {
    initial: { opacity: 0, y: 30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", delay: 0.2 },
    },
  };

  const features = [
    {
      title: "Search for Services",
      description:
        "Use our powerful search to find exactly what you're looking for, from specific services to general categories.",
      icon: (
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      ),
    },
    {
      title: "Compare Local Providers",
      description:
        "Browse detailed profiles, read authentic reviews, and compare providers in your area to make an informed decision.",
      icon: (
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
    {
      title: "Connect and Hire",
      description:
        "Contact providers directly, get quotes, and hire with confidence. Your community's feedback is our foundation.",
      icon: (
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
  ];

  const iridescenceColor = useMemo(() => [0.3, 0.7, 1.0], []);

  return (
    <AnimatedPage>
      {/* Iridescence Background */}
      <Iridescence
        color={iridescenceColor} // Vibrant blue
        speed={1.5}
        amplitude={0.3}
        mouseReact={true}
      />

      <div className="relative z-10">
        {/* Hero Section */}
        <div
          className="relative text-white overflow-hidden"
          style={{
            background: "rgba(59, 130, 246, 0.3)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pb-8 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
              <motion.main
                variants={heroContentVariants}
                initial="initial"
                animate="animate"
                className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28"
              >
                <div className="sm:text-center lg:text-left">
                  <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl">
                    <span className="block xl:inline">Find Local Services</span>{" "}
                    <span className="block text-indigo-200 xl:inline">
                      You Can Trust
                    </span>
                  </h1>
                  <p className="mt-3 text-base text-indigo-100 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                    Community Connect helps you find reliable local service
                    providers, from plumbers to pet sitters, all reviewed by
                    your neighbors.
                  </p>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-5 sm:mt-8"
                  >
                    <AutocompleteSearch />
                  </motion.div>
                </div>
              </motion.main>
            </div>
          </div>
          <motion.div
            variants={heroImageVariants}
            initial="initial"
            animate="animate"
            className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2"
          >
            <img
              className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
              src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80"
              alt="Community"
            />
          </motion.div>
        </div>

        {/* Features Section */}
        <ScrollReveal>
          <div
            className="py-12"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="lg:text-center">
                <motion.h2
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-base text-indigo-600 font-semibold tracking-wide uppercase"
                >
                  How It Works
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl"
                >
                  A better way to find local pros
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto"
                >
                  We connect you with trusted professionals in your area, making
                  it easy to get the help you need.
                </motion.p>
              </div>

              <div className="mt-10">
                <StaggeredList className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                  {features.map((feature, index) => (
                    <InteractiveCard
                      key={index}
                      className="relative p-6 rounded-lg transition-all duration-300"
                      style={{
                        background: "rgba(255, 255, 255, 0.25)",
                        backdropFilter: "blur(15px)",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                        boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
                      }}
                    >
                      <div>
                        <dt>
                          <div
                            className="absolute flex items-center justify-center h-12 w-12 rounded-md text-white\"
                            style={{ background: "rgba(99, 102, 241, 0.9)" }}
                          >
                            \n{" "}
                            <svg
                              className="h-6 w-6"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                          <p className="ml-16 text-lg leading-6 font-medium text-gray-900 drop-shadow-sm">
                            {feature.title}
                          </p>
                        </dt>
                        <dd className="mt-2 ml-16 text-base text-gray-800 drop-shadow-sm">
                          {feature.description}
                        </dd>
                      </div>
                    </InteractiveCard>
                  ))}
                </StaggeredList>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Call to Action Section */}
        <ScrollReveal>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
              <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                <span className="block">Ready to dive in?</span>
                <span className="block text-indigo-600">
                  Start exploring your community today.
                </span>
              </h2>
              <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
                <InteractiveCard>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Get started
                  </Link>
                </InteractiveCard>
                <div className="ml-3">
                  <InteractiveCard>
                    <Link
                      to="/providers"
                      className="inline-flex items-center justify-center px-5 py-3 border-2 border-white text-base font-medium rounded-md text-white transition-all duration-300"
                      style={{
                        background: "rgba(99, 102, 241, 0.6)",
                        backdropFilter: "blur(10px)",
                        boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(79, 70, 229, 0.8)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(99, 102, 241, 0.6)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      Browse Providers
                    </Link>
                  </InteractiveCard>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </AnimatedPage>
  );
}

export default Home;
