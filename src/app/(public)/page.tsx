import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Instagram, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Eyebrow } from "@/components/ui/misc";
import { ProductCard } from "@/components/product-card";
import { listActiveProducts } from "@/lib/queries";
import { cn } from "@/lib/utils";

export const revalidate = 60; // ISR: refresh once a minute

export default async function LandingPage() {
  const all = await listActiveProducts().catch(() => []);
  const featured = all.slice(0, 4);

  return (
    <div className="flex flex-col bg-black overflow-x-hidden">
      {/* Cinematic Hero Section */}
      <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden py-20">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero.png"
            alt="NYC Cookies"
            fill
            className="object-cover opacity-50 scale-105 blur-[1px]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black" />
          <div className="absolute inset-0 hero-gradient" />
        </div>

        <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="stack-lg text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-morphism text-accent text-xs font-bold uppercase tracking-widest animate-pulse border-accent/30">
              <span className="h-2 w-2 rounded-full bg-accent" />
              L'Original de New York à Casablanca
            </div>
            <h1 className="text-7xl md:text-8xl lg:text-[10rem] leading-[0.85] text-white font-display uppercase italic perspective-1000">
              <span className="block animate-in fade-in slide-in-from-left duration-700">The</span>
              <span className="block text-accent text-glow animate-in fade-in slide-in-from-left duration-1000 delay-200">Ultimate</span>
              <span className="block text-gradient-accent animate-in fade-in slide-in-from-left duration-1000 delay-500">Cookie.</span>
            </h1>
            <p className="text-xl md:text-2xl text-text-2 max-w-xl mx-auto lg:mx-0 font-light leading-relaxed opacity-0 animate-in fade-in slide-in-from-bottom duration-1000 delay-700 fill-mode-forwards">
              Épais, fondants, et terriblement gourmands. Chaque fournée est une promesse de pur plaisir.
            </p>
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start pt-6 opacity-0 animate-in fade-in slide-in-from-bottom duration-1000 delay-1000 fill-mode-forwards">
              <Link href="/shop">
                <Button size="lg" className="h-16 px-12 text-xl shine-effect rounded-full">
                  Commander
                </Button>
              </Link>
              <Link href="/pro">
                <Button variant="outline" size="lg" className="h-16 px-12 text-xl rounded-full border-white/20 hover:border-accent">
                  Espace Pro
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative hidden lg:flex justify-center perspective-1000">
            <div className="relative w-[550px] h-[550px] animate-float preserve-3d">
               <Image
                 src="/images/cookies/soho.png"
                 alt="Soho Cookie"
                 fill
                 className="object-contain drop-shadow-[0_50px_50px_rgba(213,74,42,0.4)]"
               />
               {/* Floating decorative elements */}
               <div className="absolute -top-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-[80px] animate-pulse" />
               <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent/10 rounded-full blur-[100px] animate-pulse delay-500" />
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50 animate-bounce">
           <span className="text-[10px] uppercase tracking-widest font-bold">Scroll</span>
           <div className="w-[1px] h-12 bg-gradient-to-b from-accent to-transparent" />
        </div>
      </section>

      {/* Featured Products — Dynamic Staggered Grid */}
      <section className="py-40 relative">
        <div className="container">
          <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-12">
            <div className="stack-sm max-w-2xl">
              <Eyebrow>Nos Incontournables</Eyebrow>
              <h2 className="text-6xl md:text-8xl mt-4">La Collection <span className="italic text-accent">Signature</span></h2>
            </div>
            <Link href="/shop">
              <Button variant="ghost" className="text-accent hover:text-accent-hover gap-3 text-xl group">
                Toute la carte <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="flex overflow-x-auto pb-12 gap-6 snap-x snap-mandatory hide-scrollbar md:grid md:grid-cols-2 lg:grid-cols-4 md:overflow-visible md:pb-0">
            {featured.map((p, i) => (
              <div key={p.id} className={cn(
                "min-w-[280px] snap-center transition-all duration-1000",
                i % 2 === 1 ? "md:mt-24" : ""
              )}>
                <div className="relative group p-1 rounded-3xl bg-gradient-to-b from-white/10 to-transparent hover:from-accent/40 transition-all duration-500">
                  <Card className="glass-morphism border-none overflow-hidden rounded-[calc(1.5rem-4px)]">
                    <ProductCard product={p} />
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section — Cinematic Asymmetry */}
      <section className="py-24 md:py-40 bg-surface-1 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
        
        <div className="container relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-32 items-center">
            <div className="relative group">
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5">
                <Image
                  src="/images/hero.png"
                  alt="Crafting Joy"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-[3s] ease-out"
                />
              </div>
              {/* Floating Decorative Card */}
              <div className="absolute -bottom-8 -right-8 hidden xl:block w-72 p-10 glass-morphism rounded-3xl animate-float-slow border-accent/20">
                 <div className="text-5xl font-display text-accent mb-4">100%</div>
                 <h4 className="text-white text-xl mb-2">Artisanal & Frais</h4>
                 <p className="text-sm text-text-3 font-light leading-relaxed">Préparé chaque matin dans notre laboratoire à Casablanca avec les meilleurs ingrédients.</p>
              </div>
            </div>

            <div className="stack-xl">
              <div className="stack-md">
                <Eyebrow>The Soul of NYC</Eyebrow>
                <h2 className="text-5xl md:text-8xl">Plus qu'un cookie, une émotion.</h2>
              </div>
              <div className="stack-lg">
                <p className="text-xl md:text-2xl text-text-2 font-light leading-relaxed">
                  NYC Cookies est né d'une promesse : ramener l'authenticité vibrante de Manhattan au cœur de Casablanca. 
                </p>
                <p className="text-base md:text-lg text-text-3 font-light leading-relaxed max-w-xl">
                  Nos recettes sont le fruit d'un équilibre parfait. Un extérieur doré qui croustille sous la dent, libérant un cœur généreux, fondant et irrésistiblement gourmand.
                </p>
              </div>
              <Link href="/pro" className="group">
                <div className="flex items-center gap-4 text-accent uppercase tracking-widest font-bold text-sm">
                  <span>Découvrir notre espace pro</span>
                  <div className="h-[1px] w-12 bg-accent group-hover:w-20 transition-all" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof — Sleek & Modern */}
      <section className="py-24 md:py-40 bg-black">
        <div className="container">
          <div className="flex flex-col items-center text-center mb-16 md:mb-32">
            <Eyebrow>Feedback</Eyebrow>
            <h2 className="text-5xl md:text-8xl mt-6 italic">Adopté par la ville.</h2>
          </div>
          
          <div className="flex overflow-x-auto pb-12 gap-6 snap-x snap-mandatory hide-scrollbar md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {[
              { name: "Sami B.", text: "Les meilleurs cookies de Casa, point final. Le Soho est une tuerie !", rating: 5, job: "Gourmet" },
              { name: "Lina T.", text: "Livraison rapide et cookies encore tièdes. Le packaging est magnifique.", rating: 5, job: "Artist" },
              { name: "Yassine M.", text: "Une texture incroyable, croustillant dehors et fondant dedans. Je recommande !", rating: 5, job: "Designer" },
            ].map((review, i) => (
              <Card key={i} className="min-w-[300px] snap-center p-8 md:p-12 glass-morphism relative border-none hover:bg-white/5 transition-all duration-700 group">
                <div className="absolute top-6 right-8 text-5xl text-accent/10 font-serif group-hover:text-accent/30 transition-colors">"</div>
                <div className="flex gap-1 text-accent mb-6 md:mb-10">
                  {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 md:h-5 md:w-5 fill-current" />)}
                </div>
                <p className="text-lg md:text-2xl italic text-text-2 mb-8 md:mb-12 font-light leading-snug">
                  {review.text}
                </p>
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-accent to-accent-hover flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg">
                    {review.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-sm md:text-base tracking-widest uppercase text-white">{review.name}</div>
                    <div className="text-[10px] md:text-xs text-accent uppercase tracking-[0.2em] font-medium">{review.job}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — Minimalist & Bold */}
      <section className="py-24 md:py-40 bg-surface-1 border-t border-white/5">
        <div className="container max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-12 md:gap-24">
            <div className="stack-md text-center lg:text-left">
              <Eyebrow>FAQ</Eyebrow>
              <h2 className="text-5xl md:text-6xl italic">Des Questions ?</h2>
              <p className="text-text-3">On a les réponses.</p>
            </div>
            
            <div className="grid gap-4 md:gap-6">
              {[
                { q: "Livrez-vous partout à Casablanca ?", a: "Oui, nous livrons dans tous les quartiers de Casablanca du lundi au dimanche." },
                { q: "Comment conserver mes cookies ?", a: "Ils se conservent parfaitement 3-4 jours dans une boîte hermétique. Vous pouvez les passer 10-15 secondes au micro-ondes pour retrouver le fondant du premier jour !" },
                { q: "Quels sont les délais de livraison ?", a: "Toute commande passée avant 14h est livrée le jour même. Les délais varient entre 45 et 90 minutes selon votre zone." },
                { q: "Faites-vous des événements ?", a: "Absolument ! Mariages, Anniversaires, Corporate. Contactez-nous sur Instagram pour une offre sur mesure." },
              ].map((item, i) => (
                <div key={i} className="group p-6 md:p-10 rounded-2xl bg-black border border-white/5 hover:border-accent/40 transition-all duration-700">
                  <h4 className="text-xl md:text-3xl font-display mb-3 md:mb-6 flex items-center gap-4 md:gap-6 group-hover:text-accent transition-colors">
                    <span className="text-accent/30 text-xs md:text-sm font-body font-bold tracking-tighter">0{i+1}</span>
                    {item.q}
                  </h4>
                  <p className="text-text-3 pl-8 md:pl-14 text-base md:text-xl font-light leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Instagram Vibe — Full Width Experience */}
      <section className="py-40 bg-black relative">
        <div className="container text-center stack-xl items-center">
          <div className="stack-sm">
            <Eyebrow>Join the Community</Eyebrow>
            <h2 className="text-7xl md:text-9xl italic">The Vibe.</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-[3/4] relative rounded-3xl overflow-hidden group border border-white/5">
                <Image
                  src={`/images/cookies/${n === 1 ? 'soho' : n === 2 ? 'bronx' : n === 3 ? 'pink-velvet' : 'central-park'}.png`}
                  alt="NYC Experience"
                  fill
                  className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
          
          <Link href="https://www.instagram.com/nyc_cookies_casa" target="_blank">
            <Button size="lg" variant="outline" className="h-20 px-16 text-2xl rounded-full border-accent text-accent hover:bg-accent hover:text-white transition-all group">
              @nyc_cookies_casa <Instagram className="ml-4 h-6 w-6 group-hover:rotate-12 transition-transform" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Final CTA — Pure Energy */}
      <section className="py-52 bg-accent text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 mix-blend-overlay">
           <div className="text-[15vw] font-display uppercase italic whitespace-nowrap rotate-[-5deg] select-none">NYC COOKIES NYC COOKIES NYC COOKIES</div>
        </div>
        <div className="container relative z-10 stack-xl items-center">
          <h2 className="text-8xl md:text-[12rem] leading-[0.8] tracking-tighter">FAITES-VOUS <br />PLAISIR.</h2>
          <Link href="/shop">
            <Button size="lg" variant="secondary" className="bg-white text-accent hover:bg-black hover:text-white h-24 px-20 text-3xl rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500">
              COMMANDER EN 2 CLICS
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
