"use client";

import React from "react";
import { ReviewProvider } from "@/context/review-context";
import { QuestionGroup, Taxonomy } from "@/types";

interface AppProvidersProps {
  children: React.ReactNode;
  initialGroups: QuestionGroup[];
  taxonomy: Taxonomy;
}

export function AppProviders({
  children,
  initialGroups,
  taxonomy,
}: AppProvidersProps) {
  return (
    <ReviewProvider initialGroups={initialGroups} taxonomy={taxonomy}>
      {children}
    </ReviewProvider>
  );
}
