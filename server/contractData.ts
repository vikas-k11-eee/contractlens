export type ContractStatus = "active" | "review" | "expiring" | "archived";
export type RiskLevel = "low" | "medium" | "high";
export type Priority = "low" | "medium" | "high";
export type ObligationStatus =
  | "upcoming"
  | "due_soon"
  | "due"
  | "completed"
  | "overdue";

export type SourceRef = {
  file: string;
  page: number;
  section: string;
  excerpt: string;
};

export type Party = {
  name: string;
  type: string;
  role: string;
};

export type Clause = {
  id: string;
  number: string;
  title: string;
  category: string;
  page: number;
  text: string;
  confidence: number;
};

export type Obligation = {
  id: string;
  contractId: string;
  obligation: string;
  responsibleParty: string;
  beneficiary: string;
  dueDate: string;
  frequency: string;
  priority: Priority;
  status: ObligationStatus;
  source: SourceRef;
};

export type ReviewFlag = {
  id: string;
  title: string;
  reason: string;
  severity: "review" | "critical" | "info";
  source: SourceRef;
};

export type Contract = {
  id: string;
  name: string;
  type: string;
  status: ContractStatus;
  risk: RiskLevel;
  parties: Party[];
  effectiveDate: string;
  expirationDate: string;
  renewalDate: string;
  noticeDeadline: string;
  owner: string;
  lastUpdated: string;
  amount: string;
  paymentTerms: string;
  renewalTerms: string;
  terminationTerms: string;
  governingLaw: string;
  summary: string;
  document: string;
  pageCount: number;
  clauses: Clause[];
  obligations: Obligation[];
  reviewFlags: ReviewFlag[];
};

export type Alert = {
  id: string;
  type: string;
  contractId: string;
  contractName: string;
  message: string;
  deadline: string;
  priority: Priority;
  status: "open" | "acknowledged" | "resolved";
  createdAt: string;
};

const source = (page: number, section: string, excerpt: string): SourceRef => ({
  file: "Cloud_Services_Agreement.pdf",
  page,
  section,
  excerpt,
});

const cloudClauses: Clause[] = [
  {
    id: "cl-1",
    number: "2.1",
    title: "Services",
    category: "Service scope",
    page: 3,
    confidence: 0.98,
    text: "Provider will make the hosted platform available to Customer and maintain the technical environment described in the Order Form.",
  },
  {
    id: "cl-2",
    number: "4.2",
    title: "Fees and payment",
    category: "Financial",
    page: 7,
    confidence: 0.99,
    text: "Customer will pay undisputed invoices within thirty (30) days of the invoice date. Overdue amounts accrue interest at 1.0% per month.",
  },
  {
    id: "cl-3",
    number: "6.1",
    title: "Service levels",
    category: "SLA",
    page: 10,
    confidence: 0.96,
    text: "Provider will maintain 99.5% monthly uptime, excluding scheduled maintenance notified at least 48 hours in advance.",
  },
  {
    id: "cl-4",
    number: "8.2",
    title: "Termination",
    category: "Termination",
    page: 12,
    confidence: 0.97,
    text: "Either party may terminate this Agreement for material breach if the breach remains uncured for thirty (30) days after written notice.",
  },
  {
    id: "cl-5",
    number: "9.1",
    title: "Renewal",
    category: "Renewal",
    page: 13,
    confidence: 0.95,
    text: "The initial term renews automatically for successive one-year periods unless either party gives written notice of non-renewal at least sixty (60) days before the then-current term expires.",
  },
  {
    id: "cl-6",
    number: "11.3",
    title: "Data protection",
    category: "Privacy",
    page: 16,
    confidence: 0.91,
    text: "The parties will comply with the Data Processing Addendum and applicable data protection laws in connection with Customer Data.",
  },
];

