import { SignUp } from "@clerk/nextjs";

export default function SignupPage() {
  return (
    <div className="w-full max-w-[440px]">
      <h1 className="font-display text-[2rem] tracking-[0.04em]">Créer un compte</h1>
      <p className="mt-1 text-text-3">Rejoignez NYC Cookies et commandez en quelques clics.</p>
      <div className="mt-6">
        <SignUp appearance={{ elements: { rootBox: "w-full", card: "bg-transparent shadow-none" } }} />
      </div>
    </div>
  );
}
