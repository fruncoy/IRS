"use client";

import { motion } from "framer-motion";
import { Upload, Search, ShieldCheck } from "lucide-react";

const steps = [
  {
    title: "Upload",
    description: "Msee mwenye ameokota ID yako anaiupload securely kwa system.",
  },
  {
    title: "Search",
    description: "Search kutumia ID number na DOB yako kuona kama kuna match.",
  },
  {
    title: "Login",
    description: "Login uthibitishe ni yako na uone details za mwenye ameipata.",
  },
  {
    title: "Recover",
    description: "Wasiliana naye mpange venye utachukua ID yako safely.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      {/* Background accents for glassmorphism on white */}
      <div className="absolute top-1/4 -right-20 w-64 h-64 bg-[#003580]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -left-20 w-64 h-64 bg-[#ffb700]/5 rounded-full blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col items-start text-left mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl">
            Recovering your lost documents is now safer and faster. Follow our simple process to get back your identity.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative"
            >
              <div className="h-full bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 transition-all duration-300 relative overflow-hidden shadow-sm">
                <div className="absolute -right-2 -top-4 opacity-10">
                  <span className="text-8xl font-serif text-black select-none tracking-tighter">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3 relative z-10">{step.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed relative z-10">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
