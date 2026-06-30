import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centre de confiance - WorkOn",
  description:
    "Verification du telephone, de l'identite, des paiements et des informations de cie du compte WorkOn.",
};

export default function ProfileVerifyLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
