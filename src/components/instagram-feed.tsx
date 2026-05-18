"use client";

import { useState } from "react";
import { Instagram, Heart, MessageCircle, Play, X } from "lucide-react";
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
    imageUrl: "/images/instagram/DXzdYNltwJk.jpg",
    caption: "Le coulant suprême Madison Square en action... 🍫✨",
    likes: 1842,
    comments: 112,
  },
  {
    code: "DXe16O5AI0t",
    type: "reel",
    imageUrl: "/images/instagram/DXe16O5AI0t.jpg",
    caption: "Le secret de notre pâte à cookie signature dévoilé ! 🤫🍪",
    likes: 2439,
    comments: 187,
  },
  {
    code: "DSkXdHvDYxM",
    type: "post",
    imageUrl: "/images/instagram/DSkXdHvDYxM.jpg",
    caption: "Craquants dehors, fondants dedans. La perfection artisanale. 🤤",
    likes: 954,
    comments: 42,
  },
  {
    code: "DYXmnjfgdB1",
    type: "post",
    imageUrl: "/images/instagram/DYXmnjfgdB1.jpg",
    caption: "Notre boîte de 12 cookies, le cadeau parfait pour partager. 🎁🍪",
    likes: 1245,
    comments: 68,
  },
  {
    code: "DQt5uYljeD1",
    type: "post",
    imageUrl: "/images/instagram/DQt5uYljeD1.jpg",
    caption: "Pistache, ricotta & amande : Little Italy, le cookie gourmet. 🇮🇹✨",
    likes: 1530,
    comments: 93,
  },
  {
    code: "DOy0dDCDXPg",
    type: "post",
    imageUrl: "/images/instagram/DOy0dDCDXPg.jpg",
    caption: "Rikers Island : Triple chocolat intense pour les vrais amateurs. 🖤",
    likes: 1042,
    comments: 51,
  },
  {
    code: "DNgJrVOInb8",
    type: "post",
    imageUrl: "/images/instagram/DNgJrVOInb8.jpg",
    caption: "Madison Square : le cœur de caramel beurre salé coulant... 🍮💛",
    likes: 1729,
    comments: 88,
  },
  {
    code: "DM5kr-wtAKj",
    type: "post",
    imageUrl: "/images/instagram/DM5kr-wtAKj.jpg",
    caption: "Cookies Box Medium : 6 bonheurs à partager (ou pas !). 😜",
    likes: 1390,
    comments: 72,
  },
  {
    code: "DMc04xGtmwC",
    type: "post",
    imageUrl: "/images/instagram/DMc04xGtmwC.jpg",
    caption: "Times Square : Chocolat blanc, cranberries & vanille. 🗽❤️",
    likes: 1105,
    comments: 49,
  },
  {
    code: "DMSjTFiNEoJ",
    type: "post",
    imageUrl: "/images/instagram/DMSjTFiNEoJ.jpg",
    caption: "L'incontournable Soho : beurre noisette & chocolat noir 70%. 🍫",
    likes: 2154,
    comments: 165,
  },
  {
    code: "DKUfydjoOyh",
    type: "post",
    imageUrl: "/images/instagram/DKUfydjoOyh.jpg",
    caption: "Central Park : Chocolat au lait, noir & fleur de sel. 🧂🌳",
    likes: 1820,
    comments: 119,
  },
  {
    code: "DEQdGmIg1Dl",
    type: "reel",
    imageUrl: "/images/instagram/DEQdGmIg1Dl.jpg",
    caption: "Notre équipe prépare vos commandes du jour avec amour ! 👩‍🍳❤️",
    likes: 2012,
    comments: 143,
  },
  {
    code: "DAl51IVttnN",
    type: "post",
    imageUrl: "/images/instagram/DAl51IVttnN.jpg",
    caption: "Pink Velvet : Douceur red velvet & cream cheese fondant. 💗",
    likes: 1354,
    comments: 79,
  },
  {
    code: "DAipHnLig6Z",
    type: "post",
    imageUrl: "/images/instagram/DAipHnLig6Z.jpg",
    caption: "Un assortiment qui met tout le monde d'accord. 🍪🔥",
    likes: 1642,
    comments: 84,
  },
  {
    code: "DBJYR8sNKIx",
    type: "post",
    imageUrl: "/images/instagram/DBJYR8sNKIx.jpg",
    caption: "Notre Cookie Ice Cream : le sandwich glacé par excellence. 🍦🍪",
    likes: 1983,
    comments: 122,
  },
  {
    code: "C8BwCfDtjJh",
    type: "reel",
    imageUrl: "/images/instagram/C8BwCfDtjJh.jpg",
    caption: "Alerte Foodporn : Gros plan sur le coulant au caramel ! 🤤🍮",
    likes: 3102,
    comments: 245,
  },
  {
    code: "C2k_2g5tttu",
    type: "post",
    imageUrl: "/images/instagram/C2k_2g5tttu.jpg",
    caption: "Le goûter parfait au laboratoire NYC Cookies Casablanca. ☕️",
    likes: 1240,
    comments: 57,
  },
];

