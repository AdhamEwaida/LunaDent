import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, Filter, Calendar, Clock, User, Tag, BookOpen, ChevronRight } from "lucide-react";
import { BLOG_POSTS, IMAGES, DOCTORS, TREATMENTS } from "@/lib/data";
import { FadeIn, StaggerGroup, StaggerItem, HoverCard } from "@/components/Motion";

// ===== BLOG LISTING =====
export function Blog() {
  const categories = ["All","Cosmetic Dentistry","Implants","Orthodontics","Prevention","Technology"];
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");

  const allPosts = [
    ...BLOG_POSTS,
    { id: 4, title: "Caring for Your Dental Implants: A Complete 2026 Guide", category: "Implants", date: "Feb 18, 2026", readTime: "8 min", img: IMAGES.teeth1, excerpt: "Implants can last a lifetime with proper care. Here's everything you need to know about maintenance, hygiene, and long-term protection." },
    { id: 5, title: "How to Overcome Dental Anxiety: Dr. Laurent's Tips", category: "Prevention", date: "Feb 5, 2026", readTime: "4 min", img: IMAGES.smile2, excerpt: "Dental anxiety affects millions. Our specialists share proven techniques to help you feel calm and confident at every visit." },
    { id: 6, title: "Digital Smile Design: The Technology Behind Perfect Veneers", category: "Technology", date: "Jan 22, 2026", readTime: "6 min", img: IMAGES.tech1, excerpt: "From 3D scanning to digital wax-ups, we walk through the exact technology that makes our veneer outcomes so precise and predictable." },
  ];

  const filtered = allPosts.filter(p =>
    (cat === "All" || p.category === cat) &&
    (p.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen pt-12 pb-24" style={{ background: "var(--background)" }}>
      {/* Hero */}
      <section className="py-16" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="text-xs font-semibold tracking-widest uppercase text-white/60 mb-2 block">Dental Journal</span>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Expert Dental Insights
          </h1>
          <p className="text-base text-white/75 mb-6">Tips, guides, and expert knowledge from the LunaDent specialist team.</p>
          <div className="max-w-md mx-auto relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search articles..."
              className="w-full pl-10 pr-4 py-3.5 rounded-full text-sm outline-none"
              style={{ background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.25)" }} />
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className="px-4 py-2 rounded-full text-sm font-medium transition-all"
              style={{
                background: cat === c ? "var(--primary)" : "var(--card)",
                color: cat === c ? "var(--primary-foreground)" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}>
              {c}
            </button>
          ))}
        </div>

        {/* Featured */}
        {filtered.length > 0 && (
          <FadeIn>
            <Link to={`/blog/${filtered[0].id}`}>
              <div className="rounded-3xl overflow-hidden border mb-8 group"
                style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative h-64 md:h-80 overflow-hidden">
                    <img src={filtered[0].img} alt={filtered[0].title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent, rgba(59,30,84,0.2))" }} />
                    <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ background: "var(--accent)" }}>{filtered[0].category}</span>
                  </div>
                  <div className="p-8 flex flex-col justify-center">
                    <span className="text-xs font-semibold mb-2" style={{ color: "var(--accent)" }}>✨ Featured Article</span>
                    <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
                      {filtered[0].title}
                    </h2>
                    <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--muted-foreground)" }}>
                      {filtered[0].excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span className="flex items-center gap-1"><Calendar size={11} />{filtered[0].date}</span>
                      <span className="flex items-center gap-1"><Clock size={11} />{filtered[0].readTime} read</span>
                      <span className="flex items-center gap-1 font-medium" style={{ color: "var(--primary)" }}>
                        Read More <ArrowRight size={12} />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </FadeIn>
        )}

        {/* Grid */}
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.slice(1).map(p => (
            <StaggerItem key={p.id}>
              <HoverCard className="h-full">
                <Link to={`/blog/${p.id}`}>
                  <div className="rounded-2xl overflow-hidden border h-full flex flex-col"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="h-44 overflow-hidden relative">
                      <img src={p.img} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-xs text-white"
                        style={{ background: "var(--accent)" }}>{p.category}</span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-semibold text-sm leading-snug mb-2 flex-1" style={{ color: "var(--foreground)" }}>{p.title}</h3>
                      <p className="text-xs leading-relaxed mb-4" style={{ color: "var(--muted-foreground)" }}>{p.excerpt}</p>
                      <div className="flex items-center justify-between text-xs pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                        <span style={{ color: "var(--muted-foreground)" }}>{p.date}</span>
                        <span className="flex items-center gap-1 font-medium" style={{ color: "var(--primary)" }}>
                          Read <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </HoverCard>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </div>
  );
}

