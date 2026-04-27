/**
 * GPT-5.1 FUNCTION DEFINITIONS (CORRECTED FORMAT)
 *
 * These define the functions available to AI for database operations.
 * OpenAI still uses nested format: { type: "function", function: { name, description, parameters } }
 * 
 * Key for GPT-5.1:
 * - Use /v1/chat/completions endpoint
 * - Response uses tool_calls[] (not function_call)
 * - But schema still needs nested function object
 */

// ============================================================================
// FINANCE FUNCTIONS
// ============================================================================

export const FINANCE_FUNCTIONS_GPT51 = [
  {
    type: "function",
    function: {
      name: "createTransaction",
      description:
        "Create a new financial transaction (income or expense) for the business. Use this when the user wants to log revenue, expenses, or any financial activity. IMPORTANT: Always specify 'type' as 'revenue' for income/sales/earnings, or 'expense' for costs/purchases/spending.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business this transaction belongs to",
          },
          amount: {
            type: "number",
            description:
              "The transaction amount in dollars. Always positive, regardless of type.",
          },
          type: {
            type: "string",
            enum: ["revenue", "expense"],
            description: "Whether this is income (revenue) or an expense. Use 'revenue' for sales, earnings, income. Use 'expense' for costs, purchases, spending.",
          },
          category: {
            type: "string",
            description:
              'Category like "Office Supplies", "Consulting Revenue", "Marketing", "Product Sales", etc.',
          },
          description: {
            type: "string",
            description: "Clear description of what this transaction is for",
          },
          date: {
            type: "string",
            description: "Transaction date in ISO format (YYYY-MM-DD)",
          },
        },
        required: [
          "businessId",
          "amount",
          "type",
          "category",
          "description",
          "date",
        ],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "createBudget",
      description:
        "Create a budget for a specific category. Use when user wants to set spending limits.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          category: {
            type: "string",
            description:
              'Budget category (e.g., "Marketing", "Office Supplies")',
          },
          amount: {
            type: "number",
            description: "Budget amount in dollars",
          },
          period: {
            type: "string",
            enum: ["monthly", "quarterly", "yearly"],
            description: "Budget period",
          },
          startDate: {
            type: "string",
            description: "Budget start date in ISO format",
          },
        },
        required: ["businessId", "category", "amount", "period", "startDate"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "updateTransaction",
      description:
        "Update an existing transaction. Use when user wants to modify transaction details like amount, category, description, or date.",
      parameters: {
        type: "object",
        properties: {
          transactionId: {
            type: "string",
            description: "The ID of the transaction to update",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the update",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["transactionId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "deleteTransaction",
      description:
        "Delete a transaction. Use when user wants to remove a transaction from the system.",
      parameters: {
        type: "object",
        properties: {
          transactionId: {
            type: "string",
            description: "The ID of the transaction to delete",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the deletion",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["transactionId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
];

// ============================================================================
// ROADMAP FUNCTIONS
// ============================================================================

export const ROADMAP_FUNCTIONS_GPT51 = [
  {
    type: "function",
    function: {
      name: "createRoadmapTask",
      description:
        "Create a new task in the business roadmap. Use when user wants to add a task, milestone, or goal.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          title: {
            type: "string",
            description: "Clear, action-oriented task title",
          },
          description: {
            type: "string",
            description: "Detailed description of the task and its goals",
          },
          department: {
            type: "string",
            enum: ["product", "marketing", "sales", "finance", "operations", "hr"],
            description: "Which department this task belongs to",
          },
          stage: {
            type: "string",
            description: 'Stage like "Foundation", "Launch", "Growth", "Scale"',
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Task priority level",
          },
          estimatedHours: {
            type: "number",
            description: "Estimated hours to complete",
          },
          dueDate: {
            type: "string",
            description: "Due date in ISO format",
          },
        },
        required: ["businessId", "title", "department", "stage"],
      },
    }
  },
];

// ============================================================================
// HR FUNCTIONS
// ============================================================================

export const HR_FUNCTIONS_GPT51 = [
  {
    type: "function",
    function: {
      name: "addTeamMember",
      description:
        "Add a new team member to the organization. Use when user is hiring or onboarding someone.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          name: {
            type: "string",
            description: "Team member full name",
          },
          email: {
            type: "string",
            description: "Team member email address",
          },
          role: {
            type: "string",
            description:
              'Job title/role (e.g., "Software Engineer", "Marketing Manager")',
          },
          department: {
            type: "string",
            description: "Department they belong to",
          },
          salary: {
            type: "number",
            description: "Annual salary in dollars",
          },
          startDate: {
            type: "string",
            description: "Start date in ISO format",
          },
          employmentType: {
            type: "string",
            enum: ["full-time", "part-time", "contractor"],
            description: "Type of employment",
          },
        },
        required: ["businessId", "name", "role"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "createEmployeeBenefit",
      description:
        "Create a new employee benefit package. Use when user wants to add or document benefits for employees.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          name: {
            type: "string",
            description: "Benefit name (e.g., Health Insurance, 401k, PTO)",
          },
          description: {
            type: "string",
            description: "Detailed description of the benefit",
          },
          type: {
            type: "string",
            enum: ["health", "retirement", "pto", "insurance", "wellness", "other"],
            description: "Type of benefit",
          },
          cost: {
            type: "number",
            description: "Monthly cost per employee in dollars",
          },
          eligibility: {
            type: "string",
            description: "Eligibility requirements (e.g., full-time employees, after 90 days)",
          },
        },
        required: ["businessId", "name", "type"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "updateEmployeeBenefit",
      description:
        "Update an existing employee benefit. Use when user wants to modify benefit details like name, description, or cost.",
      parameters: {
        type: "object",
        properties: {
          benefitId: {
            type: "string",
            description: "The ID of the benefit to update",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the update",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["benefitId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "deleteEmployeeBenefit",
      description:
        "Delete an employee benefit. Use when user wants to remove a benefit from the system.",
      parameters: {
        type: "object",
        properties: {
          benefitId: {
            type: "string",
            description: "The ID of the benefit to delete",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the deletion",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["benefitId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "createEmployeePerformance",
      description:
        "Create an employee performance review or assessment. Use when user wants to document performance evaluations.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          employeeId: {
            type: "string",
            description: "ID of the employee being reviewed",
          },
          reviewDate: {
            type: "string",
            description: "Review date in ISO format",
          },
          rating: {
            type: "number",
            description: "Performance rating (1-5)",
          },
          goals: {
            type: "string",
            description: "Goals achieved and progress",
          },
          feedback: {
            type: "string",
            description: "Performance feedback and comments",
          },
          areasForImprovement: {
            type: "string",
            description: "Areas needing improvement",
          },
          nextReviewDate: {
            type: "string",
            description: "Next scheduled review date",
          },
        },
        required: ["businessId", "employeeId", "reviewDate", "rating"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "updateEmployeePerformance",
      description:
        "Update an employee performance review. Use when user wants to modify rating or feedback in a performance record.",
      parameters: {
        type: "object",
        properties: {
          performanceId: {
            type: "string",
            description: "The ID of the performance review to update",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the update",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["performanceId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "deleteEmployeePerformance",
      description:
        "Delete an employee performance review. Use when user wants to remove a performance record.",
      parameters: {
        type: "object",
        properties: {
          performanceId: {
            type: "string",
            description: "The ID of the performance review to delete",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the deletion",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["performanceId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "createContractor",
      description:
        "Create a new contractor record. Use when user wants to add a contractor or freelancer to the system.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          name: {
            type: "string",
            description: "Contractor name",
          },
          email: {
            type: "string",
            description: "Contractor email",
          },
          company: {
            type: "string",
            description: "Contractor's company name if applicable",
          },
          specialty: {
            type: "string",
            description: "Area of expertise or service provided",
          },
          hourlyRate: {
            type: "number",
            description: "Hourly rate in dollars",
          },
          startDate: {
            type: "string",
            description: "Contract start date",
          },
          endDate: {
            type: "string",
            description: "Contract end date if applicable",
          },
          status: {
            type: "string",
            enum: ["active", "inactive", "completed"],
            description: "Contract status",
          },
        },
        required: ["businessId", "name", "specialty"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "updateContractor",
      description:
        "Update a contractor record. Use when user wants to modify contractor name, hourly rate, or status.",
      parameters: {
        type: "object",
        properties: {
          contractorId: {
            type: "string",
            description: "The ID of the contractor to update",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the update",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["contractorId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "deleteContractor",
      description:
        "Delete a contractor record. Use when user wants to remove a contractor from the system.",
      parameters: {
        type: "object",
        properties: {
          contractorId: {
            type: "string",
            description: "The ID of the contractor to delete",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the deletion",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["contractorId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "deleteHandbook",
      description:
        "Delete a handbook. Use when user wants to remove a handbook from the system.",
      parameters: {
        type: "object",
        properties: {
          handbookId: {
            type: "string",
            description: "The ID of the handbook to delete",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the deletion",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["handbookId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "deleteOnboardingPlan",
      description:
        "Delete an onboarding plan. Use when user wants to remove an onboarding plan from the system.",
      parameters: {
        type: "object",
        properties: {
          planId: {
            type: "string",
            description: "The ID of the onboarding plan to delete",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the deletion",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["planId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "updateUserProfile",
      description:
        "Update user profile information. Use when user wants to modify their profile details.",
      parameters: {
        type: "object",
        properties: {
          userId: {
            type: "string",
            description: "The ID of the user",
          },
          name: {
            type: "string",
            description: "Updated display name",
          },
          email: {
            type: "string",
            description: "Updated email address",
          },
          phone: {
            type: "string",
            description: "Updated phone number",
          },
          title: {
            type: "string",
            description: "Updated job title",
          },
          bio: {
            type: "string",
            description: "Updated bio or description",
          },
        },
        required: ["userId"],
      },
    }
  },
];

// ============================================================================
// PRODUCT FUNCTIONS
// ============================================================================

export const PRODUCT_FUNCTIONS_GPT51 = [
  {
    type: "function",
    function: {
      name: "createProduct",
      description:
        "Create a new product or service offering. Use when user wants to add a product to their catalog.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          name: {
            type: "string",
            description: "Product name",
          },
          description: {
            type: "string",
            description: "Product description and value proposition",
          },
          price: {
            type: "number",
            description: "Product price in dollars",
          },
          category: {
            type: "string",
            description: "Product category",
          },
          status: {
            type: "string",
            enum: ["idea", "development", "launched", "discontinued"],
            description: "Product development status",
          },
          targetMarket: {
            type: "string",
            description: "Target market or customer segment",
          },
        },
        required: ["businessId", "name"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "getProducts",
      description:
        "Get all products for a business. Use this to look up product IDs when user mentions a product by name.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["businessId"],
      },
    }
  },
];

// ============================================================================
// SALES FUNCTIONS
// ============================================================================

export const SALES_FUNCTIONS_GPT51 = [
  {
    type: "function",
    function: {
      name: "createSalesLead",
      description:
        "Add a new sales lead or prospect. Use when user mentions a potential customer or opportunity.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          name: {
            type: "string",
            description: "Lead or contact name",
          },
          email: {
            type: "string",
            description: "Contact email",
          },
          phone: {
            type: "string",
            description: "Contact phone number",
          },
          company: {
            type: "string",
            description: "Company name",
          },
          value: {
            type: "number",
            description: "Estimated deal value in dollars",
          },
          status: {
            type: "string",
            enum: [
              "new",
              "contacted",
              "qualified",
              "proposal",
              "negotiation",
              "won",
              "lost",
            ],
            description: "Current status in sales pipeline",
          },
          notes: {
            type: "string",
            description: "Notes about the lead or opportunity",
          },
        },
        required: ["businessId", "name"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "createSalesDeal",
      description:
        "Create a new sales deal or opportunity. Use when user wants to track a specific sales opportunity through the pipeline.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          title: {
            type: "string",
            description: "Deal title or opportunity name",
          },
          customerId: {
            type: "string",
            description: "ID of the customer associated with this deal",
          },
          value: {
            type: "number",
            description: "Deal value in dollars",
          },
          stage: {
            type: "string",
            enum: ["lead", "qualified", "proposal", "negotiation", "closed-won", "closed-lost"],
            description: "Current stage in the sales pipeline",
          },
          probability: {
            type: "number",
            description: "Win probability percentage (0-100)",
          },
          expectedCloseDate: {
            type: "string",
            description: "Expected close date in ISO format",
          },
          notes: {
            type: "string",
            description: "Notes about the deal",
          },
        },
        required: ["businessId", "title", "value", "stage"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "updateSalesDeal",
      description:
        "Update an existing sales deal. Use when user wants to change deal stage, value, or other details.",
      parameters: {
        type: "object",
        properties: {
          dealId: {
            type: "string",
            description: "The ID of the deal to update",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the update",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["dealId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "deleteSalesDeal",
      description:
        "Delete a sales deal. Use when user wants to remove a deal from the system.",
      parameters: {
        type: "object",
        properties: {
          dealId: {
            type: "string",
            description: "The ID of the deal to delete",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the deletion",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["dealId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "createSalesCustomer",
      description:
        "Create a new sales customer. Use when user wants to add a customer to their CRM.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          name: {
            type: "string",
            description: "Customer name or company name",
          },
          email: {
            type: "string",
            description: "Customer email",
          },
          phone: {
            type: "string",
            description: "Customer phone number",
          },
          company: {
            type: "string",
            description: "Company name if applicable",
          },
          industry: {
            type: "string",
            description: "Customer's industry",
          },
          address: {
            type: "string",
            description: "Customer address",
          },
          status: {
            type: "string",
            enum: ["active", "inactive", "churned"],
            description: "Customer status",
          },
          notes: {
            type: "string",
            description: "Notes about the customer",
          },
        },
        required: ["businessId", "name"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "updateSalesCustomer",
      description:
        "Update an existing sales customer. Use when user wants to modify customer name, email, phone, status, or notes.",
      parameters: {
        type: "object",
        properties: {
          customerId: {
            type: "string",
            description: "The ID of the customer to update",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the update",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["customerId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "deleteSalesCustomer",
      description:
        "Delete a sales customer. Use when user wants to remove a customer from the CRM.",
      parameters: {
        type: "object",
        properties: {
          customerId: {
            type: "string",
            description: "The ID of the customer to delete",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the deletion",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["customerId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "createSalesEmailSequence",
      description:
        "Create a new sales email sequence. Use when user wants to set up an automated email campaign for sales outreach.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          name: {
            type: "string",
            description: "Sequence name",
          },
          description: {
            type: "string",
            description: "Sequence description and purpose",
          },
          emails: {
            type: "array",
            items: {
              type: "object",
              properties: {
                subject: { type: "string" },
                body: { type: "string" },
                delay: { type: "number", description: "Days after previous email" },
              },
            },
            description: "Array of emails in the sequence",
          },
          status: {
            type: "string",
            enum: ["active", "paused", "draft"],
            description: "Sequence status",
          },
        },
        required: ["businessId", "name"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "updateSalesEmailSequence",
      description:
        "Update an existing sales email sequence. Use when user wants to modify sequence name, description, or status.",
      parameters: {
        type: "object",
        properties: {
          sequenceId: {
            type: "string",
            description: "The ID of the sequence to update",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the update",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["sequenceId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "deleteSalesEmailSequence",
      description:
        "Delete a sales email sequence. Use when user wants to remove an email sequence.",
      parameters: {
        type: "object",
        properties: {
          sequenceId: {
            type: "string",
            description: "The ID of the sequence to delete",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the deletion",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["sequenceId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
];

// ============================================================================
// MARKETING FUNCTIONS
// ============================================================================

export const MARKETING_FUNCTIONS_GPT51 = [
  {
    type: "function",
    function: {
      name: "createMarketingCampaign",
      description:
        "Create a new marketing campaign. Use when user wants to launch or plan a marketing initiative.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          name: {
            type: "string",
            description: "Campaign name",
          },
          description: {
            type: "string",
            description: "Campaign description and goals",
          },
          type: {
            type: "string",
            enum: ["email", "social", "content", "paid-ads", "seo", "other"],
            description: "Type of marketing campaign",
          },
          budget: {
            type: "number",
            description: "Campaign budget in dollars",
          },
          startDate: {
            type: "string",
            description: "Campaign start date in ISO format",
          },
          endDate: {
            type: "string",
            description: "Campaign end date in ISO format",
          },
          status: {
            type: "string",
            enum: ["planning", "active", "paused", "completed"],
            description: "Campaign status",
          },
        },
        required: ["businessId", "name"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "createMarketingLead",
      description:
        "Create a new marketing lead. Use when user wants to add a lead from marketing campaigns or inbound inquiries.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          name: {
            type: "string",
            description: "Lead name",
          },
          email: {
            type: "string",
            description: "Lead email",
          },
          phone: {
            type: "string",
            description: "Lead phone number",
          },
          source: {
            type: "string",
            description: "Lead source (e.g., website, social media, referral)",
          },
          campaign: {
            type: "string",
            description: "Associated marketing campaign",
          },
          status: {
            type: "string",
            enum: ["new", "contacted", "qualified", "unqualified", "converted"],
            description: "Lead status",
          },
          score: {
            type: "number",
            description: "Lead score (0-100)",
          },
          notes: {
            type: "string",
            description: "Notes about the lead",
          },
        },
        required: ["businessId", "name", "email"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "updateMarketingLead",
      description:
        "Update an existing marketing lead. Use when user wants to modify lead information or status.",
      parameters: {
        type: "object",
        properties: {
          leadId: {
            type: "string",
            description: "The ID of the lead to update",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the update",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["leadId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
  {
    type: "function",
    function: {
      name: "deleteMarketingLead",
      description:
        "Delete a marketing lead. Use when user wants to remove a lead from the system.",
      parameters: {
        type: "object",
        properties: {
          leadId: {
            type: "string",
            description: "The ID of the lead to delete",
          },
          userId: {
            type: "string",
            description: "The ID of the user making the deletion",
          },
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
        },
        required: ["leadId", "userId", "businessId"],
        additionalProperties: false,
      },
      strict: true,
    }
  },
];

// ============================================================================
// NOTES FUNCTIONS
// ============================================================================

export const NOTES_FUNCTIONS_GPT51 = [
  {
    type: "function",
    function: {
      name: "createNote",
      description:
        "Create a note or document. Use when user wants to save information, ideas, or documentation.",
      parameters: {
        type: "object",
        properties: {
          businessId: {
            type: "string",
            description: "The ID of the business",
          },
          title: {
            type: "string",
            description: "Note title",
          },
          content: {
            type: "string",
            description: "Note content/body",
          },
          category: {
            type: "string",
            description: "Note category for organization",
          },
          tags: {
            type: "array",
            items: { type: "string" },
            description: "Tags for categorization",
          },
        },
        required: ["businessId", "title", "content"],
      },
    }
  },
];

// ============================================================================
// COMBINED FUNCTION SETS
// ============================================================================

export const ALL_FUNCTIONS_GPT51 = [
  ...FINANCE_FUNCTIONS_GPT51,
  ...ROADMAP_FUNCTIONS_GPT51,
  ...HR_FUNCTIONS_GPT51,
  ...PRODUCT_FUNCTIONS_GPT51,
  ...SALES_FUNCTIONS_GPT51,
  ...MARKETING_FUNCTIONS_GPT51,
  ...NOTES_FUNCTIONS_GPT51,
];

export const DEPARTMENT_FUNCTIONS_GPT51 = {
  finance: [...FINANCE_FUNCTIONS_GPT51, ...NOTES_FUNCTIONS_GPT51],
  hr: [...HR_FUNCTIONS_GPT51, ...NOTES_FUNCTIONS_GPT51],
  product: [...PRODUCT_FUNCTIONS_GPT51, ...ROADMAP_FUNCTIONS_GPT51, ...NOTES_FUNCTIONS_GPT51],
  sales: [...SALES_FUNCTIONS_GPT51, ...NOTES_FUNCTIONS_GPT51],
  marketing: [...MARKETING_FUNCTIONS_GPT51, ...NOTES_FUNCTIONS_GPT51],
  roadmap: [...ROADMAP_FUNCTIONS_GPT51],
  general: ALL_FUNCTIONS_GPT51, // Main Cofounder AI has access to everything
};