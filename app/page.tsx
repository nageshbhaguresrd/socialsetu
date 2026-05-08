'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { 
  Menu, X, Check, ArrowRight, Instagram, Linkedin, MessageSquare, 
  Video, BarChart3, Users, Clock, Globe, Briefcase, Phone, Mail, 
  MapPin, ChevronDown, Star, Zap, Rocket, TrendingUp, ShieldCheck,
  Search, Youtube, Twitter, Facebook, ExternalLink, Filter
} from 'lucide-react';

// Pricing Data
const pricingPlans = [
  {
    name: 'Starter',
    monthlyPrice: 10000,
    quarterlyPrice: 25500, // 15% discount
    features: ['15 Posts per Month', '2 Platforms', 'Basic Analytics Report', 'WhatsApp Support', '1 Sponsored Post Boost'],
    tag: 'Perfect for small shops',
    description: 'Best for: Local businesses & startups'
  },
  {
    name: 'Growth',
    monthlyPrice: 30000,
    quarterlyPrice: 76500, // 15% discount
    features: ['Daily Content (30 posts)', '4 Platforms', 'Meta Ads (up to ₹50K budget)', '4 Reels/month', 'Bi-weekly Strategy Calls', 'Dedicated Manager'],
    tag: 'MOST POPULAR',
    popular: true,
    description: 'Best for: Growing SMEs & D2C brands'
  },
  {
    name: 'Premium',
    monthlyPrice: 75000,
    quarterlyPrice: 191250, // 15% discount
    features: ['Unlimited Content', 'All Platforms', 'Meta + Google Ads', '12 Reels + 2 YT Shorts', 'Influencer Outreach', 'Weekly Dashboard', 'Priority Support'],
    tag: 'Scale pan-India',
    description: 'Best for: Established brands scaling across India'
  }
];

// Testimonial Data
const testimonials = [
  {
    name: 'Rahul Sharma',
    business: 'Urban Threads D2C',
    location: 'Mumbai, Maharashtra',
    rating: 5,
    quote: "SocialSetu helped us grow from 12K to 89K followers in just 4 months. The ROAS on our Meta campaigns is consistently above 4.2X. Unmatchable expertise!",
    avatar: 'RS'
  },
  {
    name: 'Priya Nair',
    business: 'SaaS Pulse',
    location: 'Bangalore, Karnataka',
    rating: 5,
    quote: "Our LinkedIn presence was non-existent. In 6 months, we've become thought leaders in our niche with 60+ inbound qualified leads monthly.",
    avatar: 'PN'
  },
  {
    name: 'Amit Gupta',
    business: 'Gupta Developers',
    location: 'Delhi NCR',
    rating: 5,
    quote: "Generating high-intent leads in the Delhi real estate market is tough. SocialSetu delivered 500+ qualified leads in 45 days. Truly professional.",
    avatar: 'AG'
  },
  {
    name: 'Sneha Reddy',
    business: 'The Biryani House',
    location: 'Hyderabad, Telangana',
    rating: 5,
    quote: "Our Instagram reach grew by 800%. Three of our Reels went viral with 2M+ views. Our outlets are now packed with Gen-Z foodies from all over the city.",
    avatar: 'SR'
  }
];

// FAQ Data
const faqs = [
  {
    question: "Do you work with businesses outside metros?",
    answer: "Yes! We specialize in growing brands in Tier-2 and Tier-3 cities like Indore, Nagpur, and Patna. We understand the specific consumer behavior in smaller Indian cities."
  },
  {
    question: "Can you create content in regional languages?",
    answer: "Absolutely. We provide content in Hindi, English, Tamil, Telugu, Marathi, and more to ensure your brand resonates locally."
  },
  {
    question: "What's your minimum contract period?",
    answer: "We work on a month-to-month basis. We believe our results should keep you with us, not a legal contract. For best results, we recommend a 3-6 month window."
  },
  {
    question: "How do you handle different time zones within India?",
    answer: "Our team operates 9AM to 7PM IST, covering the entire Indian business landscape synchronously."
  },
  {
    question: "Do you manage ad budgets or just creative?",
    answer: "We manage both. We handle strategy, creative, targeting, and optimization. The ad budget is paid directly to the platform (Meta/Google), and we manage it for you."
  },
  {
    question: "How soon can we start?",
    answer: "Once the audit and onboarding are complete (usually 3-5 days), we can have your first campaigns and content live within a week."
  },
  {
    question: "What industries do you NOT work with?",
    answer: "We generally don't work with industries that violate platform policies (gambling, adult content, etc.). We focus on lifestyle, tech, real estate, and professional services."
  },
  {
    question: "Is GST included in pricing?",
    answer: "All listed prices are exclusive of 18% GST. GST will be added to the final invoice."
  }
];

