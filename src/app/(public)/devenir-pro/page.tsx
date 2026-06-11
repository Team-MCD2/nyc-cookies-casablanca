"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Building, User, Mail, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Label, Input, Textarea } from "@/components/ui/input";

export default function DevenirProPage() {
  useEffect(() => {
    // Force l'initialisation du SDK MailForm (nécessaire en navigation SPA Next.js)
    window.document.dispatchEvent(new Event("DOMContentLoaded", {
      bubbles: true,
      cancelable: true
    }));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col justify-center py-20 px-4">
      {/* Decorative gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container max-w-xl relative z-10">
        <Link href="/" className="inline-flex items-center gap-2 text-text-3 hover:text-accent transition-colors mb-8 group text-sm font-medium">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Retour à l'accueil
        </Link>

          <div className="stack-xl">
            <div className="stack-sm text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-morphism text-accent text-xs font-bold uppercase tracking-widest border border-accent/20">
                Partenariat B2B
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-display uppercase tracking-tight mt-3">
                Devenir <span className="italic text-accent">Partenaire Pro</span>
              </h1>
              <p className="text-text-3 font-light leading-relaxed mt-2 text-sm sm:text-base">
                Vous gérez un café, un restaurant, un hôtel ou une épicerie fine à Casablanca ? Proposez nos NYC Cookies authentiques à vos clients. Remplissez ce formulaire pour soumettre votre demande de compte.
              </p>
            </div>

            <Card className="glass-morphism border border-white/5 p-8 sm:p-10 rounded-[2rem] shadow-2xl">
              <form data-api-form="nyc" className="stack-lg">
                <Field>
                  <Label htmlFor="company" className="flex items-center gap-2 text-text-2">
                    <Building className="h-4 w-4 text-accent" /> Nom de la société
                  </Label>
                  <Input 
                    name="company" 
                    id="company" 
                    required 
                    placeholder="Ex : Café de France / SARL CookieCorp" 
                    className="bg-black/40 border-white/10 focus:border-accent hover:border-white/20 transition-all rounded-xl h-12"
                  />
                </Field>

                <Field>
                  <Label htmlFor="contactName" className="flex items-center gap-2 text-text-2">
                    <User className="h-4 w-4 text-accent" /> Nom complet du contact
                  </Label>
                  <Input 
                    name="contactName" 
                    id="contactName" 
                    required 
                    placeholder="Ex : Youssef El Alami" 
                    className="bg-black/40 border-white/10 focus:border-accent hover:border-white/20 transition-all rounded-xl h-12"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field>
                    <Label htmlFor="email" className="flex items-center gap-2 text-text-2">
                      <Mail className="h-4 w-4 text-accent" /> Adresse e-mail
                    </Label>
                    <Input 
                      name="email" 
                      id="email" 
                      type="email" 
                      required 
                      placeholder="achats@societe.ma" 
                      className="bg-black/40 border-white/10 focus:border-accent hover:border-white/20 transition-all rounded-xl h-12"
                    />
                  </Field>

                  <Field>
                    <Label htmlFor="phone" className="flex items-center gap-2 text-text-2">
                      <Phone className="h-4 w-4 text-accent" /> WhatsApp (avec indicatif)
                    </Label>
                    <Input 
                      name="phone" 
                      id="phone" 
                      type="tel" 
                      required 
                      placeholder="Ex : +212600000000" 
                      className="bg-black/40 border-white/10 focus:border-accent hover:border-white/20 transition-all rounded-xl h-12"
                    />
                  </Field>
                </div>

                <Field>
                  <Label htmlFor="message" className="flex items-center gap-2 text-text-2">
                    <MessageSquare className="h-4 w-4 text-accent" /> Message / Besoins particuliers (optionnel)
                  </Label>
                  <Textarea 
                    name="message" 
                    id="message" 
                    placeholder="Précisez votre activité, volume hebdomadaire estimé, etc." 
                    rows={4}
                    className="bg-black/40 border-white/10 focus:border-accent hover:border-white/20 transition-all rounded-xl p-3 resize-none"
                  />
                </Field>

                <Button 
                  type="submit" 
                  className="w-full h-14 text-lg shine-effect rounded-full font-bold uppercase tracking-wider"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Soumettre ma demande Pro
                </Button>
              </form>
            </Card>

            <p className="text-center text-xs text-text-3">
              Déjà partenaire ?{" "}
              <Link href="/login" className="text-accent hover:underline font-bold">
                Se connecter à l'espace Pro
              </Link>
            </p>
          </div>
      </div>
    </div>
  );
}