// Split the 17 items into two distinct rows for dual scrolling (just like Blossom Coffee)
const ROW1 = INSTAGRAM_POSTS.slice(0, 9);
const ROW2 = INSTAGRAM_POSTS.slice(9);

export function InstagramFeed() {
  const [activePost, setActivePost] = useState<InstagramPost | null>(null);

  const openLightbox = (post: InstagramPost) => {
    setActivePost(post);
  };

  const closeLightbox = () => {
    setActivePost(null);
  };

  return (
    <section className="py-24 md:py-36 bg-[#FAF6F0] text-black relative overflow-hidden border-y border-black/5">
      {/* CSS Styles for Smooth Marquees (offset scrolling) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .marquee-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
          overflow: hidden;
          position: relative;
        }
        
        .marquee-track-left {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          animation: marqueeLeft 65s linear infinite;
        }
        
        .marquee-track-right {
          display: flex;
          gap: 1.5rem;
          width: max-content;
          animation: marqueeRight 65s linear infinite;
        }
        
        .marquee-container:hover .marquee-track-left,
        .marquee-container:hover .marquee-track-right {
          animation-play-state: paused;
        }
        
        @keyframes marqueeLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        @keyframes marqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
      `}} />

      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />

      <div className="container relative z-10 mb-16 text-center">
        <span className="text-accent text-[0.8rem] uppercase tracking-[0.25em] font-bold">@nyc_cookies_casa</span>
        <h2 className="text-5xl md:text-8xl font-display uppercase font-bold tracking-tight text-black mt-2">
          Le Labo <span className="italic text-accent">En Mouvement</span>
        </h2>
        <p className="text-text-muted mt-4 max-w-xl mx-auto text-sm md:text-base font-light">
          Découvrez la préparation de nos cookies en direct de notre laboratoire à Casablanca !
        </p>
      </div>

      {/* Blossom Coffee Style Dual Row Infinite Marquee */}
      <div className="marquee-container">
        {/* Row 1 - Slides Left */}
        <div className="marquee-track-left">
          {[...ROW1, ...ROW1].map((post, idx) => (
            <div
              key={`${post.code}-r1-${idx}`}
              onClick={() => openLightbox(post)}
              className="w-[280px] md:w-[350px] aspect-[16/11] relative rounded-[2rem] overflow-hidden group cursor-pointer border-2 border-accent/20 hover:border-accent hover:scale-[1.02] shadow-lg transition-all duration-500 bg-white"
            >
              <Image
                src={post.imageUrl}
                alt={post.caption}
                fill
                sizes="(max-width: 768px) 280px, 350px"
                className="object-cover"
              />
              
              {/* Play Icon overlay for videos/reels */}
              {post.type === "reel" && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="h-12 w-12 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                </div>
              )}

              {/* Hover Dark Card details */}
              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-6">
                <div className="flex justify-between items-center text-white">
                  <Instagram className="h-5 w-5 text-accent" />
                  <span className="text-[9px] uppercase tracking-widest text-accent font-semibold px-2 py-0.5 rounded-full bg-accent/20 border border-accent/30">
                    {post.type === "reel" ? "Reel" : "Photo"}
                  </span>
                </div>
                <p className="text-white text-xs md:text-sm font-light leading-relaxed line-clamp-3 text-left">
                  {post.caption}
                </p>
                <div className="flex gap-4 border-t border-white/10 pt-3 text-[11px] font-semibold text-white/70">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-red-500 fill-current" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5 text-accent fill-current" />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2 - Slides Right */}
        <div className="marquee-track-right">
          {[...ROW2, ...ROW2].map((post, idx) => (
            <div
              key={`${post.code}-r2-${idx}`}
              onClick={() => openLightbox(post)}
              className="w-[280px] md:w-[350px] aspect-[16/11] relative rounded-[2rem] overflow-hidden group cursor-pointer border-2 border-accent/20 hover:border-accent hover:scale-[1.02] shadow-lg transition-all duration-500 bg-white"
            >
              <Image
                src={post.imageUrl}
                alt={post.caption}
                fill
                sizes="(max-width: 768px) 280px, 350px"
                className="object-cover"
              />
              
              {/* Play Icon overlay for videos/reels */}
              {post.type === "reel" && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="h-12 w-12 rounded-full bg-white/30 backdrop-blur-md border border-white/40 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                </div>
              )}

              {/* Hover Dark Card details */}
              <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-6">
                <div className="flex justify-between items-center text-white">
                  <Instagram className="h-5 w-5 text-accent" />
                  <span className="text-[9px] uppercase tracking-widest text-accent font-semibold px-2 py-0.5 rounded-full bg-accent/20 border border-accent/30">
                    {post.type === "reel" ? "Reel" : "Photo"}
                  </span>
                </div>
                <p className="text-white text-xs md:text-sm font-light leading-relaxed line-clamp-3 text-left">
                  {post.caption}
                </p>
                <div className="flex gap-4 border-t border-white/10 pt-3 text-[11px] font-semibold text-white/70">
                  <div className="flex items-center gap-1">
                    <Heart className="h-3.5 w-3.5 text-red-500 fill-current" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5 text-accent fill-current" />
                    <span>{post.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="container relative z-10 mt-16 text-center">
        <Link 
          href="https://www.instagram.com/nyc_cookies_casa" 
          target="_blank" 
          className="inline-block"
        >
          <Button size="lg" className="h-16 px-10 text-base rounded-full bg-accent hover:bg-black text-white hover:text-white transition-all duration-300 shadow-xl hover:shadow-accent/25 group">
            Rejoindre la communauté @nyc_cookies_casa
            <Instagram className="ml-3 h-5 w-5 group-hover:rotate-12 transition-transform" />
          </Button>
        </Link>
      </div>

      {/* Direct Native Video & Image Lightbox Modal */}
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

            {/* Direct Media Player Container (Instant Load, Autoplay & Volume controls enabled) */}
            <div className="relative flex-1 overflow-y-auto min-h-[380px] md:min-h-[500px] flex items-center justify-center p-4 bg-black">
              {activePost.type === "reel" ? (
                <video
                  src={`/videos/instagram/${activePost.code}.mp4`}
                  autoPlay
                  controls
                  playsInline
                  loop
                  className="mx-auto max-h-[70vh] rounded-xl object-contain bg-black w-full"
                  style={{ minHeight: "440px" }}
                />
              ) : (
                <div className="relative w-full aspect-[4/5] max-h-[70vh] rounded-xl overflow-hidden bg-black flex items-center justify-center">
                  <Image
                    src={activePost.imageUrl}
                    alt={activePost.caption}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
            </div>

            {/* Post Details (Caption + Stats) */}
            <div className="px-6 py-5 border-t border-white/5 bg-[#0e0e0e] text-left">
              <p className="text-white text-sm font-light leading-relaxed mb-4">
                {activePost.caption}
              </p>
              <div className="flex gap-6 text-xs font-semibold text-text-2">
                <div className="flex items-center gap-1.5 text-red-500">
                  <Heart className="h-4 w-4 fill-current" />
                  <span>{activePost.likes} likes</span>
                </div>
                <div className="flex items-center gap-1.5 text-accent">
                  <MessageCircle className="h-4 w-4 fill-current" />
                  <span>{activePost.comments} commentaires</span>
                </div>
              </div>
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
