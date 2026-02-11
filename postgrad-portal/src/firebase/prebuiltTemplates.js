// ============================================
// Prebuilt Form Template Definitions
// All 20 FHD Word templates as JSON schemas
// Weighted tables are OPTIONAL – only for structured programmes
// ============================================

/* ── Shared layout header ── */
const UWC_HEADER = {
  logoUrl: '/uwc_logo.svg',
  lines: [
    'UNIVERSITY OF THE WESTERN CAPE',
    'FACULTY OF NATURAL SCIENCES',
    'FACULTY HIGHER DEGREES COMMITTEE',
  ],
};

/* ── Helper: build auto-populated student fields ── */
function studentInfoFields(startRow = 1) {
  return [
    { id: 'student_number', type: 'auto_populated', label: 'Student Number', autoPopulate: { source: 'user', field: 'studentNumber' }, width: 'half', row: startRow, required: true, readOnlyForRoles: ['student', 'supervisor', 'coordinator'] },
    { id: 'surname', type: 'auto_populated', label: 'Surname', autoPopulate: { source: 'user', field: 'surname' }, width: 'half', row: startRow, required: true, readOnlyForRoles: ['student', 'supervisor', 'coordinator'] },
    { id: 'first_names', type: 'auto_populated', label: 'First Names', autoPopulate: { source: 'user', field: 'firstName' }, width: 'half', row: startRow + 1, required: true, readOnlyForRoles: ['student', 'supervisor', 'coordinator'] },
    { id: 'department', type: 'auto_populated', label: 'Department', autoPopulate: { source: 'studentProfile', field: 'department' }, width: 'half', row: startRow + 1, required: true, readOnlyForRoles: ['student', 'supervisor', 'coordinator'] },
    { id: 'degree', type: 'select', label: 'Degree', options: [
      { value: 'msc', label: 'MSc' }, { value: 'msc_structured', label: 'MSc (Structured)' },
      { value: 'phd', label: 'PhD' }, { value: 'dphil', label: 'DPhil' },
      { value: 'ma', label: 'MA' }, { value: 'mcom', label: 'MCom' },
    ], width: 'half', row: startRow + 2, required: true },
    { id: 'programme', type: 'auto_populated', label: 'Programme', autoPopulate: { source: 'studentProfile', field: 'programme' }, width: 'half', row: startRow + 2, required: true, readOnlyForRoles: ['student', 'supervisor', 'coordinator'] },
  ];
}

/** Standard supervisor review fields */
function supervisorReviewFields() {
  return [
    { id: 'sup_recommendation', type: 'select', label: 'Recommendation', options: [
      { value: 'supported', label: 'Supported' },
      { value: 'supported_with_reservations', label: 'Supported with Reservations' },
      { value: 'not_supported', label: 'Not Supported' },
    ], width: 'full', row: 1, required: true },
    { id: 'sup_comments', type: 'textarea', label: 'Comments / Motivation', placeholder: 'Provide comments or motivation...', width: 'full', row: 2, required: false },
    { id: 'sup_name', type: 'auto_populated', label: 'Supervisor Name', autoPopulate: { source: 'user', field: 'name' }, width: 'half', row: 3, readOnlyForRoles: ['supervisor'] },
    { id: 'sup_date', type: 'auto_populated', label: 'Date', autoPopulate: { source: 'system', field: 'currentDate' }, width: 'half', row: 3, readOnlyForRoles: ['supervisor'] },
  ];
}

/** Standard coordinator review fields */
function coordinatorReviewFields() {
  return [
    { id: 'coord_recommendation', type: 'select', label: 'Recommendation', options: [
      { value: 'supported', label: 'Recommended to FHD' },
      { value: 'not_supported', label: 'Not Recommended' },
    ], width: 'full', row: 1, required: true },
    { id: 'coord_comments', type: 'textarea', label: 'Comments', placeholder: 'Coordinator comments...', width: 'full', row: 2, required: false },
    { id: 'coord_name', type: 'auto_populated', label: 'Coordinator Name', autoPopulate: { source: 'user', field: 'name' }, width: 'half', row: 3, readOnlyForRoles: ['coordinator'] },
    { id: 'coord_date', type: 'auto_populated', label: 'Date', autoPopulate: { source: 'system', field: 'currentDate' }, width: 'half', row: 3, readOnlyForRoles: ['coordinator'] },
  ];
}

