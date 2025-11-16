import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "FREE",
    price: "0$",
    description: "Parfait pour commencer",
    features: [
      "1 mission publiée/jour",
      "6 photos de portfolio",
      "0% de frais de plateforme",
      "Accès aux missions de base",
    ],
  },
  {
    name: "PRO",
    price: "29$/mois",
    description: "Pour les professionnels actifs",
    features: [
      "Missions illimitées",
      "Carrousels boost",
      "Auto-leadgen silencieux",
      "3 profils spéciaux",
      "Analytics de base",
      "Frais réduits (5%)",
    ],
  },
  {
    name: "PREMIUM",
    price: "79$/mois",
    description: "Pour les experts",
    features: [
      "Tout PRO inclus",
      "Priorisation matching",
      "Badge 'Certifié'",
      "Pages vitrines SEO",
      "CRM avancé",
      "Support prioritaire",
      "Frais réduits (3%)",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4">
      <div className="max-w-6xl mx-auto py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Tarifs</h1>
          <p className="text-white/70 text-lg">
            Choisis le plan qui correspond à tes besoins
          </p>
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.name === "PRO" ? "border-red-500" : ""}
            >
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.name !== "FREE" && (
                    <span className="text-white/50">/mois</span>
                  )}
                </div>
                <p className="text-white/70 mt-2">{plan.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.name === "PRO" ? "default" : "outline"}
                >
                  {plan.name === "FREE" ? "Commencer" : "S'abonner"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

