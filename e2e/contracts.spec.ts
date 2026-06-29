import { test, expect } from "./fixtures/console";
import { auditA11y } from "./fixtures/a11y";
import type { BrowserContext, Page } from "@playwright/test";
import type { ContractResponse } from "@/lib/api-client";

const USER = {
  id: "u_e2e_client",
  email: "client.e2e@workon.test",
  firstName: "Sam",
  lastName: "Patron",
  role: "employer",
  city: "Montreal",
  onboardingCompletedAt: "2026-01-01T00:00:00.000Z",
};

function b64(obj: unknown) {
  return Buffer.from(JSON.stringify(obj)).toString("base64url");
}

function makeJwt() {
  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
    sub: USER.id,
    role: USER.role,
  })}.sig`;
}

function mission(id: string, title: string, price: number) {
  return {
    id,
    title,
    description: `${title} avec verification du chantier et protection des surfaces.`,
    category: "Reparations",
    status: "assigned",
    price,
    city: "Montreal",
    address: "123 rue WorkOn",
    durationMinutes: 180,
    materialProvided: true,
    createdAt: "2026-06-20T12:00:00.000Z",
    updatedAt: "2026-06-28T12:00:00.000Z",
  };
}

const worker = {
  id: "u_e2e_worker",
  firstName: "Alex",
  lastName: "Pro",
  city: "Montreal",
  pictureUrl: null,
  jobTitle: "Electricien residentiel",
  hourlyRate: 85,
  ratingAverage: 4.8,
  reviewCount: 17,
};

const employer = {
  id: USER.id,
  firstName: "Sam",
  lastName: "Patron",
  city: "Montreal",
  pictureUrl: null,
  businessName: "Gestion WorkOn",
};

const baseContracts: ContractResponse[] = [
  {
    id: "contract_e2e_draft",
    missionId: null,
    employerId: null,
    workerId: null,
    localMissionId: "mission_e2e_cuisine",
    localEmployerId: USER.id,
    localWorkerId: worker.id,
    status: "DRAFT",
    amount: 320,
    hourlyRate: null,
    startAt: "2026-07-02T13:00:00.000Z",
    endAt: null,
    signedByWorker: false,
    signedByEmployer: false,
    terms: "Inclut la preparation, la pose et le nettoyage final.",
    createdAt: "2026-06-25T12:00:00.000Z",
    updatedAt: "2026-06-28T12:00:00.000Z",
    mission: null,
    employer: null,
    worker: null,
    localMission: mission("mission_e2e_cuisine", "Reparer les prises de cuisine", 320),
    localEmployer: employer,
    localWorker: worker,
  },
  {
    id: "contract_e2e_pending",
    missionId: null,
    employerId: null,
    workerId: null,
    localMissionId: "mission_e2e_lumiere",
    localEmployerId: USER.id,
    localWorkerId: worker.id,
    status: "PENDING",
    amount: 180,
    hourlyRate: 90,
    startAt: null,
    endAt: null,
    signedByWorker: false,
    signedByEmployer: true,
    terms: null,
    createdAt: "2026-06-24T12:00:00.000Z",
    updatedAt: "2026-06-27T12:00:00.000Z",
    mission: null,
    employer: null,
    worker: null,
    localMission: mission("mission_e2e_lumiere", "Installer deux luminaires", 180),
    localEmployer: employer,
    localWorker: worker,
  },
  {
    id: "contract_e2e_accepted",
    missionId: null,
    employerId: null,
    workerId: null,
    localMissionId: "mission_e2e_salon",
    localEmployerId: USER.id,
    localWorkerId: worker.id,
    status: "ACCEPTED",
    amount: 145,
    hourlyRate: null,
    startAt: null,
    endAt: "2026-07-05T17:00:00.000Z",
    signedByWorker: true,
    signedByEmployer: true,
    terms: "Paiement apres verification finale.",
    createdAt: "2026-06-23T12:00:00.000Z",
    updatedAt: "2026-06-26T12:00:00.000Z",
    mission: null,
    employer: null,
    worker: null,
    localMission: mission("mission_e2e_salon", "Verification prises salon", 145),
    localEmployer: employer,
    localWorker: worker,
  },
];

async function setupAuth(page: Page, context: BrowserContext) {
  const fakeJwt = makeJwt();

  await context.addCookies([
    {
      name: "workon_token",
      value: "e2e_fixture_token",
      domain: "localhost",
      path: "/",
    },
  ]);

  await page.addInitScript((user) => {
    try {
      const encode = (obj: unknown) =>
        btoa(JSON.stringify(obj))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
      const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
        sub: user.id,
        role: user.role,
      })}.sig`;
      localStorage.setItem("workon_user", JSON.stringify(user));
      localStorage.setItem("workon_access_token", token);
      localStorage.setItem("workon_refresh_token", "e2e_fake_refresh");
      localStorage.setItem("cookie-consent", "accepted");
    } catch {}
  }, USER);

  await page.route("**/api/auth/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(USER),
    }),
  );
  await page.route("**/api/auth/refresh", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ user: USER, accessToken: fakeJwt }),
    }),
  );
  await page.route("**/api/workon/devices", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: "dev_e2e", deviceId: "e2e", platform: "web" }),
    }),
  );
  await page.route("**/api/workon/compliance/versions", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        versions: { termsOfService: "1.0", privacyPolicy: "1.0" },
      }),
    }),
  );
  await page.route("**/api/workon/compliance/status", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ isComplete: true, missing: [] }),
    }),
  );
  await page.route("**/api/workon/messages-local/unread-count", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count: 0 }),
    }),
  );
  await page.route("**/api/workon/notifications/unread-count", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ count: 0 }),
    }),
  );
  await page.route("**/api/workon/reviews/pending-for-me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    }),
  );
}