const cloudContract: Contract = {
  id: "cld-001",
  name: "Cloud Services Agreement",
  type: "Master services agreement",
  status: "active",
  risk: "medium",
  parties: [
    { name: "Northstar Analytics, Inc.", type: "Customer", role: "Customer" },
    {
      name: "Vertex Cloud Systems Ltd.",
      type: "Provider",
      role: "Service provider",
    },
  ],
  effectiveDate: "2025-10-01",
  expirationDate: "2026-10-01",
  renewalDate: "2026-10-01",
  noticeDeadline: "2026-08-02",
  owner: "Maya Chen",
  lastUpdated: "2026-09-18",
  amount: "$12,500 / month",
  paymentTerms:
    "Net 30 days from invoice date; 1.0% monthly interest on overdue undisputed amounts.",
  renewalTerms:
    "Automatic one-year renewal unless either party gives 60 days written notice.",
  terminationTerms:
    "Material breach termination after a 30-day cure period; written notice required.",
  governingLaw: "State of New York, United States",
  summary:
    "Vertex provides a hosted analytics platform with a 99.5% monthly uptime commitment. Northstar pays a monthly subscription on net-30 terms. The agreement auto-renews annually and has a 60-day non-renewal notice deadline.",
  document: "Cloud_Services_Agreement.pdf",
  pageCount: 22,
  clauses: cloudClauses,
  obligations: [
    {
      id: "ob-1",
      contractId: "cld-001",
      obligation: "Pay undisputed invoices within 30 days of invoice date.",
      responsibleParty: "Northstar Analytics",
      beneficiary: "Vertex Cloud Systems",
      dueDate: "2026-09-24",
      frequency: "Monthly",
      priority: "high",
      status: "due_soon",
      source: source(
        7,
        "Fees and payment",
        "Customer will pay undisputed invoices within thirty (30) days of the invoice date."
      ),
    },
    {
      id: "ob-2",
      contractId: "cld-001",
      obligation:
        "Maintain 99.5% monthly platform uptime, excluding notified maintenance.",
      responsibleParty: "Vertex Cloud Systems",
      beneficiary: "Northstar Analytics",
      dueDate: "2026-09-30",
      frequency: "Monthly",
      priority: "high",
      status: "upcoming",
      source: source(
        10,
        "Service levels",
        "Provider will maintain 99.5% monthly uptime."
      ),
    },
    {
      id: "ob-3",
      contractId: "cld-001",
      obligation:
        "Provide monthly service performance report by the fifth business day.",
      responsibleParty: "Vertex Cloud Systems",
      beneficiary: "Northstar Analytics",
      dueDate: "2026-10-07",
      frequency: "Monthly",
      priority: "medium",
      status: "upcoming",
      source: source(
        10,
        "Service levels",
        "Provider will make service performance information available to Customer upon request."
      ),
    },
    {
      id: "ob-4",
      contractId: "cld-001",
      obligation:
        "Give written notice of non-renewal at least 60 days before expiration.",
      responsibleParty: "Either party",
      beneficiary: "The other party",
      dueDate: "2026-08-02",
      frequency: "At renewal",
      priority: "high",
      status: "completed",
      source: source(
        13,
        "Renewal",
        "Either party gives written notice of non-renewal at least sixty (60) days before the then-current term expires."
      ),
    },
  ],
  reviewFlags: [
    {
      id: "rf-1",
      title: "Renewal window is approaching",
      reason:
        "The 60-day notice deadline has passed in the current demo timeline; confirm whether notice was sent and capture the business decision.",
      severity: "critical",
      source: source(
        13,
        "Renewal",
        "Either party gives written notice of non-renewal at least sixty (60) days before the then-current term expires."
      ),
    },
    {
      id: "rf-2",
      title: "SLA remedy is not explicit",
      reason:
        "The agreement states a 99.5% uptime commitment but does not clearly surface service credit mechanics in the extracted text.",
      severity: "review",
      source: source(
        10,
        "Service levels",
        "Provider will maintain 99.5% monthly uptime, excluding scheduled maintenance."
      ),
    },
  ],
};

function cloneContractForDemo(
  id: string,
  overrides: Partial<Contract> = {}
): Contract {
  return {
    ...cloudContract,
    ...overrides,
    id,
    clauses: cloudContract.clauses.map((clause, index) => ({
      ...clause,
      id: `${id}-clause-${index + 1}`,
    })),
    obligations: cloudContract.obligations.map((obligation, index) => ({
      ...obligation,
      id: `${id}-obligation-${index + 1}`,
      contractId: id,
    })),
    reviewFlags: cloudContract.reviewFlags.map((flag, index) => ({
      ...flag,
      id: `${id}-review-${index + 1}`,
    })),
  };
}

