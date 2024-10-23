// expenseCategories.ts

export interface SubCategory {
    id: string;
    name: string;
    code: string;
    description?: string;
}

export interface ExpenseCategory {
    id: string;
    name: string;
    code: string;
    description?: string;
    subcategories: SubCategory[];
}

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
    {
        id: "CAT001",
        name: "Office Supplies",
        code: "OFF_SUP",
        description: "General office supplies and materials",
        subcategories: [
            { id: "SUB001", name: "Stationery", code: "OFF_SUP_STAT" },
            { id: "SUB002", name: "Printer Supplies", code: "OFF_SUP_PRINT" },
            { id: "SUB003", name: "Office Equipment", code: "OFF_SUP_EQUIP" },
            { id: "SUB004", name: "Paper Products", code: "OFF_SUP_PAPER" },
            { id: "SUB005", name: "Filing Systems", code: "OFF_SUP_FILE" }
        ]
    },
    {
        id: "CAT002",
        name: "Travel & Transportation",
        code: "TRAV_TRANS",
        description: "Travel and transportation related expenses",
        subcategories: [
            { id: "SUB006", name: "Local Transport", code: "TRAV_LOCAL" },
            { id: "SUB007", name: "Air Travel", code: "TRAV_AIR" },
            { id: "SUB008", name: "Accommodation", code: "TRAV_ACCOM" },
            { id: "SUB009", name: "Fuel", code: "TRAV_FUEL" },
            { id: "SUB010", name: "Vehicle Maintenance", code: "TRAV_MAINT" }
        ]
    },
    {
        id: "CAT003",
        name: "Utilities & Services",
        code: "UTIL_SERV",
        description: "Utility bills and regular services",
        subcategories: [
            { id: "SUB011", name: "Electricity", code: "UTIL_ELEC" },
            { id: "SUB012", name: "Water", code: "UTIL_WATER" },
            { id: "SUB013", name: "Internet", code: "UTIL_NET" },
            { id: "SUB014", name: "Phone Services", code: "UTIL_PHONE" },
            { id: "SUB015", name: "Waste Management", code: "UTIL_WASTE" }
        ]
    },
    {
        id: "CAT004",
        name: "Professional Services",
        code: "PROF_SERV",
        description: "Professional and consultancy services",
        subcategories: [
            { id: "SUB016", name: "Legal Services", code: "PROF_LEGAL" },
            { id: "SUB017", name: "Accounting Services", code: "PROF_ACCT" },
            { id: "SUB018", name: "Consulting Fees", code: "PROF_CONS" },
            { id: "SUB019", name: "Training Services", code: "PROF_TRAIN" },
            { id: "SUB020", name: "IT Services", code: "PROF_IT" }
        ]
    },
    {
        id: "CAT005",
        name: "Marketing & Advertising",
        code: "MARK_ADV",
        description: "Marketing, advertising and promotional expenses",
        subcategories: [
            { id: "SUB021", name: "Online Advertising", code: "MARK_ONLINE" },
            { id: "SUB022", name: "Print Media", code: "MARK_PRINT" },
            { id: "SUB023", name: "Events & Sponsorships", code: "MARK_EVENT" },
            { id: "SUB024", name: "Marketing Materials", code: "MARK_MAT" },
            { id: "SUB025", name: "Social Media", code: "MARK_SOCIAL" }
        ]
    },
    {
        id: "CAT006",
        name: "Equipment & Maintenance",
        code: "EQUIP_MAINT",
        description: "Equipment purchases and maintenance",
        subcategories: [
            { id: "SUB026", name: "Office Equipment", code: "EQUIP_OFF" },
            { id: "SUB027", name: "IT Equipment", code: "EQUIP_IT" },
            { id: "SUB028", name: "Repairs", code: "EQUIP_REP" },
            { id: "SUB029", name: "Maintenance Contracts", code: "EQUIP_CONT" },
            { id: "SUB030", name: "Software Licenses", code: "EQUIP_SOFT" }
        ]
    },
    {
        id: "CAT007",
        name: "Employee Benefits",
        code: "EMP_BEN",
        description: "Employee-related benefits and welfare",
        subcategories: [
            { id: "SUB031", name: "Health Insurance", code: "EMP_HEALTH" },
            { id: "SUB032", name: "Training & Development", code: "EMP_TRAIN" },
            { id: "SUB033", name: "Staff Welfare", code: "EMP_WELF" },
            { id: "SUB034", name: "Team Building", code: "EMP_TEAM" },
            { id: "SUB035", name: "Employee Recognition", code: "EMP_RECOG" }
        ]
    },
    {
        id: "CAT008",
        name: "Rent & Facilities",
        code: "RENT_FAC",
        description: "Rent and facility management expenses",
        subcategories: [
            { id: "SUB036", name: "Office Rent", code: "RENT_OFF" },
            { id: "SUB037", name: "Parking", code: "RENT_PARK" },
            { id: "SUB038", name: "Security", code: "RENT_SEC" },
            { id: "SUB039", name: "Cleaning Services", code: "RENT_CLEAN" },
            { id: "SUB040", name: "Facility Maintenance", code: "RENT_MAINT" }
        ]
    },
    {
        id: "CAT009",
        name: "Insurance",
        code: "INSUR",
        description: "Insurance premiums and related costs",
        subcategories: [
            { id: "SUB041", name: "Property Insurance", code: "INSUR_PROP" },
            { id: "SUB042", name: "Vehicle Insurance", code: "INSUR_VEH" },
            { id: "SUB043", name: "Liability Insurance", code: "INSUR_LIAB" },
            { id: "SUB044", name: "Workers Compensation", code: "INSUR_WORK" },
            { id: "SUB045", name: "Professional Insurance", code: "INSUR_PROF" }
        ]
    },
    {
        id: "CAT010",
        name: "Taxes & Licenses",
        code: "TAX_LIC",
        description: "Government taxes and licensing fees",
        subcategories: [
            { id: "SUB046", name: "Business Licenses", code: "TAX_BUS" },
            { id: "SUB047", name: "Property Taxes", code: "TAX_PROP" },
            { id: "SUB048", name: "Vehicle Licenses", code: "TAX_VEH" },
            { id: "SUB049", name: "Professional Licenses", code: "TAX_PROF" },
            { id: "SUB050", name: "Permit Fees", code: "TAX_PERM" }
        ]
    },
    {
        id: "CAT011",
        name: "Bank & Financial",
        code: "BANK_FIN",
        description: "Banking and financial service charges",
        subcategories: [
            { id: "SUB051", name: "Bank Fees", code: "BANK_FEES" },
            { id: "SUB052", name: "Credit Card Fees", code: "BANK_CC" },
            { id: "SUB053", name: "Interest Charges", code: "BANK_INT" },
            { id: "SUB054", name: "Wire Transfer Fees", code: "BANK_WIRE" },
            { id: "SUB055", name: "Exchange Rate Fees", code: "BANK_EX" }
        ]
    },
    {
        id: "CAT012",
        name: "Office Refreshments",
        code: "OFF_REF",
        description: "Office refreshments and catering",
        subcategories: [
            { id: "SUB056", name: "Coffee & Tea", code: "REF_COF" },
            { id: "SUB057", name: "Water Supply", code: "REF_WAT" },
            { id: "SUB058", name: "Snacks", code: "REF_SNACK" },
            { id: "SUB059", name: "Office Parties", code: "REF_PARTY" },
            { id: "SUB060", name: "Client Refreshments", code: "REF_CLIENT" }
        ]
    },
    {
        id: "CAT013",
        name: "Miscellaneous",
        code: "MISC",
        description: "Other uncategorized expenses",
        subcategories: [
            { id: "SUB061", name: "Donations", code: "MISC_DON" },
            { id: "SUB062", name: "Subscriptions", code: "MISC_SUB" },
            { id: "SUB063", name: "Gifts", code: "MISC_GIFT" },
            { id: "SUB064", name: "Penalties", code: "MISC_PEN" },
            { id: "SUB065", name: "Other Expenses", code: "MISC_OTHER" }
        ]
    }
];

export const findCategoryByCode = (code: string): ExpenseCategory | undefined => {
    return EXPENSE_CATEGORIES.find(cat => cat.code === code);
};

export const findSubcategoryByCode = (categoryCode: string, subcategoryCode: string): SubCategory | undefined => {
    const category = findCategoryByCode(categoryCode);
    return category?.subcategories.find(sub => sub.code === subcategoryCode);
};

export const getCategoryName = (code: string): string => {
    return findCategoryByCode(code)?.name || code;
};

export const getSubcategoryName = (categoryCode: string, subcategoryCode: string): string => {
    return findSubcategoryByCode(categoryCode, subcategoryCode)?.name || subcategoryCode;
};

export const findCategoryBySubcategoryCode = (subcategoryCode: string): ExpenseCategory | undefined => {
    return EXPENSE_CATEGORIES.find(cat =>
        cat.subcategories.some(sub => sub.code === subcategoryCode)
    );
};