export type NamedMachine = {
  name: string;
};

export type TrainingCertificateLike = {
  machine_name: string | null;
  expires_at?: string | null;
  completed_at?: string | null;
};

type TrainingMachineRule = {
  trainingName: string;
  exactMachineNames?: string[];
  containsAny?: string[];
};

const TRAINING_MACHINE_RULES: TrainingMachineRule[] = [
  { trainingName: "Laser Cutter", exactMachineNames: ["Laser Cutter"] },
  { trainingName: "Milling Machine", exactMachineNames: ["Milling Machine"] },
  {
    trainingName: "3D Printer",
    exactMachineNames: ["Ultimaker 3D printer"],
    containsAny: ["bambu"],
  },
  { trainingName: "UltiMaker", exactMachineNames: ["UltiMaker"] },
  { trainingName: "Heat Press", exactMachineNames: ["Heat Press"] },
  { trainingName: "Vinyl Cutter", exactMachineNames: ["Vinyl Cutter"] },
  {
    trainingName: "Soldering Station",
    exactMachineNames: ["Soldering Station", "Soldering Board"],
  },
];

export function canonicalMachineName(name: string): string {
  return name
    .trim()
    .replace(/\s*\(\d+\)\s*$/i, "")
    .replace(/\s*[-_#]?\s*\d+\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  const deduped: string[] = [];

  for (const name of names) {
    const trimmed = name.trim();
    if (!trimmed) continue;

    const canonical = canonicalMachineName(trimmed);
    if (seen.has(canonical)) continue;

    seen.add(canonical);
    deduped.push(trimmed);
  }

  return deduped;
}

function getTrainingRule(trainingName: string): TrainingMachineRule | null {
  const canonicalTrainingName = canonicalMachineName(trainingName);
  return (
    TRAINING_MACHINE_RULES.find(
      (rule) => canonicalMachineName(rule.trainingName) === canonicalTrainingName,
    ) ?? null
  );
}

export function getActualMachineNamesForTraining(
  trainingName: string,
  machines: NamedMachine[] = [],
): string[] {
  const rule = getTrainingRule(trainingName);
  if (!rule) {
    return uniqueNames([trainingName]);
  }

  const exactCanonicals = new Set(
    (rule.exactMachineNames ?? []).map((name) => canonicalMachineName(name)),
  );
  const containsAny = (rule.containsAny ?? []).map((value) => value.toLowerCase());

  const matchedMachineNames = machines
    .map((machine) => machine.name?.trim())
    .filter((name): name is string => Boolean(name))
    .filter((name) => {
      const canonical = canonicalMachineName(name);
      if (exactCanonicals.has(canonical)) return true;
      return containsAny.some((value) => canonical.includes(value));
    });

  if (matchedMachineNames.length > 0) {
    return uniqueNames(matchedMachineNames);
  }

  if (rule.exactMachineNames?.length) {
    return uniqueNames(rule.exactMachineNames);
  }

  return uniqueNames([trainingName]);
}

export function getTrainingMachineNameForCertificate(machineName: string): string {
  const canonical = canonicalMachineName(machineName);

  for (const rule of TRAINING_MACHINE_RULES) {
    if (canonical === canonicalMachineName(rule.trainingName)) {
      return rule.trainingName;
    }

    const exactMatch = (rule.exactMachineNames ?? []).some(
      (name) => canonicalMachineName(name) === canonical,
    );
    if (exactMatch) {
      return rule.trainingName;
    }

    const containsMatch = (rule.containsAny ?? []).some((value) =>
      canonical.includes(value.toLowerCase()),
    );
    if (containsMatch) {
      return rule.trainingName;
    }
  }

  return machineName.trim() || "Training";
}

function certificateMatchesTraining(
  certificateMachineName: string,
  trainingName: string,
  machines: NamedMachine[] = [],
): boolean {
  const trainingCanonical = canonicalMachineName(trainingName);
  const certificateCanonical = canonicalMachineName(certificateMachineName);

  if (certificateCanonical === trainingCanonical) {
    return true;
  }

  const actualMachineNames = getActualMachineNamesForTraining(trainingName, machines);
  return actualMachineNames.some(
    (name) => canonicalMachineName(name) === certificateCanonical,
  );
}

export function getTrainingCleanupMachineNames(
  trainingName: string,
  machines: NamedMachine[] = [],
): string[] {
  return uniqueNames([trainingName, ...getActualMachineNamesForTraining(trainingName, machines)]);
}

export function hasTrainingCertificate(
  trainingName: string,
  certificates: TrainingCertificateLike[],
  options?: {
    machines?: NamedMachine[];
    requireUnexpired?: boolean;
  },
): boolean {
  const relevantCertificates = certificates.filter((certificate) => {
    if (!certificate.machine_name) return false;
    if (!certificateMatchesTraining(certificate.machine_name, trainingName, options?.machines)) {
      return false;
    }

    if (!options?.requireUnexpired || !certificate.expires_at) {
      return true;
    }

    return new Date(certificate.expires_at) >= new Date();
  });

  if (relevantCertificates.length === 0) {
    return false;
  }

  const hasLegacyTrainingCertificate = relevantCertificates.some(
    (certificate) =>
      canonicalMachineName(certificate.machine_name ?? "") ===
      canonicalMachineName(trainingName),
  );

  if (hasLegacyTrainingCertificate) {
    return true;
  }

  const actualMachineNames = getActualMachineNamesForTraining(
    trainingName,
    options?.machines,
  );

  return actualMachineNames.every((machineName) =>
    relevantCertificates.some(
      (certificate) =>
        canonicalMachineName(certificate.machine_name ?? "") ===
        canonicalMachineName(machineName),
    ),
  );
}

export function hasMachineCertificate(
  machineName: string,
  certificates: TrainingCertificateLike[],
): boolean {
  const relevantCertificates = certificates.filter((certificate) => {
    if (!certificate.machine_name) return false;
    if (certificate.expires_at && new Date(certificate.expires_at) < new Date()) {
      return false;
    }
    return true;
  });

  const machineCanonical = canonicalMachineName(machineName);
  if (
    relevantCertificates.some(
      (certificate) =>
        canonicalMachineName(certificate.machine_name ?? "") === machineCanonical,
    )
  ) {
    return true;
  }

  return relevantCertificates.some((certificate) => {
    const certificateTrainingName = getTrainingMachineNameForCertificate(
      certificate.machine_name ?? "",
    );
    const actualMachineNames = getActualMachineNamesForTraining(certificateTrainingName, [
      { name: machineName },
    ]);

    return actualMachineNames.some(
      (actualMachineName) => canonicalMachineName(actualMachineName) === machineCanonical,
    );
  });
}

export function getRepresentativeCertificateForTraining(
  trainingName: string,
  certificates: TrainingCertificateLike[],
  machines: NamedMachine[] = [],
): TrainingCertificateLike | null {
  const relevantCertificates = certificates
    .filter((certificate) => {
      if (!certificate.machine_name) return false;
      return certificateMatchesTraining(certificate.machine_name, trainingName, machines);
    })
    .sort((left, right) => {
      const leftTime = left.completed_at ? new Date(left.completed_at).getTime() : 0;
      const rightTime = right.completed_at ? new Date(right.completed_at).getTime() : 0;
      return rightTime - leftTime;
    });

  return relevantCertificates[0] ?? null;
}