const sampleContracts: Contract[] = [
  cloudContract,
  {
    ...cloudContract,
    id: "sft-002",
    name: "Software Vendor Agreement",
    type: "Software license",
    status: "review",
    risk: "high",
    parties: [
      { name: "Northstar Analytics, Inc.", type: "Customer", role: "Licensee" },
      { name: "Nimbus Workbench, Inc.", type: "Vendor", role: "Licensor" },
    ],
    effectiveDate: "2026-01-15",
    expirationDate: "2027-01-15",
    renewalDate: "2027-01-15",
    noticeDeadline: "2026-11-16",
    owner: "Jordan Lee",
    lastUpdated: "2026-09-12",
    amount: "$48,000 / year",
    paymentTerms: "Annual fee due within 45 days of invoice date.",
    renewalTerms:
      "Renews annually with 60 days notice; pricing may increase by CPI + 3%.",
    terminationTerms:
      "Termination for convenience on 90 days notice after the first six months.",
    summary:
      "Nimbus provides enterprise workflow software under an annual license. The agreement is flagged for review because of a CPI + 3% price adjustment and a broad termination assistance obligation.",
    document: "Software_Vendor_Agreement_v3.docx",
    pageCount: 18,
    clauses: [
      {
        id: "sft-cl-1",
        number: "3.4",
        title: "Fees",
        category: "Financial",
        page: 5,
        confidence: 0.98,
        text: "Annual subscription fees are due within forty-five (45) days after invoice date.",
      },
      {
        id: "sft-cl-2",
        number: "5.3",
        title: "Price adjustment",
        category: "Financial",
        page: 7,
        confidence: 0.92,
        text: "At renewal, fees may increase by the percentage change in CPI plus three percent (3%).",
      },
      {
        id: "sft-cl-3",
        number: "12.2",
        title: "Termination assistance",
        category: "Termination",
        page: 14,
        confidence: 0.87,
        text: "Vendor will provide reasonable transition support for a period to be agreed by the parties.",
      },
    ],
    obligations: [
      {
        id: "ob-5",
        contractId: "sft-002",
        obligation: "Pay annual subscription fee within 45 days.",
        responsibleParty: "Northstar Analytics",
        beneficiary: "Nimbus Workbench",
        dueDate: "2026-10-21",
        frequency: "Annual",
        priority: "high",
        status: "upcoming",
        source: source(
          5,
          "Fees",
          "Annual subscription fees are due within forty-five (45) days after invoice date."
        ),
      },
      {
        id: "ob-6",
        contractId: "sft-002",
        obligation: "Provide reasonable transition support after termination.",
        responsibleParty: "Nimbus Workbench",
        beneficiary: "Northstar Analytics",
        dueDate: "2027-01-15",
        frequency: "On termination",
        priority: "medium",
        status: "upcoming",
        source: source(
          14,
          "Termination assistance",
          "Vendor will provide reasonable transition support for a period to be agreed by the parties."
        ),
      },
    ],
    reviewFlags: [
      {
        id: "rf-3",
        title: "Broad price adjustment",
        reason:
          "Renewal pricing combines CPI with an additional 3% increase; confirm commercial approval.",
        severity: "review",
        source: source(
          7,
          "Price adjustment",
          "Fees may increase by CPI plus three percent."
        ),
      },
    ],
  },
  cloneContractForDemo("it-003", {
    name: "IT Maintenance Contract",
    type: "Support agreement",
    status: "expiring",
    risk: "medium",
    owner: "Priya Shah",
    expirationDate: "2026-10-14",
    renewalDate: "2026-10-14",
    noticeDeadline: "2026-09-14",
    amount: "$6,200 / month",
    lastUpdated: "2026-09-17",
    document: "IT_Maintenance_Contract.pdf",
    summary:
      "Managed infrastructure support with 24/7 incident response and a renewal decision required this month.",
  }),
  cloneContractForDemo("lgs-004", {
    name: "Logistics Services Agreement",
    type: "Logistics services",
    status: "active",
    risk: "low",
    owner: "Maya Chen",
    expirationDate: "2027-04-30",
    renewalDate: "2027-04-30",
    noticeDeadline: "2027-01-30",
    amount: "$18,900 / month",
    lastUpdated: "2026-09-15",
    document: "Logistics_Services_Agreement.docx",
    summary:
      "Regional logistics partner agreement with delivery SLAs and monthly reconciliation.",
  }),
  cloneContractForDemo("ent-005", {
    name: "Enterprise SaaS Agreement",
    type: "SaaS agreement",
    status: "archived",
    risk: "low",
    owner: "Jordan Lee",
    expirationDate: "2025-12-31",
    renewalDate: "2025-12-31",
    noticeDeadline: "2025-10-02",
    amount: "$32,000 / year",
    lastUpdated: "2026-08-22",
    document: "Enterprise_SaaS_Agreement.pdf",
    summary:
      "Archived enterprise SaaS agreement retained for historical reference and audit support.",
  }),
];

export const demoContracts = sampleContracts;

export const demoAlerts: Alert[] = [
  {
    id: "al-1",
    type: "Renewal deadline",
    contractId: "cld-001",
    contractName: "Cloud Services Agreement",
    message:
      "Renewal notice deadline was 48 days ago. Confirm whether notice was sent.",
    deadline: "2026-08-02",
    priority: "high",
    status: "open",
    createdAt: "2026-09-18",
  },
  {
    id: "al-2",
    type: "Payment obligation",
    contractId: "cld-001",
    contractName: "Cloud Services Agreement",
    message: "Monthly payment obligation is due in 5 days.",
    deadline: "2026-09-24",
    priority: "high",
    status: "open",
    createdAt: "2026-09-19",
  },
  {
    id: "al-3",
    type: "Contract expiry",
    contractId: "it-003",
    contractName: "IT Maintenance Contract",
    message: "Contract expires in 25 days. Renewal review recommended.",
    deadline: "2026-10-14",
    priority: "medium",
    status: "acknowledged",
    createdAt: "2026-09-17",
  },
  {
    id: "al-4",
    type: "Compliance report",
    contractId: "lgs-004",
    contractName: "Logistics Services Agreement",
    message: "Monthly vendor compliance report is due in 11 days.",
    deadline: "2026-09-30",
    priority: "medium",
    status: "open",
    createdAt: "2026-09-19",
  },
];

