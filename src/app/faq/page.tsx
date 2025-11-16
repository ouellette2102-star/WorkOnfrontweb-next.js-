import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "Comment fonctionne le matching ?",
    answer:
      "Notre algorithme analyse la distance, les compétences, les notes, la disponibilité et l'ajustement des prix pour trouver les meilleures correspondances.",
  },
  {
    question: "Les travailleurs sont-ils des employés ?",
    answer:
      "Non. Les travailleurs sont des travailleurs autonomes indépendants. Chaque mission est régie par un contrat de service.",
  },
  {
    question: "Comment sont gérés les paiements ?",
    answer:
      "Les paiements sont sécurisés via Stripe Connect. Les fonds sont mis en attente jusqu'à la completion de la mission, puis transférés au travailleur.",
  },
  {
    question: "Puis-je annuler une mission ?",
    answer:
      "Oui, selon les conditions du contrat. Les frais d'annulation peuvent s'appliquer selon le moment de l'annulation.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4">
      <div className="max-w-4xl mx-auto py-16">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Questions fréquentes
        </h1>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/70">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

