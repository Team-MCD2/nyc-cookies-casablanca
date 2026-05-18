"use client";

import { useEffect, useRef, useState } from "react";
import { Instagram, Heart, MessageCircle, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export interface InstagramPost {
  code: string;
  type: "reel" | "post";
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
}

const INSTAGRAM_POSTS: InstagramPost[] = [
  {
    code: "DXzdYNltwJk",
    type: "reel",
    imageUrl: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Le coulant suprême Madison Square en action... 🍫✨",
    likes: 1842,
    comments: 112,
  },
  {
    code: "DXe16O5AI0t",
    type: "reel",
    imageUrl: "https://images.unsplash.com/photo-1558961317-5f241202db8c?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Le secret de notre pâte à cookie signature dévoilé ! 🤫🍪",
    likes: 2439,
    comments: 187,
  },
  {
    code: "DSkXdHvDYxM",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1607958996333-41aef7caefaa?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Craquants dehors, fondants dedans. La perfection artisanale. 🤤",
    likes: 954,
    comments: 42,
  },
  {
    code: "DYXmnjfgdB1",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1570696516289-9e44324b16f6?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Notre boîte de 12 cookies, le cadeau parfait pour partager. 🎁🍪",
    likes: 1245,
    comments: 68,
  },
  {
    code: "DQt5uYljeD1",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Pistache, ricotta & amande : Little Italy, le cookie gourmet. 🇮🇹✨",
    likes: 1530,
    comments: 93,
  },
  {
    code: "DOy0dDCDXPg",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1558961318-6f2241b25ec3?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Rikers Island : Triple chocolat intense pour les vrais amateurs. 🖤",
    likes: 1042,
    comments: 51,
  },
  {
    code: "DNgJrVOInb8",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1516685018646-549198525c1b?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Madison Square : le cœur de caramel beurre salé coulant... 🍮💛",
    likes: 1729,
    comments: 88,
  },
  {
    code: "DM5kr-wtAKj",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1618923850107-d1a234d7a73a?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Cookies Box Medium : 6 bonheurs à partager (ou pas !). 😜",
    likes: 1390,
    comments: 72,
  },
  {
    code: "DMc04xGtmwC",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Times Square : Chocolat blanc, cranberries & vanille. 🗽❤️",
    likes: 1105,
    comments: 49,
  },
  {
    code: "DMSjTFiNEoJ",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "L'incontournable Soho : beurre noisette & chocolat noir 70%. 🍫",
    likes: 2154,
    comments: 165,
  },
  {
    code: "DKUfydjoOyh",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1548365328-8c6db3220e4c?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Central Park : Chocolat au lait, noir & fleur de sel. 🧂🌳",
    likes: 1820,
    comments: 119,
  },
  {
    code: "DEQdGmIg1Dl",
    type: "reel",
    imageUrl: "https://images.unsplash.com/photo-1486427944299-d1955d23e317?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Notre équipe prépare vos commandes du jour avec amour ! 👩‍🍳❤️",
    likes: 2012,
    comments: 143,
  },
  {
    code: "DAl51IVttnN",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Pink Velvet : Douceur red velvet & cream cheese fondant. 💗",
    likes: 1354,
    comments: 79,
  },
  {
    code: "DAipHnLig6Z",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Un assortiment qui met tout le monde d'accord. 🍪🔥",
    likes: 1642,
    comments: 84,
  },
  {
    code: "DBJYR8sNKIx",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1584080897711-a8049967aa7a?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Notre Cookie Ice Cream : le sandwich glacé par excellence. 🍦🍪",
    likes: 1983,
    comments: 122,
  },
  {
    code: "C8BwCfDtjJh",
    type: "reel",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Alerte Foodporn : Gros plan sur le coulant au caramel ! 🤤🍮",
    likes: 3102,
    comments: 245,
  },
  {
    code: "C2k_2g5tttu",
    type: "post",
    imageUrl: "https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?auto=format&fit=crop&w=600&h=800&q=80",
    caption: "Le goûter parfait au laboratoire NYC Cookies Casablanca. ☕️",
    likes: 1240,
    comments: 57,
  },
];

export function InstagramFeed() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activePost, setActivePost] = useState<InstagramPost | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-scroll logic ("tourne horizontalement")
  useEffect(() => {
    if (isHovered || activePost) return;

    const timer = setInterval(() => {
      if (scrollRef.current) {
        const container = scrollRef.current;
        const maxScroll = container.scrollWidth - container.clientWidth;
        
        // Loop back to start if we reach the end
        if (container.scrollLeft >= maxScroll - 5) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          container.scrollBy({ left: 280, behavior: "smooth" });
        }
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [isHovered, activePost]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const delta = direction === "left" ? -320 : 320;
      scrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
    }
  };

  const openLightbox = (post: InstagramPost) => {
    setActivePost(post);
    setIframeLoading(true);
  };

  const closeLightbox = () => {
    setActivePost(null);
  };

  return (
    <section 
      className="py-24 md:py-36 bg-[#030303] relative overflow-hidden border-t border-white/5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

      <div className="container relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-6">
          <div className="text-center md:text-left stack-sm">
            <span className="text-accent text-[0.78rem] uppercase tracking-[0.22em] font-semibold">Insta Vibes</span>
            <h2 className="text-5xl md:text-7xl font-display uppercase font-bold tracking-tight text-white mt-2">
              Le Laboratoire <span className="italic text-accent">En Live</span>
            </h2>
            <p className="text-text-3 text-sm md:text-base font-light">
              Suivez nos aventures gourmandes quotidiennes à Casablanca.
            </p>
          </div>

          <Link 
            href="https://www.instagram.com/nyc_cookies_casa" 
            target="_blank" 
            className="flex items-center"
          >
            <Button size="lg" variant="outline" className="h-14 md:h-16 px-8 text-sm md:text-base rounded-full border-accent text-accent hover:bg-accent hover:text-white transition-all duration-300 group shadow-lg shadow-accent/5">
              @nyc_cookies_casa <Instagram className="ml-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Carousel Slider Wrapper */}
        <div className="relative group/carousel">
          {/* Navigation Controls */}
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-accent hover:border-accent hover:scale-105 active:scale-95"
            aria-label="Défiler à gauche"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-12 w-12 rounded-full bg-black/60 border border-white/10 text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover/carousel:opacity-100 transition-opacity duration-300 hover:bg-accent hover:border-accent hover:scale-105 active:scale-95"
            aria-label="Défiler à droite"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Scrolling Track */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-6 scroll-smooth px-2"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {INSTAGRAM_POSTS.map((post) => (
              <div
                key={post.code}
                onClick={() => openLightbox(post)}
                className="min-w-[280px] md:min-w-[310px] aspect-[3/4] relative rounded-3xl overflow-hidden group cursor-pointer border border-white/5 bg-[#121212] snap-start hover:shadow-2xl hover:shadow-accent/10 transition-all duration-500"
              >
                {/* Visual Cover */}
                <Image
                  src={post.imageUrl}
                  alt={post.caption}
                  fill
                  sizes="(max-width: 768px) 280px, 310px"
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Video Play Overlay */}
                {post.type === "reel" && (
                  <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-elev-lg animate-pulse-slow">
                      <Play className="h-6 w-6 fill-current ml-0.5" />
                    </div>
                  </div>
                )}

                {/* Dark Hover Stats Overlay */}
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-6">
                  {/* Top Header */}
                  <div className="flex justify-between items-center">
                    <div className="h-8 w-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
                      <Instagram className="h-4 w-4 text-accent" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-accent font-semibold px-3 py-1 rounded-full bg-accent/10 border border-accent/20">
                      {post.type === "reel" ? "Reel" : "Photo"}
                    </span>
                  </div>

                  {/* Caption Text */}
                  <p className="text-white text-sm font-light leading-relaxed line-clamp-3 text-left">
                    {post.caption}
                  </p>

                  {/* Bottom Stats Info */}
                  <div className="flex gap-6 border-t border-white/10 pt-4 text-xs font-semibold text-text-2">
                    <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                      <Heart className="h-4 w-4 fill-current text-red-500/20 group-hover:text-red-500 transition-colors" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-1.5 hover:text-accent transition-colors">
                      <MessageCircle className="h-4 w-4 fill-current text-accent/20 group-hover:text-accent transition-colors" />
                      <span>{post.comments}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Video & Embed Lightbox Modal */}
      {activePost && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in p-4">
          <div className="absolute inset-0" onClick={closeLightbox} />

          {/* Lightbox Content Sheet */}
          <div className="relative w-full max-w-lg bg-[#0e0e0e] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col items-stretch max-h-[90vh]">
            {/* Modal Top Actions */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 z-10 bg-[#0e0e0e]">
              <div className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-accent" />
                <span className="text-white text-sm font-display font-medium uppercase tracking-wider">
                  Instagram {activePost.type === "reel" ? "Reel" : "Publication"}
                </span>
              </div>
              <button
                onClick={closeLightbox}
                className="h-9 w-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-accent hover:border-accent transition-colors"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Embed Container */}
            <div className="relative flex-1 overflow-y-auto min-h-[380px] md:min-h-[500px] flex items-center justify-center p-4 bg-black">
              {iframeLoading && (
                <div className="absolute inset-0 flex items-center justify-center z-20 bg-black">
                  {/* Subtle golden spinner */}
                  <div className="h-10 w-10 rounded-full border-t-2 border-l-2 border-accent animate-spin" />
                </div>
              )}
              <iframe
                src={`https://www.instagram.com/${activePost.type === "reel" ? "reel" : "p"}/${activePost.code}/embed/captioned/`}
                width="100%"
                height="480"
                frameBorder="0"
                scrolling="no"
                allowTransparency={true}
                className="mx-auto rounded-xl max-w-full"
                onLoad={() => setIframeLoading(false)}
                style={{ minHeight: "440px" }}
              />
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="px-6 py-4 border-t border-white/5 flex gap-3 justify-end bg-[#0e0e0e]">
              <Button variant="outline" size="sm" onClick={closeLightbox}>
                Fermer
              </Button>
              <Link 
                href={`https://www.instagram.com/${activePost.type === "reel" ? "reel" : "p"}/${activePost.code}`}
                target="_blank"
              >
                <Button size="sm">
                  Voir sur Instagram
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
