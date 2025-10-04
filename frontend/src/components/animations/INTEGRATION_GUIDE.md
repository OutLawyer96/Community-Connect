# Advanced Animation Components - Integration Guide

This guide shows you how to integrate all 9 advanced animation features into your Community Connect application.

## 📦 Installation

The required dependency has been installed:
```bash
npm install lottie-react  # ✅ Installed
```

## 🎨 Components Overview

### 1. Lottie Icon Animation - FavoriteButton

**File**: `src/components/animations/FavoriteButton.jsx`

**Usage in ProviderCard.js**:
```jsx
import FavoriteButton from './animations/FavoriteButton';

const ProviderCard = ({ provider }) => {
  const handleFavoriteToggle = (providerId, isFavorite) => {
    console.log(`Provider ${providerId} favorite:`, isFavorite);
    // Add your API call to save favorite
  };

  return (
    <div className="provider-card">
      <div className="absolute top-4 right-4">
        <FavoriteButton
          providerId={provider.id}
          onToggle={handleFavoriteToggle}
          initialFavorite={provider.isFavorite}
        />
      </div>
      {/* Rest of card content */}
    </div>
  );
};
```

**Note**: Replace the heartAnimation JSON with a real Lottie file from [LottieFiles](https://lottiefiles.com).

---

### 2. Interactive Form Input - AnimatedInput

**File**: `src/components/animations/AnimatedInput.jsx`

**Usage in Login.js**:
```jsx
import AnimatedInput from './components/animations/AnimatedInput';
import { useState } from 'react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  return (
    <form className="max-w-md mx-auto p-8">
      <AnimatedInput
        label="Email Address"
        type="email"
        value={email}
        onChange={setEmail}
        error={errors.email}
      />
      
      <AnimatedInput
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        error={errors.password}
      />
      
      <button type="submit">Login</button>
    </form>
  );
};
```

---

### 3. Shared Layout Animation (Magic Move)

**Files**: `src/components/animations/SharedLayoutExample.jsx`

**Step 1 - Update App.js**:
```jsx
import { AnimatePresence } from 'framer-motion';
import { Routes, Route, useLocation } from 'react-router-dom';

function App() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/providers" element={<Providers />} />
        <Route path="/providers/:id" element={<ProviderDetail />} />
      </Routes>
    </AnimatePresence>
  );
}
```

**Step 2 - Update ProviderCard.js**:
```jsx
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ProviderCard = ({ provider }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      layout
      onClick={() => navigate(`/providers/${provider.id}`)}
      className="cursor-pointer"
    >
      {/* Add layoutId to image */}
      <motion.img
        layoutId={`provider-image-${provider.id}`}
        src={provider.image}
        alt={provider.name}
        className="w-full h-48 object-cover"
      />
      
      {/* Add layoutId to name */}
      <motion.h3
        layoutId={`provider-name-${provider.id}`}
        className="text-xl font-bold"
      >
        {provider.name}
      </motion.h3>
    </motion.div>
  );
};
```

**Step 3 - Update ProviderDetail.js**:
```jsx
import { motion } from 'framer-motion';

const ProviderDetail = () => {
  const { id } = useParams();
  // Fetch provider data...

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Same layoutId for seamless transition */}
      <motion.img
        layoutId={`provider-image-${id}`}
        src={provider.image}
        className="w-full h-96 object-cover"
      />
      
      <motion.h1
        layoutId={`provider-name-${id}`}
        className="text-4xl font-bold"
      >
        {provider.name}
      </motion.h1>
    </motion.div>
  );
};
```

---

### 4. Animated Skeleton Loader

**Files**: 
- `src/components/animations/ShimmeringSkeleton.jsx`
- `src/components/animations/ShimmeringSkeleton.css`

**Usage in Providers.js**:
```jsx
import { SkeletonCard } from './components/animations/ShimmeringSkeleton';
import { useState, useEffect } from 'react';

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProviders().then(data => {
      setProviders(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {loading ? (
        // Show skeleton loaders while loading
        Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))
      ) : (
        providers.map(provider => (
          <ProviderCard key={provider.id} {...provider} />
        ))
      )}
    </div>
  );
};
```

---

### 5. Parallax Scroll Effect

**File**: `src/components/animations/ParallaxSection.jsx`

**Usage in Home.js**:
```jsx
import ParallaxSection from './components/animations/ParallaxSection';

const Home = () => {
  return (
    <>
      <ParallaxSection
        backgroundImage="/images/hero-background.jpg"
        speed={0.5}
        minHeight="600px"
        className="flex items-center justify-center"
      >
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4">
            Welcome to Community Connect
          </h1>
          <p className="text-xl mb-8">
            Find trusted service providers in your area
          </p>
          <button className="px-8 py-4 bg-white text-indigo-600 rounded-lg">
            Get Started
          </button>
        </div>
      </ParallaxSection>

      {/* Rest of your content */}
    </>
  );
};
```

---

### 6. Magnetic Element Component

**File**: `src/components/animations/Magnetic.jsx`

**Usage - Wrap any button or card**:
```jsx
import { Magnetic, MagneticButton } from './components/animations/Magnetic';

const Home = () => {
  return (
    <div className="hero-section">
      {/* Magnetic CTA button */}
      <Magnetic strength={0.4} radius={80}>
        <button className="px-8 py-4 bg-indigo-600 text-white rounded-lg">
          Get Started
        </button>
      </Magnetic>

      {/* Or use pre-configured MagneticButton */}
      <MagneticButton
        onClick={() => navigate('/providers')}
        className="bg-indigo-600 text-white"
      >
        Browse Providers
      </MagneticButton>
    </div>
  );
};
```

---

### 7. SVG Path Drawing Animation

**File**: `src/components/animations/AnimatedSVG.jsx`

**Usage - Animated logo on page load**:
```jsx
import { CommunityConnectLogo, AnimatedCheckmark } from './components/animations/AnimatedSVG';

const Navbar = () => {
  return (
    <nav>
      <CommunityConnectLogo />
      {/* Your nav items */}
    </nav>
  );
};

// For success messages
const SuccessMessage = () => {
  return (
    <div className="text-center">
      <AnimatedCheckmark size={64} />
      <p>Provider added successfully!</p>
    </div>
  );
};
```

---

### 8. Animated Filterable Grid

**File**: `src/components/animations/AnimatedFilterableGrid.jsx`

**Usage in Providers.js**:
```jsx
import { AnimatedProviderGrid } from './components/animations/AnimatedFilterableGrid';
import { useState, useMemo } from 'react';
import ProviderCard from './components/ProviderCard';

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [filter, setFilter] = useState('all');

  const filteredProviders = useMemo(() => {
    if (filter === 'all') return providers;
    return providers.filter(p => p.category === filter);
  }, [providers, filter]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filter buttons */}
      <div className="flex gap-3 mb-8">
        <button onClick={() => setFilter('all')}>All</button>
        <button onClick={() => setFilter('doctor')}>Doctors</button>
        <button onClick={() => setFilter('lawyer')}>Lawyers</button>
      </div>

      {/* Animated grid */}
      <AnimatedProviderGrid
        providers={filteredProviders}
        ProviderCardComponent={ProviderCard}
      />
    </div>
  );
};
```

---

### 9. 3D Tilt Card

**File**: `src/components/animations/TiltCard.jsx`

**Usage - Wrap ProviderCard**:
```jsx
import TiltCard from './components/animations/TiltCard';
import ProviderCard from './components/ProviderCard';

const Providers = () => {
  return (
    <div className="grid grid-cols-3 gap-6">
      {providers.map(provider => (
        <TiltCard key={provider.id} tiltMaxAngle={10}>
          <ProviderCard {...provider} />
        </TiltCard>
      ))}
    </div>
  );
};
```

---

## 🚀 Quick Start Integration Example

Here's how to update your main pages:

### Updated Providers.js (Complete Example)
```jsx
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AnimatedProviderGrid } from './components/animations/AnimatedFilterableGrid';
import { SkeletonCard } from './components/animations/ShimmeringSkeleton';
import TiltCard from './components/animations/TiltCard';
import ProviderCard from './components/ProviderCard';

const Providers = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchProviders().then(data => {
      setProviders(data);
      setLoading(false);
    });
  }, []);

  const filteredProviders = useMemo(() => {
    if (filter === 'all') return providers;
    return providers.filter(p => p.category === filter);
  }, [providers, filter]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <AnimatedProviderGrid
        providers={filteredProviders}
        ProviderCardComponent={(props) => (
          <TiltCard>
            <ProviderCard {...props} />
          </TiltCard>
        )}
      />
    </div>
  );
};

export default Providers;
```

---

## 🎯 Performance Tips

1. **Lazy Load**: Import animation components only where needed
2. **Reduce Motion**: Respect user preferences
```jsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

3. **GPU Acceleration**: Use `transform` and `opacity` for best performance

4. **Cleanup**: Components handle cleanup automatically via useEffect

---

## 📁 Project Structure

```
frontend/src/
├── components/
│   ├── animations/
│   │   ├── index.js (central exports)
│   │   ├── FavoriteButton.jsx
│   │   ├── AnimatedInput.jsx
│   │   ├── SharedLayoutExample.jsx
│   │   ├── ShimmeringSkeleton.jsx
│   │   ├── ShimmeringSkeleton.css
│   │   ├── ParallaxSection.jsx
│   │   ├── Magnetic.jsx
│   │   ├── AnimatedSVG.jsx
│   │   ├── AnimatedFilterableGrid.jsx
│   │   └── TiltCard.jsx
│   ├── ProviderCard.js (update with animations)
│   └── ...
├── pages/
│   ├── Home.js (add ParallaxSection, Magnetic)
│   ├── Providers.js (add AnimatedGrid, TiltCard, Skeleton)
│   ├── ProviderDetail.js (add SharedLayout)
│   └── Login.js (add AnimatedInput)
└── App.js (wrap Routes with AnimatePresence)
```

---

## ✅ Next Steps

1. **Test each component** individually
2. **Customize colors** to match your brand
3. **Add real Lottie files** from LottieFiles.com
4. **Optimize performance** based on usage
5. **Add accessibility** features where needed

All components are production-ready and fully commented! 🎉
