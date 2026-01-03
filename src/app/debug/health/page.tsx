"use client";

import { useEffect, useState } from "react";

type HealthStatus = {
  status: "loading" | "success" | "error";
  message: string;
  details?: {
    backendStatus?: string;
    timestamp?: string;
    statusCode?: number;
  };
};

export default function HealthCheckPage() {
  const [health, setHealth] = useState<HealthStatus>({
    status: "loading",
    message: "Vérification de la connexion au backend...",
  });

  useEffect(() => {
    const checkHealth = async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      
      if (!apiUrl) {
        setHealth({
          status: "error",
          message: "NEXT_PUBLIC_API_URL n'est pas défini",
        });
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/health`, {
          method: "GET",
          cache: "no-store",
        });

        if (response.ok) {
          const data = await response.json();
          setHealth({
            status: "success",
            message: "Backend OK",
            details: {
              backendStatus: data.status || "ok",
              timestamp: data.timestamp || new Date().toISOString(),
              statusCode: response.status,
            },
          });
        } else {
          const errorText = await response.text().catch(() => "No response body");
          setHealth({
            status: "error",
            message: `Backend Error (${response.status})`,
            details: {
              statusCode: response.status,
            },
          });
        }
      } catch (error) {
        setHealth({
          status: "error",
          message:
            error instanceof Error
              ? `Erreur de connexion: ${error.message}`
              : "Impossible de contacter le backend",
        });
      }
    };

    checkHealth();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 p-4">
      <div className="w-full max-w-2xl rounded-lg border border-neutral-800 bg-neutral-900/50 p-8 shadow-xl backdrop-blur">
        <h1 className="mb-6 text-3xl font-bold text-white">
          🔍 Health Check
        </h1>

        <div className="space-y-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-4">
            <div
              className={`h-4 w-4 rounded-full ${
                health.status === "loading"
                  ? "animate-pulse bg-yellow-500"
                  : health.status === "success"
                    ? "bg-green-500"
                    : "bg-red-500"
              }`}
            />
            <span className="text-xl font-semibold text-white">
              {health.message}
            </span>
          </div>

          {/* Environment Info */}
          <div className="mt-6 rounded border border-neutral-700 bg-neutral-800/50 p-4">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">
              Configuration
            </h2>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-400">Frontend URL:</span>
                <span className="text-white">http://localhost:3000</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Backend API URL:</span>
                <span className="text-white">
                  {process.env.NEXT_PUBLIC_API_URL || "Not set"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Health Endpoint:</span>
                <span className="text-white">
                  {process.env.NEXT_PUBLIC_API_URL}/health
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          {health.details && (
            <div className="mt-6 rounded border border-neutral-700 bg-neutral-800/50 p-4">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-400">
                Détails
              </h2>
              <div className="space-y-2 font-mono text-sm">
                {health.details.statusCode && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">HTTP Status:</span>
                    <span
                      className={
                        health.details.statusCode === 200
                          ? "text-green-400"
                          : "text-red-400"
                      }
                    >
                      {health.details.statusCode}
                    </span>
                  </div>
                )}
                {health.details.backendStatus && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Backend Status:</span>
                    <span className="text-white">
                      {health.details.backendStatus}
                    </span>
                  </div>
                )}
                {health.details.timestamp && (
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Timestamp:</span>
                    <span className="text-white">
                      {new Date(health.details.timestamp).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
            >
              🔄 Retest
            </button>
            <a
              href="/dashboard"
              className="rounded bg-neutral-700 px-4 py-2 font-semibold text-white transition hover:bg-neutral-600"
            >
              ← Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