// ===== BLOG DETAIL =====
export function BlogDetail() {
  const post = BLOG_POSTS[0];
  return (
    <div className="min-h-screen py-12 pb-24" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs mb-6" style={{ color: "var(--muted-foreground)" }}>
          <Link to="/" className="hover:opacity-70">Home</Link>
          <ChevronRight size={12} />
          <Link to="/blog" className="hover:opacity-70">Blog</Link>
          <ChevronRight size={12} />
          <span style={{ color: "var(--foreground)" }}>Cosmetic Dentistry</span>
        </div>

        <FadeIn>
          <span className="px-3 py-1 rounded-full text-xs font-semibold mb-4 inline-block"
            style={{ background: "var(--secondary)", color: "var(--accent)" }}>Cosmetic Dentistry</span>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs mb-8" style={{ color: "var(--muted-foreground)" }}>
            <span className="flex items-center gap-1"><Calendar size={11} />{post.date}</span>
            <span className="flex items-center gap-1"><Clock size={11} />{post.readTime} read</span>
            <span className="flex items-center gap-1"><User size={11} />Dr. Sophie Laurent</span>
          </div>
        </FadeIn>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden mb-8 h-72">
              <img src={post.img} alt={post.title} className="w-full h-full object-cover" />
            </div>

            <div className="prose-sm max-w-none" style={{ color: "var(--foreground)" }}>
              <p className="text-base leading-relaxed mb-4">{post.excerpt}</p>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
                What Makes a Hollywood Smile?
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--muted-foreground)" }}>
                A Hollywood Smile is a comprehensive smile makeover that typically involves a combination of porcelain veneers, teeth whitening, and sometimes gum contouring. The goal is to create a perfectly shaped, brilliantly white smile that looks completely natural.
              </p>
              <h2 className="text-2xl font-bold mt-8 mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", color: "var(--primary)" }}>
                The Digital Planning Process
              </h2>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--muted-foreground)" }}>
                At LunaDent Studio, every Hollywood Smile begins with our Digital Smile Design (DSD) process. Using advanced 3D imaging and simulation software, we create a precise digital mockup of your future smile before a single tooth is touched.
              </p>
              {[
                "Step 1: Full digital face scan and photograph analysis",
                "Step 2: 3D smile simulation — see your results first",
                "Step 3: Custom veneer design with your input",
                "Step 4: Fabrication in our partner premium ceramics lab",
                "Step 5: Try-in session and final bonding",
              ].map(s => (
                <div key={s} className="flex items-start gap-2 my-2">
                  <span className="mt-1" style={{ color: "var(--accent)" }}>→</span>
                  <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>{s}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-10 p-6 rounded-2xl" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Ready to Start Your Smile Journey?
              </h3>
              <p className="text-sm text-white/80 mb-4">Book a free Hollywood Smile consultation with Dr. Laurent today.</p>
              <Link to="/booking"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold"
                style={{ background: "#D7B98E", color: "#2E2A2F" }}>
                Book Free Consultation <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* TOC */}
            <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Table of Contents</h4>
              {["What Makes a Hollywood Smile?","The Digital Planning Process","Cost and Timeline","Aftercare Guide","FAQ"].map((t, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "var(--secondary)", color: "var(--primary)" }}>{i + 1}</div>
                  <span className="text-xs hover:opacity-70 cursor-pointer" style={{ color: "var(--foreground)" }}>{t}</span>
                </div>
              ))}
            </div>

            {/* Related Doctor */}
            <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Author</h4>
              <div className="flex items-center gap-3">
                <img src={DOCTORS[0].img} alt={DOCTORS[0].name} className="w-12 h-12 rounded-xl object-cover" />
                <div>
                  <div className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{DOCTORS[0].name}</div>
                  <div className="text-xs" style={{ color: "var(--accent)" }}>{DOCTORS[0].title}</div>
                </div>
              </div>
            </div>

            {/* Related Treatments */}
            <div className="rounded-2xl border p-5" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
              <h4 className="font-semibold text-sm mb-3" style={{ color: "var(--foreground)" }}>Related Treatments</h4>
              {TREATMENTS.slice(0, 3).map(t => (
                <Link key={t.id} to="/treatments"
                  className="flex items-center gap-3 py-2 hover:opacity-70 transition-opacity">
                  <span className="text-lg">{t.icon}</span>
                  <span className="text-sm" style={{ color: "var(--foreground)" }}>{t.name}</span>
                  <ChevronRight size={12} className="ml-auto" style={{ color: "var(--muted-foreground)" }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
