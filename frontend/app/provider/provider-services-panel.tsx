"use client";

import { useAuth } from "@clerk/nextjs";
import { AlertCircle, Plus } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiFetch, extractApiErrorMessage } from "@/lib/api";
import { useTranslations } from "@/lib/i18n/locale-provider";
import type { ServiceListingRead } from "@/lib/types";

export function ProviderServicesPanel({ initialServices }: { initialServices: ServiceListingRead[] }) {
  const { t } = useTranslations();
  const { getToken } = useAuth();

  const [services, setServices] = useState(initialServices);
  const [showForm, setShowForm] = useState(false);

  async function withAuth<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    return apiFetch<T>(path, { ...init, token });
  }

  async function toggleStatus(service: ServiceListingRead) {
    const nextStatus = service.status === "active" ? "inactive" : "active";
    const updated = await withAuth<ServiceListingRead>(`/provider/services/${service.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-heading text-foreground">{t("providerServices.yourServices")}</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t("providerServices.postNew")}
        </Button>
      </div>

      {showForm && (
        <PostServiceForm
          withAuth={withAuth}
          onCreated={(created) => {
            setServices((prev) => [created, ...prev]);
            setShowForm(false);
          }}
        />
      )}

      {services.length === 0 && !showForm ? (
        <p className="text-small text-muted-foreground">{t("providerServices.noServices")}</p>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onToggleStatus={toggleStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function PostServiceForm({
  withAuth,
  onCreated,
}: {
  withAuth: <T>(path: string, init?: RequestInit) => Promise<T>;
  onCreated: (service: ServiceListingRead) => void;
}) {
  const { t } = useTranslations();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const created = await withAuth<ServiceListingRead>("/provider/services", {
        method: "POST",
        body: JSON.stringify({ title, category, description }),
      });
      onCreated(created);
    } catch (e) {
      setError(e instanceof Error ? extractApiErrorMessage(e.message) : t("providerServices.form.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="animate-fade-in">
      <CardContent className="space-y-4 pt-6">
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden="true" />
            <p className="text-small text-foreground">{error}</p>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="svc-title">{t("providerServices.form.titleLabel")}</Label>
          <Input
            id="svc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("providerServices.form.titlePlaceholder")}
            disabled={submitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-category">{t("providerServices.form.categoryLabel")}</Label>
          <Input
            id="svc-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={t("providerServices.form.categoryPlaceholder")}
            disabled={submitting}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-description">{t("providerServices.form.descriptionLabel")}</Label>
          <Textarea
            id="svc-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("providerServices.form.descriptionPlaceholder")}
            disabled={submitting}
          />
        </div>
        <Button onClick={handleSubmit} disabled={submitting || !title.trim()} isLoading={submitting}>
          {t("providerServices.form.submit")}
        </Button>
      </CardContent>
    </Card>
  );
}

function ServiceCard({
  service,
  onToggleStatus,
}: {
  service: ServiceListingRead;
  onToggleStatus: (service: ServiceListingRead) => void;
}) {
  const { t } = useTranslations();
  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-body">{service.title}</CardTitle>
          {service.category && <p className="mt-1 text-caption text-muted-foreground">{service.category}</p>}
        </div>
        <Badge variant={service.status === "active" ? "success" : "outline"}>
          {service.status === "active" ? t("providerServices.statusActive") : t("providerServices.statusInactive")}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {service.description && <p className="text-small text-foreground">{service.description}</p>}
        <Button variant="outline" size="sm" onClick={() => onToggleStatus(service)}>
          {service.status === "active" ? t("providerServices.deactivate") : t("providerServices.activate")}
        </Button>
      </CardContent>
    </Card>
  );
}