// ════════════════════════════════════════════════════════════
// TEMPLATE 1: Title Registration
// ════════════════════════════════════════════════════════════
export const TITLE_REGISTRATION = {
  name: 'Title Registration',
  slug: 'title_registration',
  category: 'registration',
  description: 'Register a new thesis/dissertation title for higher degree studies.',
  initiatorRoles: ['student'],
  isPrebuilt: true,
  sourceDocx: 'Title Registration 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'TITLE REGISTRATION FORM', formCode: 'FHD-TR-2026' },
    style: 'document',
    showWatermark: true,
  },
  sections: [
    {
      id: 'student_details',
      title: 'STUDENT DETAILS',
      assignedRole: 'student',
      order: 1,
      layoutMode: 'table',
      requiresSignature: false,
      showBorder: false,
      fields: studentInfoFields(),
    },
    {
      id: 'research_details',
      title: 'PROPOSED RESEARCH',
      assignedRole: 'student',
      order: 2,
      layoutMode: 'table',
      requiresSignature: true,
      signatureLabel: 'Signature of Student',
      showBorder: true,
      fields: [
        { id: 'proposed_title', type: 'textarea', label: 'Proposed Thesis / Dissertation Title', placeholder: 'Enter the full title of your proposed research...', width: 'full', row: 1, required: true },
        { id: 'keywords', type: 'keywords_tag', label: 'Keywords', placeholder: 'Type a keyword and press Enter...', helpText: 'Add keywords that describe your research area', width: 'full', row: 2, required: true },
        { id: 'research_description', type: 'textarea', label: 'Brief Description of Intended Research', placeholder: 'Provide a concise description of your proposed research, including objectives and methodology...', width: 'full', row: 3, required: true, validation: { minLength: 100, message: 'Please provide at least 100 characters' } },
        { id: 'student_date', type: 'auto_populated', label: 'Date', autoPopulate: { source: 'system', field: 'currentDate' }, width: 'half', row: 4, readOnlyForRoles: ['student'] },
      ],
    },
    {
      id: 'supervisor_review',
      title: 'SUPERVISOR RECOMMENDATION',
      assignedRole: 'supervisor',
      order: 3,
      layoutMode: 'table',
      requiresSignature: true,
      signatureLabel: 'Signature of Supervisor',
      showBorder: true,
      borderLabel: 'FOR OFFICIAL USE',
      fields: supervisorReviewFields(),
    },
    {
      id: 'co_supervisor_review',
      title: 'CO-SUPERVISOR RECOMMENDATION',
      assignedRole: 'co_supervisor',
      order: 4,
      layoutMode: 'table',
      requiresSignature: true,
      signatureLabel: 'Signature of Co-Supervisor',
      showBorder: true,
      conditionalOn: { fieldId: '_has_co_supervisor', operator: 'equals', value: true },
      fields: [
        { id: 'cosup_recommendation', type: 'select', label: 'Recommendation', options: [
          { value: 'supported', label: 'Supported' },
          { value: 'not_supported', label: 'Not Supported' },
        ], width: 'full', row: 1, required: true },
        { id: 'cosup_comments', type: 'textarea', label: 'Comments', width: 'full', row: 2 },
        { id: 'cosup_name', type: 'auto_populated', label: 'Co-Supervisor Name', autoPopulate: { source: 'user', field: 'name' }, width: 'half', row: 3 },
        { id: 'cosup_date', type: 'auto_populated', label: 'Date', autoPopulate: { source: 'system', field: 'currentDate' }, width: 'half', row: 3 },
      ],
    },
    {
      id: 'coordinator_review',
      title: 'COORDINATOR RECOMMENDATION',
      assignedRole: 'coordinator',
      order: 5,
      layoutMode: 'table',
      requiresSignature: true,
      signatureLabel: 'Signature of Coordinator',
      showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [
    { label: 'Research Proposal', fileTypes: ['.pdf', '.docx'], required: true },
  ],
  linkedForms: [],
  exportConfig: {
    templatePath: '/templates/title_registration_2026.docx',
    fieldMapping: {
      student_number: 'student_number', surname: 'surname', first_names: 'first_names',
      department: 'department', degree: 'degree', programme: 'programme',
      proposed_title: 'proposed_title', keywords: 'keyword_list',
      research_description: 'research_description',
    },
    computedValues: [
      { tag: 'keyword_list', type: 'join', sourceFieldIds: ['keywords'], config: { separator: '; ' } },
    ],
  },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 2: Progress Report
// ════════════════════════════════════════════════════════════
export const PROGRESS_REPORT = {
  name: 'Progress Report',
  slug: 'progress_report',
  category: 'progress',
  description: 'Annual/bi-annual progress report for postgraduate students.',
  initiatorRoles: ['student'],
  isPrebuilt: true,
  sourceDocx: 'Progress Report Template - 2025 - Natural Sciences.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'PROGRESS REPORT', formCode: 'FHD-PR-2025' },
    style: 'document',
    showWatermark: true,
  },
  sections: [
    {
      id: 'student_details',
      title: 'STUDENT DETAILS',
      assignedRole: 'student',
      order: 1,
      layoutMode: 'table',
      requiresSignature: false,
      fields: [
        ...studentInfoFields(),
        { id: 'registration_date', type: 'auto_populated', label: 'Registration Date', autoPopulate: { source: 'studentProfile', field: 'registrationDate' }, width: 'half', row: 4, readOnlyForRoles: ['student'] },
        { id: 'reporting_period', type: 'text', label: 'Reporting Period', placeholder: 'e.g. January 2026 – June 2026', width: 'half', row: 4, required: true },
      ],
    },
    {
      id: 'progress_narrative',
      title: 'PROGRESS REPORT',
      assignedRole: 'student',
      order: 2,
      layoutMode: 'flow',
      requiresSignature: true,
      signatureLabel: 'Signature of Student',
      showBorder: true,
      fields: [
        { id: 'work_completed', type: 'textarea', label: 'Work Completed During This Period', placeholder: 'Describe the research work completed during this reporting period...', width: 'full', row: 1, required: true, validation: { minLength: 150, message: 'Please provide a detailed description (min 150 chars)' } },
        { id: 'challenges', type: 'textarea', label: 'Challenges Encountered', placeholder: 'Describe any challenges or obstacles encountered...', width: 'full', row: 2, required: false },
        { id: 'planned_activities', type: 'textarea', label: 'Planned Activities for Next Period', placeholder: 'Outline your research plan for the next period...', width: 'full', row: 3, required: true },
        { id: 'publications', type: 'textarea', label: 'Publications / Conference Presentations', placeholder: 'List any publications submitted, accepted, or conference presentations made...', width: 'full', row: 4, required: false },
        { id: 'expected_completion', type: 'date', label: 'Expected Completion Date', width: 'half', row: 5, required: true },
        { id: 'student_report_date', type: 'auto_populated', label: 'Date', autoPopulate: { source: 'system', field: 'currentDate' }, width: 'half', row: 5 },
      ],
    },
    {
      id: 'supervisor_assessment',
      title: 'SUPERVISOR ASSESSMENT',
      assignedRole: 'supervisor',
      order: 3,
      layoutMode: 'flow',
      requiresSignature: true,
      signatureLabel: 'Signature of Supervisor',
      showBorder: true,
      borderLabel: 'FOR SUPERVISOR',
      fields: [
        { id: 'sup_progress_rating', type: 'select', label: 'Overall Progress Rating', options: [
          { value: 'excellent', label: 'Excellent – Ahead of schedule' },
          { value: 'good', label: 'Good – On track' },
          { value: 'satisfactory', label: 'Satisfactory – Minor delays' },
          { value: 'unsatisfactory', label: 'Unsatisfactory – Significant concerns' },
          { value: 'at_risk', label: 'At Risk – Requires intervention' },
        ], width: 'full', row: 1, required: true },
        {
          id: 'weighted_assessment',
          type: 'weighted_table',
          label: 'Weighted Assessment (Structured Programmes Only)',
          helpText: 'This table is optional – only complete if the student is enrolled in a structured programme.',
          width: 'full',
          row: 2,
          required: false,   // ← OPTIONAL – only for structured programmes
          conditionalOn: null, // Always visible, but not required
          tableConfig: {
            columns: [
              { key: 'criterion', label: 'Assessment Criterion', type: 'text', width: '35%' },
              { key: 'weight', label: 'Weight (%)', type: 'number', width: '15%' },
              { key: 'mark', label: 'Mark (%)', type: 'number', width: '15%' },
              { key: 'weighted_mark', label: 'Weighted Mark', type: 'computed', width: '15%' },
              { key: 'comment', label: 'Comment', type: 'text', width: '20%' },
            ],
            rows: [
              { key: 'coursework', label: 'Coursework / Modules', weight: 0 },
              { key: 'literature_review', label: 'Literature Review', weight: 0 },
              { key: 'methodology', label: 'Research Methodology', weight: 0 },
              { key: 'data_collection', label: 'Data Collection / Analysis', weight: 0 },
              { key: 'writing', label: 'Thesis Writing', weight: 0 },
            ],
            showWeightColumn: true,
            showTotalRow: true,
            totalFormula: 'weighted_average',
            isOptional: true,
          },
        },
        { id: 'sup_narrative_assessment', type: 'textarea', label: 'Supervisor Narrative Assessment', placeholder: 'Provide your assessment of the student\'s progress, quality of work, and recommendations...', width: 'full', row: 3, required: true },
        { id: 'sup_recommendation_progress', type: 'select', label: 'Recommendation', options: [
          { value: 'continue', label: 'Continue Registration' },
          { value: 'continue_with_conditions', label: 'Continue with Conditions' },
          { value: 'discontinue', label: 'Recommend Discontinuation' },
        ], width: 'full', row: 4, required: true },
        { id: 'sup_conditions', type: 'textarea', label: 'Conditions (if applicable)', placeholder: 'Specify conditions that must be met...', width: 'full', row: 5, conditionalOn: { fieldId: 'sup_recommendation_progress', operator: 'equals', value: 'continue_with_conditions' } },
      ],
    },
    {
      id: 'coordinator_review',
      title: 'COORDINATOR RECOMMENDATION',
      assignedRole: 'coordinator',
      order: 4,
      layoutMode: 'table',
      requiresSignature: true,
      signatureLabel: 'Signature of Coordinator',
      showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/progress_report_2025.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 3: Intention to Submit
// ════════════════════════════════════════════════════════════
export const INTENTION_TO_SUBMIT = {
  name: 'Intention to Submit',
  slug: 'intention_to_submit',
  category: 'registration',
  description: 'Notify the Faculty of your intention to submit your thesis/dissertation.',
  initiatorRoles: ['student'],
  isPrebuilt: true,
  sourceDocx: 'Intention to Submit 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'INTENTION TO SUBMIT', formCode: 'FHD-ITS-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'student', order: 1,
      layoutMode: 'table', requiresSignature: false, fields: studentInfoFields(),
    },
    {
      id: 'submission_details', title: 'SUBMISSION DETAILS', assignedRole: 'student', order: 2,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Student', showBorder: true,
      fields: [
        { id: 'thesis_title', type: 'auto_populated', label: 'Thesis / Dissertation Title', autoPopulate: { source: 'studentProfile', field: 'thesisTitle' }, width: 'full', row: 1, required: true },
        { id: 'expected_submission_date', type: 'date', label: 'Expected Date of Submission', width: 'half', row: 2, required: true },
        { id: 'thesis_format', type: 'select', label: 'Thesis Format', options: [
          { value: 'monograph', label: 'Monograph' }, { value: 'article_based', label: 'Article-based' },
          { value: 'portfolio', label: 'Portfolio' },
        ], width: 'half', row: 2, required: true },
        { id: 'special_requirements', type: 'textarea', label: 'Special Requirements / Notes', placeholder: 'Any special requirements for submission...', width: 'full', row: 3 },
        { id: 'student_its_date', type: 'auto_populated', label: 'Date', autoPopulate: { source: 'system', field: 'currentDate' }, width: 'half', row: 4 },
      ],
    },
    {
      id: 'supervisor_review', title: 'SUPERVISOR ENDORSEMENT', assignedRole: 'supervisor', order: 3,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true, borderLabel: 'FOR OFFICIAL USE',
      fields: [
        { id: 'sup_readiness', type: 'select', label: 'In your opinion, is the candidate ready to submit?', options: [
          { value: 'yes', label: 'Yes' }, { value: 'yes_with_minor_revisions', label: 'Yes, with minor revisions' }, { value: 'no', label: 'No' },
        ], width: 'full', row: 1, required: true },
        { id: 'sup_its_comments', type: 'textarea', label: 'Comments', width: 'full', row: 2 },
        { id: 'sup_its_name', type: 'auto_populated', label: 'Supervisor Name', autoPopulate: { source: 'user', field: 'name' }, width: 'half', row: 3 },
        { id: 'sup_its_date', type: 'auto_populated', label: 'Date', autoPopulate: { source: 'system', field: 'currentDate' }, width: 'half', row: 3 },
      ],
    },
    {
      id: 'coordinator_review', title: 'COORDINATOR RECOMMENDATION', assignedRole: 'coordinator', order: 4,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/intention_to_submit_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 4: Appointment of Examiners
// ════════════════════════════════════════════════════════════
export const APPOINTMENT_OF_EXAMINERS = {
  name: 'Appointment of Examiners',
  slug: 'appointment_of_examiners',
  category: 'examination',
  description: 'Request appointment of examiners for thesis/dissertation examination.',
  initiatorRoles: ['supervisor'],
  isPrebuilt: true,
  sourceDocx: 'Appointment of Examiners 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'APPOINTMENT OF EXAMINERS', formCode: 'FHD-AE-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'supervisor', order: 1,
      layoutMode: 'table', requiresSignature: false,
      fields: [
        { id: 'student_name', type: 'auto_populated', label: 'Student Name', autoPopulate: { source: 'studentProfile', field: 'fullName' }, width: 'half', row: 1 },
        { id: 'student_number', type: 'auto_populated', label: 'Student Number', autoPopulate: { source: 'user', field: 'studentNumber' }, width: 'half', row: 1 },
        { id: 'department', type: 'auto_populated', label: 'Department', autoPopulate: { source: 'studentProfile', field: 'department' }, width: 'half', row: 2 },
        { id: 'degree', type: 'auto_populated', label: 'Degree', autoPopulate: { source: 'studentProfile', field: 'degree' }, width: 'half', row: 2 },
        { id: 'thesis_title', type: 'auto_populated', label: 'Thesis Title', autoPopulate: { source: 'studentProfile', field: 'thesisTitle' }, width: 'full', row: 3 },
      ],
    },
    {
      id: 'examiners', title: 'PROPOSED EXAMINERS', assignedRole: 'supervisor', order: 2,
      layoutMode: 'flow', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true,
      fields: [
        {
          id: 'examiner_list', type: 'repeater_group', label: 'Examiners', width: 'full', row: 1, required: true,
          repeaterConfig: {
            minItems: 2, maxItems: 4, addLabel: 'Add Examiner', itemTitle: 'Examiner {n}',
            fields: [
              { id: 'examiner_name', type: 'text', label: 'Full Name', width: 'half', row: 1, required: true },
              { id: 'examiner_title', type: 'select', label: 'Title', options: [
                { value: 'Prof', label: 'Prof' }, { value: 'Dr', label: 'Dr' }, { value: 'Mr', label: 'Mr' }, { value: 'Ms', label: 'Ms' },
              ], width: 'half', row: 1, required: true },
              { id: 'examiner_type', type: 'select', label: 'Examiner Type', options: [
                { value: 'internal', label: 'Internal' }, { value: 'external', label: 'External' },
              ], width: 'half', row: 2, required: true },
              { id: 'examiner_institution', type: 'text', label: 'Institution / Affiliation', width: 'half', row: 2, required: true },
              { id: 'examiner_email', type: 'email', label: 'Email Address', width: 'half', row: 3, required: true },
              { id: 'examiner_phone', type: 'phone', label: 'Phone Number', width: 'half', row: 3 },
              { id: 'examiner_expertise', type: 'textarea', label: 'Area of Expertise / Motivation', placeholder: 'Explain why this examiner is suitable...', width: 'full', row: 4, required: true },
              // Conditional: Full CV required for external examiners
              { id: 'examiner_full_cv', type: 'file_upload', label: 'Full CV (Required for External Examiners)', width: 'full', row: 5,
                required: false, // validated conditionally
                conditionalOn: { fieldId: 'examiner_type', operator: 'equals', value: 'external' },
                helpText: 'Upload the complete CV of the external examiner',
              },
            ],
          },
        },
        { id: 'sup_ae_date', type: 'auto_populated', label: 'Date', autoPopulate: { source: 'system', field: 'currentDate' }, width: 'half', row: 2 },
      ],
    },
    {
      id: 'coordinator_review', title: 'COORDINATOR RECOMMENDATION', assignedRole: 'coordinator', order: 3,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [],
  linkedForms: [
    {
      triggerFieldId: 'examiner_list',
      linkedTemplateSlug: 'examiner_summary_cv',
      relationship: 'required',
      filledBy: 'supervisor',
      label: 'Examiner Summary CV (required for each examiner)',
    },
  ],
  exportConfig: { templatePath: '/templates/appointment_of_examiners_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 5: Examiner Summary CV
// ════════════════════════════════════════════════════════════
export const EXAMINER_SUMMARY_CV = {
  name: 'Examiners Summary CV',
  slug: 'examiner_summary_cv',
  category: 'examination',
  description: 'Summary CV for proposed examiner.',
  initiatorRoles: ['supervisor'],
  isPrebuilt: true,
  sourceDocx: 'Examiners Summary CV 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'EXAMINER SUMMARY CV', formCode: 'FHD-ESCV-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'examiner_details', title: 'EXAMINER DETAILS', assignedRole: 'supervisor', order: 1,
      layoutMode: 'table', requiresSignature: false,
      fields: [
        { id: 'examiner_cv_name', type: 'text', label: 'Full Name', width: 'half', row: 1, required: true },
        { id: 'examiner_cv_title', type: 'text', label: 'Title / Position', width: 'half', row: 1, required: true },
        { id: 'examiner_cv_institution', type: 'text', label: 'Institution', width: 'half', row: 2, required: true },
        { id: 'examiner_cv_department', type: 'text', label: 'Department', width: 'half', row: 2, required: true },
        { id: 'examiner_cv_email', type: 'email', label: 'Email', width: 'half', row: 3, required: true },
        { id: 'examiner_cv_phone', type: 'phone', label: 'Phone', width: 'half', row: 3 },
      ],
    },
    {
      id: 'qualifications', title: 'QUALIFICATIONS & EXPERIENCE', assignedRole: 'supervisor', order: 2,
      layoutMode: 'flow', requiresSignature: false, showBorder: true,
      fields: [
        { id: 'highest_qualification', type: 'text', label: 'Highest Qualification', width: 'full', row: 1, required: true },
        { id: 'field_of_specialisation', type: 'text', label: 'Field of Specialisation', width: 'full', row: 2, required: true },
        { id: 'supervision_experience', type: 'textarea', label: 'Postgraduate Supervision Experience', placeholder: 'Number and level of students supervised to completion...', width: 'full', row: 3, required: true },
        { id: 'relevant_publications', type: 'textarea', label: 'Relevant Publications (last 5 years)', placeholder: 'List up to 5 relevant publications...', width: 'full', row: 4, required: true },
        { id: 'examination_experience', type: 'textarea', label: 'Previous Examination Experience', placeholder: 'List previous thesis/dissertation examinations conducted...', width: 'full', row: 5 },
      ],
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/examiner_summary_cv_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 6: Change of Examiners
// ════════════════════════════════════════════════════════════
export const CHANGE_OF_EXAMINERS = {
  name: 'Change of Examiners',
  slug: 'change_of_examiners',
  category: 'examination',
  description: 'Request to change previously appointed examiners.',
  initiatorRoles: ['supervisor'],
  isPrebuilt: true,
  sourceDocx: 'Change of Examiners 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'CHANGE OF EXAMINERS', formCode: 'FHD-CE-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'supervisor', order: 1,
      layoutMode: 'table', requiresSignature: false,
      fields: [
        { id: 'student_name', type: 'text', label: 'Student Name', width: 'half', row: 1, required: true },
        { id: 'student_number', type: 'text', label: 'Student Number', width: 'half', row: 1, required: true },
        { id: 'department', type: 'text', label: 'Department', width: 'half', row: 2, required: true },
        { id: 'degree', type: 'text', label: 'Degree', width: 'half', row: 2, required: true },
      ],
    },
    {
      id: 'change_details', title: 'EXAMINER CHANGE DETAILS', assignedRole: 'supervisor', order: 2,
      layoutMode: 'flow', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true,
      fields: [
        { id: 'current_examiner_name', type: 'text', label: 'Current Examiner Name', width: 'half', row: 1, required: true },
        { id: 'current_examiner_institution', type: 'text', label: 'Current Examiner Institution', width: 'half', row: 1, required: true },
        { id: 'proposed_examiner_name', type: 'text', label: 'Proposed New Examiner Name', width: 'half', row: 2, required: true },
        { id: 'proposed_examiner_institution', type: 'text', label: 'Proposed Examiner Institution', width: 'half', row: 2, required: true },
        { id: 'proposed_examiner_type', type: 'select', label: 'Examiner Type', options: [
          { value: 'internal', label: 'Internal' }, { value: 'external', label: 'External' },
        ], width: 'half', row: 3, required: true },
        { id: 'reason_for_change', type: 'textarea', label: 'Reason for Change', placeholder: 'Explain why the examiner change is requested...', width: 'full', row: 4, required: true },
      ],
    },
    {
      id: 'coordinator_review', title: 'COORDINATOR RECOMMENDATION', assignedRole: 'coordinator', order: 3,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [],
  linkedForms: [
    { triggerFieldId: 'proposed_examiner_type', linkedTemplateSlug: 'examiner_summary_cv', relationship: 'required', filledBy: 'supervisor', label: 'Summary CV for proposed examiner' },
  ],
  exportConfig: { templatePath: '/templates/change_of_examiners_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 7: Appointment of Arbiter
// ════════════════════════════════════════════════════════════
export const APPOINTMENT_OF_ARBITER = {
  name: 'Appointment of Arbiter',
  slug: 'appointment_of_arbiter',
  category: 'examination',
  description: 'Request appointment of an arbiter when examiners\' reports are in conflict.',
  initiatorRoles: ['coordinator', 'admin'],
  isPrebuilt: true,
  sourceDocx: 'Appointment of Arbiter 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'APPOINTMENT OF ARBITER', formCode: 'FHD-AA-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'coordinator', order: 1,
      layoutMode: 'table', requiresSignature: false,
      fields: [
        { id: 'student_name', type: 'text', label: 'Student Name', width: 'half', row: 1, required: true },
        { id: 'student_number', type: 'text', label: 'Student Number', width: 'half', row: 1, required: true },
        { id: 'department', type: 'text', label: 'Department', width: 'half', row: 2, required: true },
        { id: 'degree', type: 'text', label: 'Degree', width: 'half', row: 2, required: true },
        { id: 'thesis_title', type: 'text', label: 'Thesis Title', width: 'full', row: 3, required: true },
      ],
    },
    {
      id: 'arbiter_details', title: 'PROPOSED ARBITER', assignedRole: 'coordinator', order: 2,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: [
        { id: 'arbiter_name', type: 'text', label: 'Proposed Arbiter Name', width: 'half', row: 1, required: true },
        { id: 'arbiter_institution', type: 'text', label: 'Institution', width: 'half', row: 1, required: true },
        { id: 'arbiter_email', type: 'email', label: 'Email', width: 'half', row: 2, required: true },
        { id: 'reason_for_arbiter', type: 'textarea', label: 'Reason for Appointing Arbiter', placeholder: 'Describe the nature of the conflict between examiner reports...', width: 'full', row: 3, required: true },
      ],
    },
  ],
  requiredAttachments: [
    { label: 'Examiner Reports', fileTypes: ['.pdf'], required: true },
  ],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/appointment_of_arbiter_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 8: Leave of Absence
// ════════════════════════════════════════════════════════════
export const LEAVE_OF_ABSENCE = {
  name: 'Leave of Absence',
  slug: 'leave_of_absence',
  category: 'administrative',
  description: 'Request temporary leave of absence from postgraduate studies.',
  initiatorRoles: ['student'],
  isPrebuilt: true,
  sourceDocx: 'Leave of Absence 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'REQUEST FOR LEAVE OF ABSENCE', formCode: 'FHD-LOA-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'student', order: 1,
      layoutMode: 'table', requiresSignature: false, fields: studentInfoFields(),
    },
    {
      id: 'leave_details', title: 'LEAVE DETAILS', assignedRole: 'student', order: 2,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Student', showBorder: true,
      fields: [
        { id: 'leave_start_date', type: 'date', label: 'Leave Start Date', width: 'half', row: 1, required: true },
        { id: 'leave_end_date', type: 'date', label: 'Expected Return Date', width: 'half', row: 1, required: true },
        { id: 'leave_reason', type: 'select', label: 'Reason for Leave', options: [
          { value: 'medical', label: 'Medical' }, { value: 'personal', label: 'Personal' },
          { value: 'financial', label: 'Financial' }, { value: 'family', label: 'Family' },
          { value: 'other', label: 'Other' },
        ], width: 'half', row: 2, required: true },
        { id: 'leave_explanation', type: 'textarea', label: 'Detailed Explanation', placeholder: 'Provide a detailed explanation for your leave request...', width: 'full', row: 3, required: true },
        { id: 'supporting_docs_note', type: 'paragraph', label: '', width: 'full', row: 4, defaultValue: 'Please attach supporting documentation (e.g. medical certificate) if applicable.' },
      ],
    },
    {
      id: 'supervisor_review', title: 'SUPERVISOR RECOMMENDATION', assignedRole: 'supervisor', order: 3,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true, borderLabel: 'FOR OFFICIAL USE',
      fields: supervisorReviewFields(),
    },
    {
      id: 'coordinator_review', title: 'COORDINATOR RECOMMENDATION', assignedRole: 'coordinator', order: 4,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [
    { label: 'Supporting Documentation', fileTypes: ['.pdf', '.docx', '.jpg', '.png'], required: false },
  ],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/leave_of_absence_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 9: Addition of Co-Supervisor
// ════════════════════════════════════════════════════════════
export const ADDITION_OF_CO_SUPERVISOR = {
  name: 'Addition of Co-Supervisor Request',
  slug: 'addition_of_co_supervisor',
  category: 'supervision',
  description: 'Request to add a co-supervisor to your postgraduate supervision team.',
  initiatorRoles: ['student', 'supervisor'],
  isPrebuilt: true,
  sourceDocx: 'ADDITION OF CO SUPERVISOR REQUEST 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'ADDITION OF CO-SUPERVISOR', formCode: 'FHD-ACS-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'student', order: 1,
      layoutMode: 'table', requiresSignature: false, fields: studentInfoFields(),
    },
    {
      id: 'co_supervisor_details', title: 'PROPOSED CO-SUPERVISOR', assignedRole: 'student', order: 2,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Student', showBorder: true,
      fields: [
        { id: 'cosup_name', type: 'text', label: 'Proposed Co-Supervisor Name', width: 'half', row: 1, required: true },
        { id: 'cosup_title', type: 'text', label: 'Title / Position', width: 'half', row: 1, required: true },
        { id: 'cosup_institution', type: 'text', label: 'Institution / Department', width: 'half', row: 2, required: true },
        { id: 'cosup_email', type: 'email', label: 'Email Address', width: 'half', row: 2, required: true },
        { id: 'cosup_motivation', type: 'textarea', label: 'Motivation for Addition', placeholder: 'Explain why a co-supervisor is needed and how they will contribute...', width: 'full', row: 3, required: true },
      ],
    },
    {
      id: 'supervisor_review', title: 'SUPERVISOR ENDORSEMENT', assignedRole: 'supervisor', order: 3,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true,
      fields: supervisorReviewFields(),
    },
    {
      id: 'coordinator_review', title: 'COORDINATOR RECOMMENDATION', assignedRole: 'coordinator', order: 4,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/addition_of_co_supervisor_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 10: Change of Supervisor / Co-Supervisor
// ════════════════════════════════════════════════════════════
export const CHANGE_OF_SUPERVISOR = {
  name: 'Request for Change of Supervisor / Co-Supervisor',
  slug: 'change_of_supervisor',
  category: 'supervision',
  description: 'Request to change your primary supervisor or co-supervisor.',
  initiatorRoles: ['student'],
  isPrebuilt: true,
  sourceDocx: 'Request for Change of Supervisor- Co-Supervisor 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'REQUEST FOR CHANGE OF SUPERVISOR / CO-SUPERVISOR', formCode: 'FHD-CS-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'student', order: 1,
      layoutMode: 'table', requiresSignature: false, fields: studentInfoFields(),
    },
    {
      id: 'change_details', title: 'CHANGE DETAILS', assignedRole: 'student', order: 2,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Student', showBorder: true,
      fields: [
        { id: 'change_type', type: 'select', label: 'Type of Change', options: [
          { value: 'supervisor', label: 'Change of Primary Supervisor' },
          { value: 'co_supervisor', label: 'Change of Co-Supervisor' },
        ], width: 'full', row: 1, required: true },
        { id: 'current_supervisor_name', type: 'text', label: 'Current Supervisor / Co-Supervisor Name', width: 'half', row: 2, required: true },
        { id: 'proposed_supervisor_name', type: 'text', label: 'Proposed New Supervisor / Co-Supervisor Name', width: 'half', row: 2, required: true },
        { id: 'proposed_supervisor_dept', type: 'text', label: 'Department / Institution', width: 'half', row: 3, required: true },
        { id: 'proposed_supervisor_email', type: 'email', label: 'Email', width: 'half', row: 3, required: true },
        { id: 'reason_for_change', type: 'textarea', label: 'Reason for Change', placeholder: 'Provide a detailed reason for the requested change...', width: 'full', row: 4, required: true },
      ],
    },
    {
      id: 'current_supervisor_ack', title: 'CURRENT SUPERVISOR ACKNOWLEDGEMENT', assignedRole: 'supervisor', order: 3,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Current Supervisor', showBorder: true,
      fields: [
        { id: 'current_sup_acknowledges', type: 'checkbox', label: 'I acknowledge this request for change of supervisor', width: 'full', row: 1, required: true },
        { id: 'current_sup_comments', type: 'textarea', label: 'Comments', width: 'full', row: 2 },
      ],
    },
    {
      id: 'coordinator_review', title: 'COORDINATOR RECOMMENDATION', assignedRole: 'coordinator', order: 4,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/change_of_supervisor_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 11: Removal of Supervisor / Co-Supervisor
// ════════════════════════════════════════════════════════════
export const REMOVAL_OF_SUPERVISOR = {
  name: 'Request for Removal of Supervisor / Co-Supervisor',
  slug: 'removal_of_supervisor',
  category: 'supervision',
  description: 'Request removal of a supervisor or co-supervisor from the supervision team.',
  initiatorRoles: ['student'],
  isPrebuilt: true,
  sourceDocx: 'Request for removal Supervisor Co-supervisor 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'REQUEST FOR REMOVAL OF SUPERVISOR / CO-SUPERVISOR', formCode: 'FHD-RS-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'student', order: 1,
      layoutMode: 'table', requiresSignature: false, fields: studentInfoFields(),
    },
    {
      id: 'removal_details', title: 'REMOVAL DETAILS', assignedRole: 'student', order: 2,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Student', showBorder: true,
      fields: [
        { id: 'supervisor_to_remove', type: 'text', label: 'Name of Supervisor / Co-Supervisor to be Removed', width: 'full', row: 1, required: true },
        { id: 'removal_reason', type: 'textarea', label: 'Reason for Removal', placeholder: 'Provide a detailed reason...', width: 'full', row: 2, required: true },
      ],
    },
    {
      id: 'supervisor_ack', title: 'SUPERVISOR ACKNOWLEDGEMENT', assignedRole: 'supervisor', order: 3,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true,
      fields: [
        { id: 'sup_acknowledges_removal', type: 'checkbox', label: 'I acknowledge this request for removal', width: 'full', row: 1, required: true },
        { id: 'sup_removal_comments', type: 'textarea', label: 'Comments', width: 'full', row: 2 },
      ],
    },
    {
      id: 'coordinator_review', title: 'COORDINATOR RECOMMENDATION', assignedRole: 'coordinator', order: 4,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/removal_of_supervisor_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 12: Change of Thesis Title
// ════════════════════════════════════════════════════════════
export const CHANGE_OF_THESIS_TITLE = {
  name: 'Request for Change of Thesis Title',
  slug: 'change_of_thesis_title',
  category: 'registration',
  description: 'Request to change the registered thesis/dissertation title.',
  initiatorRoles: ['student'],
  isPrebuilt: true,
  sourceDocx: 'Request for Change of Thesis Title  2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'REQUEST FOR CHANGE OF THESIS TITLE', formCode: 'FHD-CTT-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'student', order: 1,
      layoutMode: 'table', requiresSignature: false, fields: studentInfoFields(),
    },
    {
      id: 'title_change', title: 'TITLE CHANGE DETAILS', assignedRole: 'student', order: 2,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Student', showBorder: true,
      fields: [
        { id: 'current_title', type: 'auto_populated', label: 'Current Registered Title', autoPopulate: { source: 'studentProfile', field: 'thesisTitle' }, width: 'full', row: 1 },
        { id: 'proposed_new_title', type: 'textarea', label: 'Proposed New Title', placeholder: 'Enter the proposed new thesis title...', width: 'full', row: 2, required: true },
        { id: 'reason_for_change', type: 'textarea', label: 'Reason for Title Change', placeholder: 'Explain why the title change is necessary...', width: 'full', row: 3, required: true },
      ],
    },
    {
      id: 'supervisor_review', title: 'SUPERVISOR RECOMMENDATION', assignedRole: 'supervisor', order: 3,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true,
      fields: supervisorReviewFields(),
    },
    {
      id: 'coordinator_review', title: 'COORDINATOR RECOMMENDATION', assignedRole: 'coordinator', order: 4,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/change_of_thesis_title_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 13: Request for Readmission
// ════════════════════════════════════════════════════════════
export const READMISSION = {
  name: 'Request for Readmission',
  slug: 'readmission',
  category: 'registration',
  description: 'Request readmission after a period of absence or discontinuation.',
  initiatorRoles: ['student'],
  isPrebuilt: true,
  sourceDocx: 'REQUEST FOR READMISSION 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'REQUEST FOR READMISSION', formCode: 'FHD-RA-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'student', order: 1,
      layoutMode: 'table', requiresSignature: false, fields: studentInfoFields(),
    },
    {
      id: 'readmission_details', title: 'READMISSION DETAILS', assignedRole: 'student', order: 2,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Student', showBorder: true,
      fields: [
        { id: 'last_registration_year', type: 'text', label: 'Last Year of Registration', width: 'half', row: 1, required: true },
        { id: 'reason_for_absence', type: 'textarea', label: 'Reason for Absence', placeholder: 'Explain the reason for your absence from studies...', width: 'full', row: 2, required: true },
        { id: 'plan_for_completion', type: 'textarea', label: 'Plan for Completion', placeholder: 'Describe your plan to complete your studies upon readmission...', width: 'full', row: 3, required: true },
        { id: 'expected_completion_date', type: 'date', label: 'Expected Completion Date', width: 'half', row: 4, required: true },
      ],
    },
    {
      id: 'supervisor_review', title: 'SUPERVISOR RECOMMENDATION', assignedRole: 'supervisor', order: 3,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true,
      fields: supervisorReviewFields(),
    },
    {
      id: 'coordinator_review', title: 'COORDINATOR RECOMMENDATION', assignedRole: 'coordinator', order: 4,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/readmission_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 14: Upgrade Masters to Doctoral
// ════════════════════════════════════════════════════════════
export const UPGRADE_MASTERS_TO_DOCTORAL = {
  name: 'Request to Upgrade from Masters to Doctoral',
  slug: 'upgrade_masters_to_doctoral',
  category: 'registration',
  description: 'Request to upgrade registration from Masters to Doctoral programme.',
  initiatorRoles: ['student'],
  isPrebuilt: true,
  sourceDocx: 'Request to upgrade from Masters to Doctoral 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'REQUEST TO UPGRADE FROM MASTERS TO DOCTORAL', formCode: 'FHD-UMD-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'student', order: 1,
      layoutMode: 'table', requiresSignature: false, fields: studentInfoFields(),
    },
    {
      id: 'upgrade_details', title: 'UPGRADE MOTIVATION', assignedRole: 'student', order: 2,
      layoutMode: 'flow', requiresSignature: true, signatureLabel: 'Signature of Student', showBorder: true,
      fields: [
        { id: 'current_thesis_title', type: 'auto_populated', label: 'Current Thesis Title', autoPopulate: { source: 'studentProfile', field: 'thesisTitle' }, width: 'full', row: 1 },
        { id: 'proposed_doctoral_title', type: 'textarea', label: 'Proposed Doctoral Title (if different)', placeholder: 'Enter the proposed doctoral thesis title...', width: 'full', row: 2 },
        { id: 'motivation', type: 'textarea', label: 'Motivation for Upgrade', placeholder: 'Provide a detailed motivation for upgrading from Masters to Doctoral...', width: 'full', row: 3, required: true, validation: { minLength: 200, message: 'Please provide a detailed motivation (min 200 chars)' } },
        { id: 'progress_summary', type: 'textarea', label: 'Summary of Progress to Date', placeholder: 'Summarise your research progress and findings to date...', width: 'full', row: 4, required: true },
      ],
    },
    {
      id: 'supervisor_review', title: 'SUPERVISOR RECOMMENDATION', assignedRole: 'supervisor', order: 3,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true,
      fields: supervisorReviewFields(),
    },
    {
      id: 'coordinator_review', title: 'COORDINATOR RECOMMENDATION', assignedRole: 'coordinator', order: 4,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [
    { label: 'Research Proposal (Doctoral)', fileTypes: ['.pdf', '.docx'], required: true },
  ],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/upgrade_masters_to_doctoral_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 15: MOU
// ════════════════════════════════════════════════════════════
export const MOU = {
  name: 'Memorandum of Understanding',
  slug: 'mou',
  category: 'supervision',
  description: 'Memorandum of Understanding between student, supervisor and co-supervisor.',
  initiatorRoles: ['student'],
  isPrebuilt: true,
  sourceDocx: 'MOU 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'MEMORANDUM OF UNDERSTANDING', formCode: 'FHD-MOU-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'student', order: 1,
      layoutMode: 'table', requiresSignature: false, fields: studentInfoFields(),
    },
    {
      id: 'mou_terms', title: 'TERMS OF AGREEMENT', assignedRole: 'student', order: 2,
      layoutMode: 'flow', requiresSignature: true, signatureLabel: 'Signature of Student', showBorder: true,
      fields: [
        { id: 'meeting_frequency', type: 'select', label: 'Agreed Meeting Frequency', options: [
          { value: 'weekly', label: 'Weekly' }, { value: 'fortnightly', label: 'Fortnightly' },
          { value: 'monthly', label: 'Monthly' }, { value: 'as_needed', label: 'As Needed' },
        ], width: 'half', row: 1, required: true },
        { id: 'communication_method', type: 'select', label: 'Primary Communication Method', options: [
          { value: 'email', label: 'Email' }, { value: 'teams', label: 'MS Teams' },
          { value: 'in_person', label: 'In Person' }, { value: 'mixed', label: 'Mixed' },
        ], width: 'half', row: 1, required: true },
        { id: 'expected_duration', type: 'text', label: 'Expected Duration of Study', placeholder: 'e.g. 2 years', width: 'half', row: 2, required: true },
        { id: 'student_responsibilities', type: 'textarea', label: 'Student Responsibilities', placeholder: 'List the agreed responsibilities of the student...', width: 'full', row: 3, required: true },
        { id: 'supervisor_responsibilities', type: 'textarea', label: 'Supervisor Responsibilities', placeholder: 'List the agreed responsibilities of the supervisor...', width: 'full', row: 4, required: true },
        { id: 'additional_terms', type: 'textarea', label: 'Additional Terms', placeholder: 'Any additional terms agreed upon...', width: 'full', row: 5 },
      ],
    },
    {
      id: 'supervisor_sign', title: 'SUPERVISOR AGREEMENT', assignedRole: 'supervisor', order: 3,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true,
      fields: [
        { id: 'sup_agrees_mou', type: 'checkbox', label: 'I agree to the terms of this Memorandum of Understanding', width: 'full', row: 1, required: true },
        { id: 'sup_mou_comments', type: 'textarea', label: 'Additional Comments', width: 'full', row: 2 },
      ],
    },
    {
      id: 'cosup_sign', title: 'CO-SUPERVISOR AGREEMENT', assignedRole: 'co_supervisor', order: 4,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Co-Supervisor', showBorder: true,
      conditionalOn: { fieldId: '_has_co_supervisor', operator: 'equals', value: true },
      fields: [
        { id: 'cosup_agrees_mou', type: 'checkbox', label: 'I agree to the terms of this Memorandum of Understanding', width: 'full', row: 1, required: true },
      ],
    },
    {
      id: 'coordinator_review', title: 'COORDINATOR RECOMMENDATION', assignedRole: 'coordinator', order: 5,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/mou_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 16: Prospective Supervisor Profile (ROTT)
// ════════════════════════════════════════════════════════════
export const SUPERVISOR_PROFILE_ROTT = {
  name: 'Prospective Supervisor Profile (ROTT)',
  slug: 'supervisor_profile_rott',
  category: 'supervision',
  description: 'Profile form for prospective postgraduate supervisors.',
  initiatorRoles: ['supervisor', 'admin'],
  isPrebuilt: true,
  sourceDocx: 'PROSPECTIVE SUPERVISOR PROFILE (ROTT) 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'PROSPECTIVE SUPERVISOR PROFILE', formCode: 'FHD-ROTT-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'supervisor_details', title: 'SUPERVISOR DETAILS', assignedRole: 'supervisor', order: 1,
      layoutMode: 'table', requiresSignature: false,
      fields: [
        { id: 'sup_full_name', type: 'auto_populated', label: 'Full Name', autoPopulate: { source: 'user', field: 'name' }, width: 'half', row: 1 },
        { id: 'sup_employee_number', type: 'text', label: 'Employee Number', width: 'half', row: 1, required: true },
        { id: 'sup_department', type: 'auto_populated', label: 'Department', autoPopulate: { source: 'user', field: 'department' }, width: 'half', row: 2 },
        { id: 'sup_position', type: 'text', label: 'Position / Title', width: 'half', row: 2, required: true },
        { id: 'sup_email', type: 'auto_populated', label: 'Email', autoPopulate: { source: 'user', field: 'email' }, width: 'half', row: 3 },
        { id: 'sup_phone', type: 'phone', label: 'Phone', width: 'half', row: 3 },
      ],
    },
    {
      id: 'qualifications', title: 'QUALIFICATIONS & RESEARCH', assignedRole: 'supervisor', order: 2,
      layoutMode: 'flow', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true,
      fields: [
        { id: 'highest_qualification', type: 'text', label: 'Highest Qualification', width: 'full', row: 1, required: true },
        { id: 'nrf_rating', type: 'text', label: 'NRF Rating (if applicable)', width: 'half', row: 2 },
        { id: 'research_areas', type: 'textarea', label: 'Research Areas', placeholder: 'List your research areas and specialisations...', width: 'full', row: 3, required: true },
        { id: 'completed_supervisions', type: 'textarea', label: 'Completed Postgraduate Supervisions', placeholder: 'List completed Masters and PhD supervisions with year of completion...', width: 'full', row: 4, required: true },
        { id: 'current_supervisions', type: 'textarea', label: 'Current Postgraduate Students', placeholder: 'List current students under supervision with expected completion dates...', width: 'full', row: 5 },
        { id: 'recent_publications', type: 'textarea', label: 'Recent Publications (last 5 years)', placeholder: 'List your most significant publications...', width: 'full', row: 6, required: true },
      ],
    },
  ],
  requiredAttachments: [
    { label: 'Full CV', fileTypes: ['.pdf', '.docx'], required: true },
  ],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/supervisor_profile_rott_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 17: Supervisor Summative Report
// ════════════════════════════════════════════════════════════
export const SUPERVISOR_SUMMATIVE_REPORT = {
  name: 'Supervisor Summative Report',
  slug: 'supervisor_summative_report',
  category: 'progress',
  description: 'Summative assessment report by supervisor. Contains optional weighted tables for structured programmes.',
  initiatorRoles: ['supervisor'],
  isPrebuilt: true,
  sourceDocx: 'SUPERVISOR SUMMATIVE REPORT TEMPLATE 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'SUPERVISOR SUMMATIVE REPORT', formCode: 'FHD-SSR-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'supervisor', order: 1,
      layoutMode: 'table', requiresSignature: false,
      fields: [
        { id: 'student_name', type: 'text', label: 'Student Name', width: 'half', row: 1, required: true },
        { id: 'student_number', type: 'text', label: 'Student Number', width: 'half', row: 1, required: true },
        { id: 'department', type: 'text', label: 'Department', width: 'half', row: 2, required: true },
        { id: 'degree', type: 'text', label: 'Degree', width: 'half', row: 2, required: true },
        { id: 'programme_type', type: 'select', label: 'Programme Type', options: [
          { value: 'research', label: 'Full Research (Thesis only)' },
          { value: 'structured', label: 'Structured (Coursework + Research)' },
        ], width: 'half', row: 3, required: true },
        { id: 'thesis_title', type: 'text', label: 'Thesis Title', width: 'full', row: 4, required: true },
      ],
    },
    {
      id: 'summative_assessment', title: 'SUMMATIVE ASSESSMENT', assignedRole: 'supervisor', order: 2,
      layoutMode: 'flow', requiresSignature: false, showBorder: true,
      fields: [
        { id: 'overall_assessment', type: 'textarea', label: 'Overall Assessment', placeholder: 'Provide an overall assessment of the student\'s work, progress and competence...', width: 'full', row: 1, required: true },
        { id: 'readiness_for_examination', type: 'select', label: 'Readiness for Examination', options: [
          { value: 'ready', label: 'Ready for Examination' },
          { value: 'nearly_ready', label: 'Nearly Ready – Minor revisions needed' },
          { value: 'not_ready', label: 'Not Ready – Significant work required' },
        ], width: 'full', row: 2, required: true },
      ],
    },
    {
      id: 'structured_assessment', title: 'WEIGHTED ASSESSMENT (STRUCTURED PROGRAMMES ONLY)', assignedRole: 'supervisor', order: 3,
      layoutMode: 'flow', requiresSignature: false, showBorder: true,
      borderLabel: 'OPTIONAL – Complete only for structured programme students',
      conditionalOn: { fieldId: 'programme_type', operator: 'equals', value: 'structured' },
      fields: [
        {
          id: 'coursework_assessment',
          type: 'weighted_table',
          label: 'Coursework Assessment',
          helpText: 'Assess each coursework module. Weights must sum to 100%.',
          width: 'full', row: 1,
          required: false,
          tableConfig: {
            columns: [
              { key: 'module', label: 'Module', type: 'text', width: '30%' },
              { key: 'weight', label: 'Weight (%)', type: 'number', width: '15%' },
              { key: 'mark', label: 'Mark (%)', type: 'number', width: '15%' },
              { key: 'weighted_mark', label: 'Weighted', type: 'computed', width: '15%' },
              { key: 'comment', label: 'Comment', type: 'text', width: '25%' },
            ],
            rows: [
              { key: 'module_1', label: 'Module 1', weight: 0 },
              { key: 'module_2', label: 'Module 2', weight: 0 },
              { key: 'module_3', label: 'Module 3', weight: 0 },
              { key: 'module_4', label: 'Module 4', weight: 0 },
            ],
            showWeightColumn: true,
            showTotalRow: true,
            totalFormula: 'weighted_average',
            isOptional: true,
          },
        },
        {
          id: 'research_assessment',
          type: 'weighted_table',
          label: 'Research Component Assessment',
          helpText: 'Assess the research component. Weights must sum to 100%.',
          width: 'full', row: 2,
          required: false,
          tableConfig: {
            columns: [
              { key: 'criterion', label: 'Criterion', type: 'text', width: '30%' },
              { key: 'weight', label: 'Weight (%)', type: 'number', width: '15%' },
              { key: 'mark', label: 'Mark (%)', type: 'number', width: '15%' },
              { key: 'weighted_mark', label: 'Weighted', type: 'computed', width: '15%' },
              { key: 'comment', label: 'Comment', type: 'text', width: '25%' },
            ],
            rows: [
              { key: 'literature', label: 'Literature Review', weight: 0 },
              { key: 'methodology', label: 'Research Methodology', weight: 0 },
              { key: 'data_analysis', label: 'Data Collection & Analysis', weight: 0 },
              { key: 'thesis_writing', label: 'Thesis Writing', weight: 0 },
            ],
            showWeightColumn: true,
            showTotalRow: true,
            totalFormula: 'weighted_average',
            isOptional: true,
          },
        },
      ],
    },
    {
      id: 'supervisor_declaration', title: 'SUPERVISOR DECLARATION', assignedRole: 'supervisor', order: 4,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true,
      fields: [
        { id: 'sup_declaration', type: 'checkbox', label: 'I declare that this summative report is an accurate reflection of the student\'s work and progress', width: 'full', row: 1, required: true },
        { id: 'sup_final_comments', type: 'textarea', label: 'Final Comments', width: 'full', row: 2 },
      ],
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/supervisor_summative_report_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 18: Other Request
// ════════════════════════════════════════════════════════════
export const OTHER_REQUEST = {
  name: 'Other Requests',
  slug: 'other_request',
  category: 'other',
  description: 'General request form for matters not covered by other templates.',
  initiatorRoles: ['student'],
  isPrebuilt: true,
  sourceDocx: 'OTHER REQUESTS 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'OTHER REQUEST', formCode: 'FHD-OR-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'student_details', title: 'STUDENT DETAILS', assignedRole: 'student', order: 1,
      layoutMode: 'table', requiresSignature: false, fields: studentInfoFields(),
    },
    {
      id: 'request_details', title: 'REQUEST DETAILS', assignedRole: 'student', order: 2,
      layoutMode: 'flow', requiresSignature: true, signatureLabel: 'Signature of Student', showBorder: true,
      fields: [
        { id: 'request_subject', type: 'text', label: 'Subject / Nature of Request', width: 'full', row: 1, required: true },
        { id: 'request_description', type: 'textarea', label: 'Detailed Description', placeholder: 'Provide a detailed description of your request...', width: 'full', row: 2, required: true },
        { id: 'supporting_info', type: 'textarea', label: 'Supporting Information', placeholder: 'Any additional information to support your request...', width: 'full', row: 3 },
      ],
    },
    {
      id: 'supervisor_review', title: 'SUPERVISOR RECOMMENDATION', assignedRole: 'supervisor', order: 3,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Supervisor', showBorder: true,
      fields: supervisorReviewFields(),
    },
    {
      id: 'coordinator_review', title: 'COORDINATOR RECOMMENDATION', assignedRole: 'coordinator', order: 4,
      layoutMode: 'table', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: coordinatorReviewFields(),
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/other_request_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 19: Natural Sciences Higher Degrees (Cover)
// ════════════════════════════════════════════════════════════
export const NS_HIGHER_DEGREES_COVER = {
  name: 'Natural Sciences Higher Degrees',
  slug: 'ns_higher_degrees_cover',
  category: 'administrative',
  description: 'Cover / reference sheet for Natural Sciences Higher Degrees Committee.',
  initiatorRoles: ['coordinator', 'admin'],
  isPrebuilt: true,
  sourceDocx: '2026 NATURAL SCIENCES HIGHER DEGREES.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'NATURAL SCIENCES HIGHER DEGREES', formCode: 'FHD-NSHD-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'cover_details', title: 'MEETING DETAILS', assignedRole: 'coordinator', order: 1,
      layoutMode: 'table', requiresSignature: false,
      fields: [
        { id: 'meeting_date', type: 'date', label: 'Meeting Date', width: 'half', row: 1, required: true },
        { id: 'meeting_venue', type: 'text', label: 'Venue', width: 'half', row: 1, required: true },
        { id: 'chairperson', type: 'text', label: 'Chairperson', width: 'half', row: 2, required: true },
        { id: 'secretary', type: 'text', label: 'Secretary', width: 'half', row: 2, required: true },
        { id: 'agenda_items', type: 'textarea', label: 'Agenda Items', placeholder: 'List the agenda items for this meeting...', width: 'full', row: 3, required: true },
        { id: 'notes', type: 'textarea', label: 'Notes', width: 'full', row: 4 },
      ],
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/ns_higher_degrees_2026.docx' },
};

// ════════════════════════════════════════════════════════════
// TEMPLATE 20: FHD Submissions Checklist
// ════════════════════════════════════════════════════════════
export const FHD_CHECKLIST = {
  name: 'FHD Submissions Checklist',
  slug: 'fhd_checklist',
  category: 'administrative',
  description: 'Checklist for submissions to the Faculty Higher Degrees Committee.',
  initiatorRoles: ['coordinator', 'admin'],
  isPrebuilt: true,
  sourceDocx: 'FHD submissions - Checklist and Forms - 2026.docx',
  layout: {
    header: { ...UWC_HEADER, formTitle: 'FHD SUBMISSIONS – CHECKLIST', formCode: 'FHD-CL-2026' },
    style: 'document',
  },
  sections: [
    {
      id: 'submission_details', title: 'SUBMISSION DETAILS', assignedRole: 'coordinator', order: 1,
      layoutMode: 'table', requiresSignature: false,
      fields: [
        { id: 'student_name', type: 'text', label: 'Student Name', width: 'half', row: 1, required: true },
        { id: 'student_number', type: 'text', label: 'Student Number', width: 'half', row: 1, required: true },
        { id: 'submission_type', type: 'text', label: 'Type of Submission', width: 'half', row: 2, required: true },
        { id: 'fhd_meeting_date', type: 'date', label: 'FHD Meeting Date', width: 'half', row: 2, required: true },
      ],
    },
    {
      id: 'checklist', title: 'CHECKLIST', assignedRole: 'coordinator', order: 2,
      layoutMode: 'flow', requiresSignature: true, signatureLabel: 'Signature of Coordinator', showBorder: true,
      fields: [
        { id: 'check_form_complete', type: 'checkbox', label: 'Form duly completed and signed', width: 'full', row: 1 },
        { id: 'check_supervisor_signed', type: 'checkbox', label: 'Supervisor recommendation and signature', width: 'full', row: 2 },
        { id: 'check_cosupervisor_signed', type: 'checkbox', label: 'Co-supervisor signature (if applicable)', width: 'full', row: 3 },
        { id: 'check_coordinator_signed', type: 'checkbox', label: 'Coordinator recommendation and signature', width: 'full', row: 4 },
        { id: 'check_supporting_docs', type: 'checkbox', label: 'All supporting documents attached', width: 'full', row: 5 },
        { id: 'check_ethics_clearance', type: 'checkbox', label: 'Ethics clearance certificate (if applicable)', width: 'full', row: 6 },
        { id: 'check_plagiarism', type: 'checkbox', label: 'Plagiarism report (if applicable)', width: 'full', row: 7 },
        { id: 'check_cv', type: 'checkbox', label: 'Examiner CV(s) attached (if applicable)', width: 'full', row: 8 },
        { id: 'checklist_comments', type: 'textarea', label: 'Additional Comments', width: 'full', row: 9 },
      ],
    },
  ],
  requiredAttachments: [],
  linkedForms: [],
  exportConfig: { templatePath: '/templates/fhd_checklist_2026.docx' },
};


// ════════════════════════════════════════════════════════════
// MASTER EXPORT: All 20 templates in order
// ════════════════════════════════════════════════════════════
export const ALL_PREBUILT_TEMPLATES = [
  TITLE_REGISTRATION,
  PROGRESS_REPORT,
  INTENTION_TO_SUBMIT,
  APPOINTMENT_OF_EXAMINERS,
  EXAMINER_SUMMARY_CV,
  CHANGE_OF_EXAMINERS,
  APPOINTMENT_OF_ARBITER,
  LEAVE_OF_ABSENCE,
  ADDITION_OF_CO_SUPERVISOR,
  CHANGE_OF_SUPERVISOR,
  REMOVAL_OF_SUPERVISOR,
  CHANGE_OF_THESIS_TITLE,
  READMISSION,
  UPGRADE_MASTERS_TO_DOCTORAL,
  MOU,
  SUPERVISOR_PROFILE_ROTT,
  SUPERVISOR_SUMMATIVE_REPORT,
  OTHER_REQUEST,
  NS_HIGHER_DEGREES_COVER,
  FHD_CHECKLIST,
];
