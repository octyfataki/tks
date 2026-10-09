"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Verify2faForm } from "./verify-2fa-form";
import { VerifyOtpForm } from "./verify-otp-form";

/**
 * Second facteur à la connexion : application d'authentification (TOTP,
 * recommandé, hors-ligne) ou code reçu par email. Le serveur n'accepte que
 * les méthodes réellement disponibles pour le compte.
 */
export function VerificationSecondFacteur() {
  return (
    <Tabs defaultValue="application" className="w-full">
      <TabsList aria-label="Méthode de vérification" className="grid w-full grid-cols-2">
        <TabsTrigger value="application">Application</TabsTrigger>
        <TabsTrigger value="email">Email</TabsTrigger>
      </TabsList>
      <TabsContent value="application" className="mt-4">
        <Verify2faForm />
      </TabsContent>
      <TabsContent value="email" className="mt-4">
        <VerifyOtpForm />
      </TabsContent>
    </Tabs>
  );
}