export function getContract(id: string) {
  return demoContracts.find(contract => contract.id === id) ?? cloudContract;
}

export function getAllObligations() {
  return demoContracts.flatMap(contract => contract.obligations);
}

export function getDashboard() {
  const obligations = getAllObligations();
  return {
    metrics: {
      totalContracts: demoContracts.length,
      activeContracts: demoContracts.filter(c => c.status === "active").length,
      upcomingRenewals: demoContracts.filter(
        c => c.status === "expiring" || c.status === "active"
      ).length,
      obligationsDueSoon: obligations.filter(
        o => o.status === "due_soon" || o.status === "due"
      ).length,
      reviewRequired: demoContracts.reduce(
        (count, contract) => count + contract.reviewFlags.length,
        0
      ),
      updatedThisWeek: demoContracts.filter(c => c.lastUpdated >= "2026-09-12")
        .length,
    },
    upcomingObligations: obligations
      .filter(o => o.status !== "completed")
      .slice(0, 5)
      .map(obligation => ({
        ...obligation,
        contractName: getContract(obligation.contractId).name,
      })),
    renewals: demoContracts
      .filter(c => c.status !== "archived")
      .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate))
      .slice(0, 4),
    alerts: demoAlerts.filter(alert => alert.status !== "resolved"),
  };
}

export function answerQuestion(contractId: string, question: string) {
  const contract = getContract(contractId);
  const normalized = question.toLowerCase();
  if (normalized.includes("expire") || normalized.includes("expiration")) {
    return {
      answer: `The agreement expires on ${new Date(contract.expirationDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`,
      source: source(
        13,
        "Renewal",
        "The initial term renews automatically for successive one-year periods unless either party gives written notice of non-renewal at least sixty (60) days before the then-current term expires."
      ),
    };
  }
  if (normalized.includes("payment") || normalized.includes("invoice")) {
    return {
      answer: contract.paymentTerms,
      source:
        contract.obligations[0]?.source ??
        source(7, "Fees and payment", contract.paymentTerms),
    };
  }
  if (normalized.includes("termination") || normalized.includes("notice")) {
    return {
      answer: contract.terminationTerms,
      source: source(12, "Termination", contract.terminationTerms),
    };
  }
  if (normalized.includes("obligation") || normalized.includes("responsib")) {
    return {
      answer: `${contract.obligations.length} tracked obligations were extracted for this contract. The highest priority items include: ${contract.obligations
        .filter(o => o.priority === "high")
        .map(o => o.obligation)
        .join(" ")}`,
      source:
        contract.obligations[0]?.source ??
        source(
          1,
          "Obligations",
          "Structured obligation extraction is available in the contract workspace."
        ),
    };
  }
  return {
    answer:
      "I found related evidence in the uploaded document, but not enough to answer this confidently. Try asking about expiration, payment terms, termination notice, or party obligations.",
    source: source(
      1,
      "Document",
      "Insufficient evidence in the available contract."
    ),
  };
}

export function compareContracts(leftId: string, rightId: string) {
  const left = getContract(leftId);
  const right = getContract(rightId);
  return [
    {
      title: "Payment terms",
      category: "Financial",
      status: "modified",
      left: left.paymentTerms,
      right: right.paymentTerms,
      detail: "Net 30 days → Net 45 days",
    },
    {
      title: "Renewal pricing",
      category: "Renewal",
      status: "added",
      left: "Not found in document.",
      right:
        right.id === "sft-002"
          ? "CPI + 3% annual adjustment"
          : "Not found in document.",
      detail: "New pricing adjustment language",
    },
    {
      title: "Termination",
      category: "Termination",
      status: "modified",
      left: left.terminationTerms,
      right: right.terminationTerms,
      detail: "Cure period and notice language changed",
    },
    {
      title: "Service levels",
      category: "SLA",
      status: "unchanged",
      left: "99.5% monthly uptime",
      right: "99.5% monthly uptime",
      detail: "No material change detected",
    },
  ];
}

export type DashboardData = ReturnType<typeof getDashboard>;
export type CompareChange = ReturnType<typeof compareContracts>[number];
