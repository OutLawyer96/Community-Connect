import React, { useState } from 'react';
import { motion } from 'framer-motion';
import FavoriteButton from './FavoriteButton';
import AnimatedInput from './AnimatedInput';
import ParallaxSection from './ParallaxSection';
import { Magnetic, MagneticButton } from './Magnetic';
import { AnimatedCheckmark, CommunityConnectLogo } from './AnimatedSVG';
import { SkeletonCard, SkeletonProfile } from './ShimmeringSkeleton';
import { ProvidersGridExample } from './AnimatedFilterableGrid';
import TiltCard from './TiltCard';

/**
 * AnimationShowcase - Demo page for all animation components
 * 
 * This page demonstrates all 9 animation features
 * Navigate to /animations-demo to see this page
 */
const AnimationShowcase = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm py-6 mb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              Animation Components Showcase
            </h1>
            <CommunityConnectLogo />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        
        {/* Section 1: Lottie Favorite Button */}
        <Section
          number="1"
          title="Lottie Icon Animation"
          description="Interactive heart animation that plays on click"
        >
          <div className="flex items-center justify-center p-8 bg-white rounded-lg">
            <FavoriteButton
              providerId="demo"
              onToggle={(id, isFavorite) => 
                console.log('Favorite toggled:', isFavorite)
              }
            />
            <p className="ml-4 text-gray-600">Click the heart!</p>
          </div>
        </Section>

        {/* Section 2: Animated Input */}
        <Section
          number="2"
          title="Interactive Form Input"
          description="Floating label input with smooth animations"
        >
          <div className="max-w-md mx-auto p-8 bg-white rounded-lg">
            <AnimatedInput
              label="Email Address"
              type="email"
              value={email}
              onChange={setEmail}
            />
            <AnimatedInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
            />
            <button
              onClick={() => setShowSuccess(true)}
              className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Submit
            </button>
          </div>
        </Section>

        {/* Section 3: Parallax */}
        <Section
          number="3"
          title="Parallax Scroll Effect"
          description="Background moves slower than foreground (scroll to see effect)"
        >
          <ParallaxSection
            backgroundImage="https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200"
            speed={0.5}
            minHeight="400px"
            className="rounded-lg overflow-hidden"
          >
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <h2 className="text-4xl font-bold mb-4">Parallax Effect</h2>
                <p className="text-xl">Scroll the page to see the effect</p>
              </div>
            </div>
          </ParallaxSection>
        </Section>

        {/* Section 4: Skeleton Loaders */}
        <Section
          number="4"
          title="Animated Skeleton Loader"
          description="Shimmering loading placeholders"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SkeletonCard />
            <div className="space-y-4">
              <SkeletonProfile />
              <SkeletonProfile />
              <SkeletonProfile />
            </div>
          </div>
        </Section>

        {/* Section 5: Magnetic Elements */}
        <Section
          number="5"
          title="Magnetic Element"
          description="Elements that follow your cursor"
        >
          <div className="flex flex-wrap gap-6 justify-center p-8 bg-white rounded-lg">
            <Magnetic strength={0.4} radius={100}>
              <div className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-lg">
                Hover near me!
              </div>
            </Magnetic>
            
            <MagneticButton className="bg-purple-600 text-white">
              Magnetic Button
            </MagneticButton>

            <Magnetic strength={0.3} radius={80}>
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-orange-500 rounded-full" />
            </Magnetic>
          </div>
        </Section>

        {/* Section 6: SVG Animations */}
        <Section
          number="6"
          title="SVG Path Drawing"
          description="Animated checkmark (reload page to see animation)"
        >
          <div className="flex justify-center items-center p-8 bg-white rounded-lg">
            {showSuccess && (
              <div className="text-center">
                <AnimatedCheckmark size={64} />
                <p className="mt-4 text-green-600 font-semibold">
                  Success! Animation played
                </p>
              </div>
            )}
            {!showSuccess && (
              <button
                onClick={() => setShowSuccess(true)}
                className="px-6 py-3 bg-green-600 text-white rounded-lg"
              >
                Show Success Animation
              </button>
            )}
          </div>
        </Section>

        {/* Section 7: 3D Tilt Card */}
        <Section
          number="7"
          title="3D Tilt Card"
          description="Card tilts based on mouse position"
        >
          <div className="flex justify-center p-8">
            <TiltCard className="max-w-sm">
              <div className="bg-white rounded-lg shadow-xl p-6">
                <div className="w-full h-48 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg mb-4" />
                <h3 className="text-2xl font-bold text-gray-900">
                  Hover over me
                </h3>
                <p className="text-gray-600 mt-2">
                  Move your mouse to see the 3D tilt effect
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-indigo-600 font-semibold">★ 5.0</span>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                    Learn More
                  </button>
                </div>
              </div>
            </TiltCard>
          </div>
        </Section>

        {/* Section 8: Animated Filterable Grid */}
        <Section
          number="8"
          title="Animated Filterable Grid"
          description="Smooth animations when filtering items"
          fullWidth
        >
          <ProvidersGridExample />
        </Section>

        {/* Section 9: Shared Layout Info */}
        <Section
          number="9"
          title="Shared Layout Animation"
          description="The 'magic move' effect requires navigation between pages. See INTEGRATION_GUIDE.md for implementation details."
        >
          <div className="p-8 bg-white rounded-lg text-center">
            <p className="text-gray-600 mb-4">
              This animation creates seamless transitions between list and detail pages.
            </p>
            <p className="text-sm text-gray-500">
              Check the integration guide for implementation in your Providers and ProviderDetail pages.
            </p>
          </div>
        </Section>

      </div>
    </div>
  );
};

// Helper component for sections
const Section = ({ number, title, description, children, fullWidth = false }) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`mb-16 ${fullWidth ? '' : 'max-w-4xl mx-auto'}`}
    >
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-600 text-white font-bold">
            {number}
          </span>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        </div>
        <p className="text-gray-600 ml-13">{description}</p>
      </div>
      {children}
    </motion.section>
  );
};

export default AnimationShowcase;
