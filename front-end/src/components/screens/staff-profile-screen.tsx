"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { useAcademy } from "@/lib/store";

export function StaffProfileScreen({ id }: { id: string }) {
  const data = useAcademy();
  const person = data.staff.find((item) => item.id === id);
  if (!person) return null;

  const facts = [
    ["Contact", person.contact],
    ["Email", person.email],
    ["Gender", person.gender || "—"],
    ["Blood group", person.bloodGroup || "—"],
    ["Address", person.address || "—"],
    ["Qualifications", person.qualifications.join(", ") || "—"],
    ["Joined", person.joinedOn ? formatDate(person.joinedOn) : "—"],
    ["Relieved", person.relievedOn ? formatDate(person.relievedOn) : "—"],
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label} className={label === "Address" || label === "Qualifications" ? "sm:col-span-2" : undefined}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