test("contrats : liste, filtres, detail et mutation statut", async ({
  page,
  context,
  consoleErrors,
}) => {
  test.setTimeout(120_000);
  await setupAuth(page, context);

  let contracts = baseContracts.map((contract) => ({ ...contract }));
  let statusPatch: { id: string; status: string } | null = null;

  await page.route("**/api/workon/contracts/user/me", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(contracts),
    }),
  );

  await page.route("**/api/workon/contracts/**", async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname.endsWith("/contracts/user/me")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(contracts),
      });
    }

    const parts = url.pathname.split("/");
    const contractId = parts[parts.indexOf("contracts") + 1];

    if (url.pathname.endsWith("/status")) {
      const body = route.request().postDataJSON() as { status: ContractResponse["status"] };
      statusPatch = { id: contractId, status: body.status };
      contracts = contracts.map((contract) =>
        contract.id === contractId
          ? {
              ...contract,
              status: body.status,
              signedByEmployer: body.status === "PENDING" ? true : contract.signedByEmployer,
              updatedAt: "2026-06-29T12:00:00.000Z",
            }
          : contract,
      );
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(contracts.find((contract) => contract.id === contractId)),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(contracts.find((contract) => contract.id === contractId)),
    });
  });

  await page.goto("/contracts");

  await expect(page.getByRole("heading", { name: "Mes contrats" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("contract-card")).toHaveCount(3);
  await expect(page.getByText("Dossiers contractuels")).toBeVisible();
  await expect(
    page.getByTestId("contracts-list").getByRole("heading", {
      name: "Reparer les prises de cuisine",
    }),
  ).toBeVisible();
  await expect(page.getByText("Alex Pro").first()).toBeVisible();
  await expect(page.getByText("2/2 signatures").first()).toBeVisible();

  await page.getByTestId("contracts-filter-active").click();
  await expect(page.getByTestId("contract-card")).toHaveCount(1);
  await expect(
    page.getByTestId("contracts-list").getByRole("heading", {
      name: "Verification prises salon",
    }),
  ).toBeVisible();

  await page.getByTestId("contracts-filter-pending").click();
  await expect(page.getByTestId("contract-card")).toHaveCount(2);
  await expect(
    page.getByTestId("contracts-list").getByRole("heading", {
      name: "Reparer les prises de cuisine",
    }),
  ).toBeVisible();
  await expect(
    page.getByTestId("contracts-list").getByRole("heading", {
      name: "Installer deux luminaires",
    }),
  ).toBeVisible();

  await page.getByTestId("contracts-filter-closed").click();
  await expect(page.getByText("Rien dans ce filtre")).toBeVisible();

  await page.getByTestId("contracts-filter-all").click();
  const draftCard = page
    .getByTestId("contract-card")
    .filter({ hasText: "Reparer les prises de cuisine" });
  await draftCard.getByRole("link", { name: /Envoyer au pro/ }).click();
  await page.waitForURL(/\/contracts\/contract_e2e_draft$/, { timeout: 15_000 });

  await expect(
    page.getByRole("heading", { name: "Reparer les prises de cuisine" }),
  ).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Signatures du contrat")).toBeVisible();
  await expect(page.getByText("Details operationnels")).toBeVisible();
  await expect(page.getByRole("button", { name: /Envoyer au pro/ })).toBeVisible();
  const detailPage = page.getByTestId("contract-detail-page");
  await expect(detailPage.getByRole("link", { name: /Message/ })).toHaveAttribute(
    "href",
    "/messages/mission_e2e_cuisine",
  );
  await expect(detailPage.getByRole("link", { name: /Mission/ })).toHaveAttribute(
    "href",
    "/missions/mission_e2e_cuisine",
  );

  await auditA11y(page, "/contracts/[id]", ["color-contrast"]);

  await page.getByRole("button", { name: /Envoyer au pro/ }).click();
  await expect(page.getByText("Statut du contrat mis a jour")).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText("Le contrat a ete envoye")).toBeVisible();
  expect(statusPatch).toEqual({ id: "contract_e2e_draft", status: "PENDING" });

  expect(consoleErrors).toEqual([]);
});
