export const featureFlagDefinitions = {
  allowAutoTickingAllShoppingListEntries: {
    defaultValue: true,
    failureValue: true,
    owner: "household",
    removalCondition: "Remove when shopping-list stock application is stable in Alpha.",
    scope: "global"
  },
  allowControlledAlphaAccess: {
    defaultValue: false,
    failureValue: false,
    owner: "access",
    removalCondition: "Remove when controlled alpha access is no longer operationally needed.",
    scope: "global"
  },
  useAbbreviatedUiLabels: {
    defaultValue: false,
    failureValue: false,
    owner: "household",
    removalCondition: "Reassess after the compact household stock table is stable in Alpha.",
    scope: "global"
  }
} as const;

export type FeatureFlagKey = keyof typeof featureFlagDefinitions;
export type FeatureFlagDefinition = (typeof featureFlagDefinitions)[FeatureFlagKey];

export interface FeatureFlagRecord {
  enabled: boolean;
  key: FeatureFlagKey;
  revision: number;
  updatedAt: string;
  updatedByUserId: string;
}

export interface FeatureFlagChangeAudit {
  changedAt: string;
  changedByUserId: string;
  id: string;
  key: FeatureFlagKey;
  newValue: boolean;
  oldValue: boolean;
  reason: string;
  revision: number;
}

export interface FeatureFlagStore {
  appendAudit(audit: FeatureFlagChangeAudit): Promise<void>;
  read(key: FeatureFlagKey): Promise<FeatureFlagRecord | null>;
  write(input: { expectedRevision?: number; key: FeatureFlagKey; updatedAt: string; updatedByUserId: string; enabled: boolean }): Promise<FeatureFlagRecord>;
}

export interface FeatureFlagEvaluationContext {
  householdId?: string;
  role?: string;
  userId?: string;
}

export interface FeatureFlagEvaluation {
  enabled: boolean;
  key: FeatureFlagKey;
  source: "stored" | "default" | "failure";
}

export type FeatureFlagErrorCode = "feature_flag_revision_conflict" | "feature_flag_storage_failure";