const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad', 'Kolkata', 
  'Jaipur', 'Lucknow', 'Surat', 'Indore', 'Nagpur', 'Chandigarh', 'Kochi', 'Bhopal', 
  'Coimbatore', 'Vizag', 'Vadodara', 'Patna'
];

const industries = [
  { name: 'Real Estate', pain: 'High CPL & Junk Leads', solve: 'Cinema tours & multi-step qualifiers', result: '₹180 Per Lead' },
  { name: 'Restaurants', pain: '25% Zomato Commissions', solve: 'Viral Food Reels & Direct Bookings', result: '3X Dine-in Traffic' },
  { name: 'D2C Brands', pain: 'Burning Cash on Meta Ads', solve: 'UGC-led growth & 4X+ ROAS targets', result: '60% Increase in Sales' },
  { name: 'IT & Startups', pain: 'Invisible to Decision Makers', solve: 'LinkedIn Thought Leadership & B2B Newsletters', result: '80+ Monthly Inbounds' },
  { name: 'Healthcare', pain: 'Trust Deficit & Patient Retention', solve: 'Educational content & Local SEO', result: '50% More Inquiries' },
  { name: 'Tier-2 SMBs', pain: 'Slow Digital Adoption', solve: 'Small-budget growth & WhatsApp Marketing', result: '24/7 Digital Shop' }
];

