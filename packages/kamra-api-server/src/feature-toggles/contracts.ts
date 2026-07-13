export const featureFlagDefinitions = {
  allowAutoTickingAllShoppingListEntries: {
    admin: {
      control: "boolean",
      descriptionKey: "health.featureFlagAutoTickAllShoppingListEntriesDescription",
      group: "shopping",
      labelKey: "health.featureFlagAutoTickAllShoppingListEntries"
    },
    defaultValue: true,
    failureValue: true,
    owner: "household",
    removalCondition: "Remove when shopping-list stock application is stable in Alpha.",
    scope: "global"
  },
  allowControlledAlphaAccess: {
    admin: {
      control: "alpha-access",
      descriptionKey: "health.featureFlagControlledAlphaAccessDescription",
      group: "access",
      labelKey: "health.featureFlagControlledAlphaAccess"
    },
    defaultValue: false,
    failureValue: false,
    owner: "access",
    removalCondition: "Remove when controlled alpha access is no longer operationally needed.",
    scope: "global"
  },
  useAbbreviatedUiLabels: {
    admin: {
      control: "boolean",
      descriptionKey: "health.featureFlagAbbreviatedUiLabelsDescription",
      group: "household",
      labelKey: "health.featureFlagAbbreviatedUiLabels"
    },
    defaultValue: false,
    failureValue: false,
    owner: "household",
    removalCondition: "Reassess after the compact household stock table is stable in Alpha.",
    scope: "global"
  }
} as const;

export type FeatureFlagKey = keyof typeof featureFlagDefinitions;
export type FeatureFlagDefinition = (typeof featureFlagDefinitions)[FeatureFlagKey];
export const featureFlagKeys = Object.keys(featureFlagDefinitions) as FeatureFlagKey[];
export type FeatureFlagControl = FeatureFlagDefinition["admin"]["control"];
export type FeatureFlagAdminGroup = FeatureFlagDefinition["admin"]["group"];

export interface FeatureFlagAdminListItem {
  control: FeatureFlagControl;
  descriptionKey: string;
  enabled: boolean;
  group: FeatureFlagAdminGroup;
  key: FeatureFlagKey;
  labelKey: string;
}

export function toFeatureFlagAdminListItem(
  key: FeatureFlagKey,
  enabled: boolean
): FeatureFlagAdminListItem {
  const { admin } = featureFlagDefinitions[key];
  return {
    control: admin.control,
    descriptionKey: admin.descriptionKey,
    enabled,
    group: admin.group,
    key,
    labelKey: admin.labelKey
  };
}

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
  write(input: {
    expectedRevision?: number;
    key: FeatureFlagKey;
    updatedAt: string;
    updatedByUserId: string;
    enabled: boolean;
  }): Promise<FeatureFlagRecord>;
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

export type FeatureFlagErrorCode =
  "feature_flag_revision_conflict" | "feature_flag_storage_failure";
