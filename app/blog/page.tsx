'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Search, ArrowRight, Calendar, User } from 'lucide-react';
import Link from 'next/link';

const posts = [
  {
    title: "How to Reduce Real Estate CPL by 60% in India (2026 Guide)",
    excerpt: "The old 'Lead Form' way is dying. Learn why cinematic tours and WhatsApp qualifiers are the future...",
    category: "Real Estate",
    date: "April 20, 2026",
    author: "Aditya Verma",
    readTime: "8 min read"
  },
  {
    title: "5 Hidden Reasons Your D2C Brand isn't Scaling on Instagram",
    excerpt: "Most founders forget the 'Profit per Unit' calculation while scaling ads. Here is our scaling checklist...",
    category: "D2C Growth",
    date: "April 18, 2026",
    author: "Ishani Mehta",
    readTime: "12 min read"
  },
  {
    title: "The Ultimate 'Zero Commission' Strategy for Indian Restaurants",
    excerpt: "Stop giving 25% to Swiggy/Zomato. Build your own direct-ordering machine using Meta Ads...",
    category: "Food Tech",
    date: "April 15, 2026",
    author: "Karan Johar",
    readTime: "6 min read"
  }
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Search Header */}
      <nav className="bg-white border-b border-slate-100 p-6 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" className="text-2xl font-black tracking-tighter">SocialSetu<span className="text-indigo-600">.</span>Blog</Link>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search marketing tips..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-6 text-sm font-bold text-slate-600">
            <Link href="/landing" className="text-indigo-600">Free Audit</Link>
            <Link href="/case-studies">Case Studies</Link>
          </div>
        </div>
      </nav>

      {/* Featured Header */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="bg-indigo-600 rounded-[2.5rem] p-8 md:p-16 text-white flex flex-col md:flex-row items-center gap-10 overflow-hidden relative shadow-2xl shadow-indigo-200">
          <div className="w-full md:w-2/3 relative z-10">
            <span className="px-3 py-1 bg-indigo-500 rounded-lg text-xs font-bold uppercase tracking-widest mb-4 inline-block">Featured Insight</span>
            <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">Mastering Meta Ads for the Next 100 Million Indian Users.</h1>
            <p className="text-indigo-100 mb-8 text-lg opacity-90">Why regional language ads and WhatsApp funnels are winning in 2026 across Tier-2 and Tier-3 cities.</p>
            <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold flex items-center gap-2 hover:translate-x-1 transition-all">
              Read Entire Guide <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="w-full md:w-1/3 aspect-square bg-indigo-400/30 rounded-3xl backdrop-blur-sm border border-indigo-300/30 hidden md:flex items-center justify-center">
            <span className="text-indigo-200 text-6xl">📈</span>
          </div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-black tracking-tight">Recent Strategy Reports</h2>
            <p className="text-slate-500">Pure marketing value, zero fluff.</p>
          </div>
          <div className="flex gap-2">
            {['All', 'Real Estate', 'D2C', 'Restaurants'].map(cat => (
              <button key={cat} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${cat === 'All' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-100 hover:bg-slate-100 text-slate-600'}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {posts.map((post, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group cursor-pointer"
            >
              <div className="aspect-[16/10] bg-slate-100 rounded-2xl mb-6 flex items-center justify-center overflow-hidden">
                <div className="group-hover:scale-110 transition-transform duration-500 font-bold text-slate-300">ARTICLE COVER</div>
              </div>
              <div className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">{post.category}</div>
              <h3 className="text-xl font-bold mb-4 leading-snug group-hover:text-indigo-600 transition-colors">{post.title}</h3>
              <p className="text-sm text-slate-500 line-clamp-3 mb-6">{post.excerpt}</p>
              
              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                  <Calendar className="w-3 h-3" /> {post.date}
                </div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read More <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-20 bg-white border-y border-slate-100 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <h3 className="text-2xl font-black mb-4">Join 2,000+ Indian Founders.</h3>
          <p className="text-slate-500 mb-8">Weekly marketing updates that actually move the needle for your business.</p>
          <div className="flex gap-2">
            <input type="email" placeholder="Enter your email" className="flex-1 px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 outline-none focus:ring-2 focus:ring-indigo-600 transition-all" />
            <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">Subscribe</button>
          </div>
        </div>
      </section>

      <footer className="py-12 text-center">
        <div className="flex justify-center gap-8 mb-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
          <Link href="/">Main Site</Link>
          <Link href="/landing">Free Audit</Link>
          <Link href="/case-studies">Case Studies</Link>
        </div>
        <p className="text-slate-300 text-xs italic">Building the next generation of Indian brands.</p>
      </footer>
    </div>
  );
}