export default function SocialSetuPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [pricingPeriod, setPricingPeriod] = useState<'monthly' | 'quarterly'>('monthly');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [activeInd, setActiveInd] = useState(0);
  const [isAnnounceVisible, setIsAnnounceVisible] = useState(true);
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const [formLoading, setFormLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const budgetRef = useRef<string>('');

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name'),
      city: formData.get('city'),
      industry: formData.get('industry'),
      budget: budgetRef.current,
      message: formData.get('message'),
      // phone and email need to be collected or added to form
      phone: formData.get('phone'), // I need to check if these are in the form, if not, I might need to add them or use form data properly.
      email: formData.get('email'),
      source: 'contact_form'
    };

    try {
      const response = await fetch('/api/leads/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error();
      setFormSuccess(true);
    } catch {
      setFormError('Something went wrong. Please WhatsApp us.');
    } finally {
      setFormLoading(false);
    }
  };

  // Prevent hydration mismatch for dynamic layout elements
  if (!mounted) {
    return <div className="min-h-screen bg-[#080812]" />;
  }

  return (
    <div className="font-sans min-h-screen mesh-bg selection:bg-primary selection:text-white">
      <AnimatePresence>
        {isAnnounceVisible && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-primary text-white text-center py-2 px-6 text-sm font-bold flex items-center justify-center relative z-[60]"
          >
            <span>🇮🇳 Now serving 20+ cities across India — Get your FREE audit today!</span>
            <button onClick={() => setIsAnnounceVisible(false)} className="absolute right-4 hover:rotate-90 transition-transform">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'glass-nav py-3 shadow-lg' : 'bg-transparent py-6'}`} style={{ top: isAnnounceVisible ? 'auto' : 0 }}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-btn rounded-xl flex items-center justify-center text-xl">🇮🇳</div>
            <span className="font-display font-extrabold text-2xl tracking-tight text-white">Social<span className="text-primary">Setu</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-8 text-sm font-semibold tracking-wide">
            <a href="#home" className="hover:text-primary transition-colors">Home</a>
            <a href="#services" className="hover:text-primary transition-colors">Services</a>
            <Link href="/case-studies" className="hover:text-primary transition-colors">Case Studies</Link>
            <Link href="/blog" className="hover:text-primary transition-colors">Blog</Link>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
            <Link 
              href="/landing" 
              className="gradient-btn px-6 py-2.5 rounded-full flex items-center gap-2 hover:scale-105 transition-transform"
            >
              Get Free Audit <ChevronDown className="w-4 h-4 -rotate-90" />
            </Link>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-white">
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-secondary p-10 flex flex-col gap-6 text-center lg:hidden border-b border-white/5"
            >
              <a href="#home" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold">Home</a>
              <Link href="/case-studies" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold">Case Studies</Link>
              <Link href="/blog" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold">Blog</Link>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold">Pricing</a>
              <a href="#contact" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold">Contact</a>
              <Link href="/landing" className="gradient-btn p-4 rounded-full font-bold">Get Free Audit</Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 3. HERO SECTION */}
      <section id="home" className="relative min-h-screen flex items-center pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated Background Map (Simplified) */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-10">
          <svg viewBox="0 0 800 900" className="w-full h-full object-contain">
            <path d="M400,100 L450,150 L500,120 L550,180 L600,250 L650,350 L620,450 L650,600 L600,750 L500,850 L400,820 L300,850 L200,750 L150,600 L180,450 L150,350 L200,250 L250,180 Z" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary animate-pulse" />
            {/* Metro Dots */}
            <circle cx="280" cy="550" r="4" fill="currentColor" className="text-primary animate-ping" /> {/* Mumbai */}
            <circle cx="380" cy="250" r="4" fill="currentColor" className="text-primary animate-ping delay-300" /> {/* Delhi */}
            <circle cx="420" cy="720" r="4" fill="currentColor" className="text-primary animate-ping delay-500" /> {/* Bangalore */}
          </svg>
        </div>

        <div className="max-w-7xl mx-auto w-full relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-card text-xs font-bold uppercase tracking-widest text-primary mb-8">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              Trusted by brands in 20+ Indian cities
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold leading-[1.1] mb-8">
              We Scale <span className="gradient-text">Indian Brands</span> Across the Map
            </h1>
            <p className="text-text-secondary text-lg md:text-xl leading-relaxed mb-10 max-w-xl">
              From Mumbai startups to Delhi real estate giants — we deliver high-ROI digital 
              growth strategies tailored for India&apos;s diverse markets. 🇮🇳
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/landing" className="gradient-btn px-10 py-5 rounded-full font-bold text-lg flex items-center justify-center gap-3 group">
                Start Growing Today <ArrowRight className="group-hover:translate-x-2 transition-transform" />
              </Link>
              <Link href="/case-studies" className="px-10 py-5 rounded-full border border-white/10 hover:bg-white/5 transition-all font-bold text-lg flex items-center justify-center">
                See Our Results
              </Link>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
              {[
                { val: '500+', label: 'Brands Grown' },
                { val: '20+', label: 'Cities Served' },
                { val: '₹50Cr+', label: 'Ad Spend' },
                { val: '4.9★', label: 'Client Rating' }
              ].map((stat, i) => (
                <div key={i} className="text-center md:text-left">
                  <div className="text-3xl font-display font-black text-white">{stat.val}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-text-secondary mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="hidden lg:block relative"
          >
            <div className="glass-card p-1 relative z-20 overflow-hidden">
               <div className="aspect-[4/5] bg-gradient-to-br from-primary/10 to-accent/50 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-primary/20 blur-[100px] rounded-full animate-pulse"></div>
                  <div className="grid grid-cols-2 gap-4 w-3/4">
                    <div className="glass-card p-6 h-32 flex flex-col justify-between animate-bounce">
                      <TrendingUp className="text-primary" />
                      <div className="font-bold">ROI Focus</div>
                    </div>
                    <div className="glass-card p-6 h-32 mt-12 flex flex-col justify-between animate-bounce delay-200">
                      <Globe className="text-blue-400" />
                      <div className="font-bold">Pan-India</div>
                    </div>
                    <div className="glass-card p-6 h-32 flex flex-col justify-between animate-bounce delay-500">
                      <Zap className="text-yellow-400" />
                      <div className="font-bold">Hyper-Local</div>
                    </div>
                    <div className="glass-card p-6 h-32 mt-12 flex flex-col justify-between animate-bounce delay-700">
                      <MessageSquare className="text-green-400" />
                      <div className="font-bold">Regional</div>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. CITY COVERAGE SECTION */}
      <section className="py-24 border-y border-white/5 bg-white/2">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">India&apos;s Growth Partner</h2>
            <p className="text-text-secondary">We serve every corner of the nation.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {cities.map((city, i) => (
              <motion.span 
                key={i} 
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,107,53,0.2)' }}
                className="px-6 py-3 rounded-full border border-white/10 text-sm font-semibold cursor-pointer transition-all"
              >
                {city}
              </motion.span>
            ))}
          </div>
          <p className="text-center text-text-secondary text-sm mt-12 italic">
            Can&apos;t find your city? We work 100% remotely — anywhere in India.
          </p>
        </div>
      </section>

      {/* 5. SOCIAL PROOF / MARQUEE BAR */}
      <div className="py-12 overflow-hidden bg-accent/30 pointer-events-none">
        <div className="flex animate-marquee whitespace-nowrap mb-8">
          {[...Array(2)].map((_, j) => (
            <div key={j} className="flex gap-12 px-6">
              {['Real Estate Specialists', 'D2C Growth Experts', 'Healthcare Digital Team', 'SaaS Marketing Hub', 'Restaurant Success Team', 'IT Lead Gen Specialists'].map((tag, i) => (
                <div key={i} className="text-4xl font-display font-black text-white/10 uppercase tracking-tighter italic">
                  {tag} <span className="text-primary">•</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex animate-marquee whitespace-nowrap flex-row-reverse">
          {[...Array(2)].map((_, j) => (
            <div key={j} className="flex gap-12 px-6">
              {['500+ Active Brands', 'Pan-India Remote Support', '₹50Cr Managed Budget', 'ROI Analytics 24/7', 'Regional Content Studio', 'Verified Google Partner'].map((tag, i) => (
                <div key={i} className="text-4xl font-display font-black text-white/5 uppercase tracking-tighter italic">
                  {tag} <span className="text-primary">•</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 6. SERVICES SECTION */}
      <section id="services" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">Full-Funnel Growth</h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg">Everything your brand needs to dominate the Indian digital landscape.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { title: 'Social Media Mgmt', desc: 'Consistent daily presence with high-quality creatives.', icon: <Users />, highlight: 'Engagement focus' },
            { title: 'Meta Ads (FB/IG)', desc: 'Hyper-targeted lead gen & sales for local markets.', icon: <Zap />, highlight: 'avg 4.2X ROAS' },
            { title: 'Google Ads & SEO', desc: 'Get found by intent-driven customers pan-India.', icon: <Search />, highlight: 'Search Dominance' },
            { title: 'Reels & Video', desc: 'Viral production in Hindi, English & Regional.', icon: <Video />, highlight: '10M+ Monthly Views' },
            { title: 'LinkedIn Marketing', desc: 'B2B growth & decision-maker targeting solutions.', icon: <Briefcase />, highlight: 'IT & SaaS focus' },
            { title: 'Influencer Marketing', desc: 'Connecting you with creators in every Indian city.', icon: <Users />, highlight: 'Nano to Macro' },
            { title: 'WhatsApp Mktg', desc: 'Automated direct selling on India\'s top platform.', icon: <MessageSquare />, highlight: 'Direct Outreach' },
            { title: 'D2C Brand Growth', desc: 'Scaling product brands from zero to ₹1Cr/mo.', icon: <Rocket />, highlight: 'E-commerce Experts' }
          ].map((service, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-10 group hover:border-primary/50 transition-all flex flex-col"
            >
              <div className="w-14 h-14 gradient-btn rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/20">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold mb-4">{service.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-8 flex-grow">{service.desc}</p>
              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-primary tracking-widest">{service.highlight}</span>
                <ArrowRight size={16} className="text-primary group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 7. INDUSTRIES & TABS */}
      <section id="industries" className="py-32 px-6 bg-accent/20 border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-center mb-16">We Speak Your Industry Language</h2>
          
          <div className="flex overflow-x-auto gap-4 pb-8 mb-12 scrollbar-hide no-scrollbar">
            {industries.map((ind, i) => (
              <button 
                key={i}
                onClick={() => setActiveInd(i)}
                className={`px-8 py-4 rounded-full font-bold whitespace-nowrap transition-all ${activeInd === i ? 'gradient-btn scale-105' : 'glass-card text-text-secondary'}`}
              >
                {ind.name}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeInd}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid lg:grid-cols-2 gap-16 items-center"
            >
              <div className="glass-card p-12 lg:p-16 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <h3 className="text-3xl font-display font-extrabold mb-8 italic text-primary">Challenge: {industries[activeInd].pain}</h3>
                <div className="space-y-8">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-lg mb-1">Our Solution</div>
                      <p className="text-text-secondary text-sm">{industries[activeInd].solve}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-lg mb-1">Direct Result</div>
                      <p className="text-primary text-xl font-display font-black">{industries[activeInd].result}</p>
                    </div>
                  </div>
                </div>
                <Link href="/case-studies" className="mt-12 block w-full text-center py-5 border border-primary/30 rounded-full text-primary font-bold hover:bg-primary hover:text-white transition-all">
                  View Full Case Study
                </Link>
              </div>
              <div className="hidden lg:flex justify-center">
                <div className="relative w-80 h-80">
                  <div className="absolute inset-0 bg-primary/20 blur-[100px] animate-pulse"></div>
                  <div className="relative z-10 w-full h-full gradient-btn rounded-3xl flex items-center justify-center opacity-20">
                    <TrendingUp size={120} className="animate-pulse" />
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* 8. WHY CHOOSE US (USPs) */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-display font-bold">The SocialSetu Edge</h2>
          <p className="text-text-secondary mt-4">Why 500+ Indian brands choose us over freelancer sets.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: 'Deep Market Knowledge', desc: "We understand India's diverse consumer behavior across every state.", icon: '🇮🇳' },
            { title: 'Multilingual Mastery', desc: "Hindi, English, Tamil, Telugu, Marathi & more — we connect locally.", icon: '🗣️' },
            { title: 'ROI-First Strategy', desc: "We track leads & sales, not just vanity metrics like likes & comments.", icon: '📊' },
            { title: 'Dedicated Manager', desc: "One point of contact for all your needs, always responsive on WhatsApp.", icon: '⚡' },
            { title: 'Tier-2 & 3 Expertise', desc: "We know what works beyond the metros in the real Bharat.", icon: '🏙️' },
            { title: 'Flexible Partner', desc: "Month-to-month contracts. We earn your trust every single day.", icon: '🔄' }
          ].map((usp, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.05 }}
              className="glass-card p-10 flex flex-col items-center text-center"
            >
              <div className="text-4xl mb-6">{usp.icon}</div>
              <h4 className="text-xl font-bold mb-4">{usp.title}</h4>
              <p className="text-text-secondary text-sm leading-relaxed">{usp.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 9. RESULTS / CASE STUDIES */}
      <section id="results" className="py-32 px-6 bg-accent/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-display font-bold">Real Proof. Real Brands.</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                title: "Urban Threads D2C",
                city: "Mumbai",
                metrics: "12K → 89K Followers",
                roas: "4.2X ROAS",
                desc: "Scaling a fashion brand from a living room to a pan-India powerhouse."
              },
              {
                title: "Lotus Estates",
                city: "Delhi NCR",
                metrics: "500+ Leads/mo",
                roas: "₹180 CPL",
                desc: "Premium lead generation for luxury apartments in Gurugram."
              }
            ].map((caseStudy, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="glass-card p-12 overflow-hidden relative group"
              >
                <div className="absolute top-0 right-0 p-4">
                  <div className="bg-primary px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest">{caseStudy.city}</div>
                </div>
                <h3 className="text-3xl font-display font-bold mb-6">{caseStudy.title}</h3>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/5 p-6 rounded-2xl">
                    <div className="text-primary font-black text-2xl mb-1">{caseStudy.metrics}</div>
                    <div className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Growth</div>
                  </div>
                  <div className="bg-white/5 p-6 rounded-2xl">
                    <div className="text-white font-black text-2xl mb-1">{caseStudy.roas}</div>
                    <div className="text-[10px] text-text-secondary uppercase font-bold tracking-widest">Performance</div>
                  </div>
                </div>
                <p className="text-text-secondary mb-10 leading-relaxed">{caseStudy.desc}</p>
                <Link href="/case-studies" className="flex items-center gap-3 text-primary font-bold group-hover:gap-5 transition-all">
                  Read Case Study <ArrowRight size={20} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. HOW IT WORKS */}
      <section className="py-32 px-6 max-w-7xl mx-auto overflow-hidden">
        <h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-24">The Growth Path</h2>
        
        <div className="relative">
          {/* Connector Desktop */}
          <div className="hidden lg:block absolute top-[60px] left-0 w-full h-[2px] bg-gradient-to-r from-primary to-accent opacity-20"></div>
          
          <div className="grid lg:grid-cols-4 gap-12">
            {[
              { step: '01', title: 'Free Audit', desc: 'Expert analysis of your present social health.' },
              { step: '02', title: 'Strategy', desc: 'Custom blue-print based on your city & niche.' },
              { step: '03', title: 'Execution', desc: 'Content go-live and ad funnels activated.' },
              { step: '04', title: 'Report & Scale', desc: 'Monthly reviews to double down on what works.' }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 rounded-full gradient-btn flex items-center justify-center text-3xl font-black mb-8 shadow-2xl ring-[8px] ring-white/5">
                  {item.step}
                </div>
                <h4 className="text-xl font-bold mb-4">{item.title}</h4>
                <p className="text-text-secondary text-sm max-w-[200px] leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 11. PRICING SECTION */}
      <section id="pricing" className="py-32 px-6 bg-accent/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-display font-bold mb-6">Invest in Excellence</h2>
            
            <div className="flex items-center justify-center gap-6 mt-12 bg-white/5 w-fit mx-auto p-2 rounded-full border border-white/5">
              <button 
                onClick={() => setPricingPeriod('monthly')}
                className={`px-8 py-3 rounded-full font-bold transition-all ${pricingPeriod === 'monthly' ? 'gradient-btn scale-105' : 'text-text-secondary hover:text-white'}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setPricingPeriod('quarterly')}
                className={`px-8 py-3 rounded-full font-bold transition-all relative ${pricingPeriod === 'quarterly' ? 'gradient-btn scale-105' : 'text-text-secondary hover:text-white'}`}
              >
                Quarterly
                <span className="absolute -top-6 -right-6 bg-green-500 text-[8px] px-2 py-1 rounded-full text-white font-black animate-bounce">15% OFF</span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {pricingPlans.map((plan, i) => (
              <motion.div 
                key={i}
                className={`glass-card p-12 flex flex-col relative ${plan.popular ? 'ring-2 ring-primary scale-105 z-10 shadow-2xl' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-10 -translate-y-1/2 gradient-btn px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">Most Popular</div>
                )}
                <div className="flex-grow">
                  <h4 className="text-xl font-bold mb-1">{plan.name}</h4>
                  <div className="text-text-secondary text-xs mb-8">{plan.description}</div>
                  <div className="text-5xl font-display font-black mb-6">
                    ₹{pricingPeriod === 'monthly' ? plan.monthlyPrice.toLocaleString('en-IN') : plan.quarterlyPrice.toLocaleString('en-IN')}
                    <span className="text-sm text-text-secondary font-medium lowercase">/{pricingPeriod === 'monthly' ? 'mo' : '3mo'}</span>
                  </div>
                  <div className="space-y-4 mb-12">
                    {plan.features.map((feat, j) => (
                      <div key={j} className="flex gap-3 text-sm text-white/80">
                        <Check size={18} className="text-primary flex-shrink-0" />
                        {feat}
                      </div>
                    ))}
                  </div>
                </div>
                <button className={`w-full py-5 rounded-2xl font-bold transition-all text-lg ${plan.popular ? 'gradient-btn' : 'bg-white/5 hover:bg-white/10'}`}>
                  Choose {plan.name}
                </button>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-text-secondary text-xs mt-16">All prices in INR. GST @ 18% extra. No hidden setup fees.</p>
        </div>
      </section>

      {/* 12. TESTIMONIALS */}
      <section className="py-32 px-6 max-w-5xl mx-auto overflow-hidden">
        <div className="text-center mb-24">
          <h2 className="text-4xl font-display font-bold">Loved by 500+ Indian CEOs</h2>
        </div>

        <div className="relative min-h-[450px] flex items-center">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentTestimonial}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: 'spring', damping: 20 }}
              className="text-center w-full"
            >
              <div className="relative inline-block mb-12">
                <div className="w-24 h-24 gradient-btn rounded-full mx-auto flex items-center justify-center text-3xl font-black shadow-2xl relative z-10 font-display">
                  {testimonials[currentTestimonial].avatar}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-primary px-3 py-1 rounded text-[8px] font-bold uppercase shadow-lg text-white z-20">Verified</div>
              </div>
              <div className="flex justify-center gap-1 mb-10">
                {[...Array(5)].map((_, i) => <Star key={i} size={24} className="fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-2xl md:text-4xl font-display font-bold italic text-white/90 leading-[1.3] mb-12 max-w-4xl mx-auto">
                &quot;{testimonials[currentTestimonial].quote}&quot;
              </p>
              <div>
                <h5 className="text-2xl font-black gradient-text">{testimonials[currentTestimonial].name}</h5>
                <p className="text-sm text-text-secondary font-bold mt-2">{testimonials[currentTestimonial].business} • {testimonials[currentTestimonial].location}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 flex gap-3">
             {testimonials.map((_, i) => (
               <button 
                key={i} 
                onClick={() => setCurrentTestimonial(i)}
                className={`w-3 h-3 rounded-full transition-all ${currentTestimonial === i ? 'bg-primary w-10' : 'bg-white/20'}`}
               />
             ))}
          </div>
        </div>
      </section>

      {/* 13. STATS BANNER */}
      <section className="py-24 bg-primary text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-5 gap-12 text-center">
          {[
            { val: '500+', label: 'Brands Scale' },
            { val: '₹50Cr', label: 'Budget Managed' },
            { val: '20+', label: 'Cities Present' },
            { val: '98%', label: 'Retention rate' },
            { val: '4.9★', label: 'Google Rating' }
          ].map((stat, i) => (
            <div key={i}>
              <div className="text-4xl md:text-5xl font-display font-black mb-2">{stat.val}</div>
              <div className="text-[10px] uppercase font-bold tracking-[0.2em] opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 14. FAQ SECTION */}
      <section className="py-32 px-6 max-w-4xl mx-auto">
        <h2 className="text-4xl font-display font-bold text-center mb-20">Clear Answers</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="glass-card overflow-hidden">
              <button 
                onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                className="w-full p-8 text-left flex justify-between items-center bg-white/[0.02] hover:bg-white/[0.05] transition-all"
              >
                <span className="font-bold text-lg">{faq.question}</span>
                <ChevronDown className={`transition-transform duration-500 ${activeFaq === i ? 'rotate-180 text-primary' : ''}`} />
              </button>
              <AnimatePresence>
                {activeFaq === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-8 pt-0 text-text-secondary leading-relaxed border-t border-white/5 mt-[-1px]">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

             {/* 15. CONTACT SECTION */}
      <section id="contact" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-24">
          <div>
            <h2 className="text-5xl md:text-7xl font-display font-black leading-[1.1] mb-10">
              Let&apos;s Grow Your <span className="gradient-text">Empire</span>
            </h2>
            <p className="text-text-secondary text-lg mb-12 leading-relaxed">
              Serving every pin code in India. We&apos;re the bridge between your brand and the massive Indian digital audience.
            </p>
            
            <div className="space-y-8">
              {[
                { label: 'Direct WhatsApp', val: '+91 9876543210', icon: <Phone /> },
                { label: 'Work Email', val: 'hello@socialsetu.com', icon: <Mail /> },
                { label: 'Base Location', val: '100% Remote — Serving Pan-India', icon: <MapPin /> }
              ].map((info, i) => (
                <div key={i} className="flex gap-6 p-8 glass-card group cursor-pointer hover:border-primary transition-all">
                  <div className="w-14 h-14 rounded-2xl gradient-btn flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-all">
                    {info.icon}
                  </div>
                  <div>
                    <div className="text-[10px] text-text-secondary uppercase font-bold tracking-[0.2em] mb-1">{info.label}</div>
                    <div className="text-xl font-bold">{info.val}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-12 lg:p-16 relative">
            <div className="absolute top-0 left-0 w-full h-2 gradient-btn opacity-20"></div>
            {formSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <Rocket size={64} className="text-primary mb-6" />
              <h3 className="text-3xl font-bold mb-4">We&apos;ll call you within 2 hours! 🙏</h3>
              </div>
            ) : (
            <form className="space-y-8" onSubmit={handleContactSubmit}>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary block mb-3">Full Name</label>
                  <input type="text" name="name" required placeholder="Ex: Rahul Sharma" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary block mb-3">City</label>
                  <select name="city" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 appearance-none focus:outline-none focus:ring-2 focus:ring-primary transition-all">
                    {cities.map(c => <option key={c} value={c} className="bg-secondary">{c}</option>)}
                    <option value="Other" className="bg-secondary">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary block mb-3">Industry</label>
                  <input type="text" name="industry" placeholder="Ex: Real Estate" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary block mb-3">Phone</label>
                  <input type="tel" name="phone" placeholder="Ex: +91 99999 00000" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary block mb-3">Your Email</label>
                <input type="email" name="email" placeholder="Ex: hello@example.com" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary block mb-3">Monthly Budget</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['<30K', '30-75K', '75K-1.5L', '1.5L+'].map(b => (
                    <button key={b} type="button" 
                      onClick={() => budgetRef.current = b}
                      className="py-4 border border-white/10 rounded-xl text-xs font-bold hover:bg-primary transition-all active:bg-primary">{b}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary block mb-3">Message (Optional)</label>
                <textarea name="message" rows={4} placeholder="Tell us about your brand goals..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"></textarea>
              </div>
              {formError && <p className="text-red-500 font-bold">{formError}</p>}
              <button disabled={formLoading} className="w-full gradient-btn py-6 rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-105 transition-transform">
                {formLoading ? 'Sending...' : 'Get Your Growth Plan'} <Rocket size={24} />
              </button>
            </form>
            )}
          </div>
        </div>
      </section>


      {/* 16. FOOTER */}
      <footer className="py-32 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-16 mb-24">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 gradient-btn rounded-xl flex items-center justify-center text-xl">🇮🇳</div>
                <span className="font-display font-extrabold text-3xl tracking-tight text-white">Social<span className="text-primary">Setu</span></span>
              </div>
              <p className="text-text-secondary max-w-sm mb-10 leading-relaxed">
                India&apos;s #1 Growth Partner for digital brands. Serving 20+ cities with data-driven 
                performance marketing and creative excellence.
              </p>
              <div className="flex gap-4">
                {[Instagram, Linkedin, Youtube, Twitter, Facebook].map((Icon, i) => (
                  <a key={i} href="#" className="w-12 h-12 rounded-xl glass-card flex items-center justify-center hover:bg-primary transition-all"><Icon size={20} /></a>
                ))}
              </div>
            </div>

            <div>
              <h5 className="font-bold mb-8 uppercase tracking-widest text-[10px] text-primary">Company</h5>
              <ul className="space-y-5 text-sm text-text-secondary">
                <li><Link href="/blog" className="hover:text-white transition-colors">SMM Blog</Link></li>
                <li><Link href="/case-studies" className="hover:text-white transition-colors">Case Studies</Link></li>
                <li><Link href="/crm" className="hover:text-white transition-colors">CRM Dashboard</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/landing" className="hover:text-white transition-colors">Free Audit</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold mb-8 uppercase tracking-widest text-[10px] text-primary">Services</h5>
              <ul className="space-y-5 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-white transition-colors">Meta Ads</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Reels Production</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">LinkedIn B2B</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Google Ads</a></li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold mb-8 uppercase tracking-widest text-[10px] text-primary">Cities</h5>
              <ul className="space-y-5 text-sm text-text-secondary">
                <li><a href="#" className="hover:text-white transition-colors">Mumbai</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Delhi NCR</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Bangalore</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Hyderabad</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] flex flex-col md:flex-row gap-4 text-center md:text-left">
              <span>© 2025 SocialSetu Digital Agency</span>
              <span className="hidden md:inline">|</span>
              <span>Proudly Made in India 🇮🇳</span>
              <span className="hidden md:inline">|</span>
              <span>GST No: 27AAKCS1234Q1Z5</span>
            </div>
            <div className="flex gap-8 text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em]">
              <a href="/privacy" className="hover:text-white">Privacy Policy</a>
              <a href="/terms" className="hover:text-white">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top */}
      <button 
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-10 right-10 w-14 h-14 gradient-btn rounded-full shadow-2xl flex items-center justify-center transition-all ${isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'}`}
      >
        <ChevronDown className="rotate-180" />
      </button>

    </div>
  );
}
