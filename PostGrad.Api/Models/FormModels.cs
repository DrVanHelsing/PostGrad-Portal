namespace PostGrad.Api.Models;

public class FormTemplate
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public int Version { get; set; } = 1;
    public string Status { get; set; } = "draft"; // draft | published | archived
    public string Category { get; set; } = "other";
    public string? Description { get; set; }
    public List<string> InitiatorRoles { get; set; } = ["student"];
    public Dictionary<string, object> Layout { get; set; } = [];
    public List<FormSection> Sections { get; set; } = [];
    public List<string> RequiredAttachments { get; set; } = [];
    public List<string> LinkedForms { get; set; } = [];
    public Dictionary<string, object> ExportConfig { get; set; } = [];
    public bool IsPrebuilt { get; set; }
    public string? SourceDocx { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string CreatedBy { get; set; } = "system";
}

public class FormSection
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public List<FormField> Fields { get; set; } = [];
    public bool IsLocked { get; set; }
    public List<string> LockedForRoles { get; set; } = [];
}

public class FormField
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty; // text | textarea | select | checkbox | date | signature | repeater | table
    public string Label { get; set; } = string.Empty;
    public bool Required { get; set; }
    public string? Placeholder { get; set; }
    public List<string>? Options { get; set; }
    public object? DefaultValue { get; set; }
}

public class FormSubmission
{
    public string Id { get; set; } = string.Empty;
    public string TemplateId { get; set; } = string.Empty;
    public string TemplateName { get; set; } = string.Empty;
    public string TemplateSlug { get; set; } = string.Empty;
    public string SubmittedBy { get; set; } = string.Empty;
    public string SubmitterName { get; set; } = string.Empty;
    public string SubmitterRole { get; set; } = string.Empty;
    public string? StudentId { get; set; }
    public string? RequestId { get; set; }
    public Dictionary<string, object> Data { get; set; } = [];
    public List<FormSignatureEntry> Signatures { get; set; } = [];
    public string Status { get; set; } = "draft"; // draft | submitted | approved | rejected
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class FormSignatureEntry
{
    public string Role { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime SignedAt { get; set; }
    public string? SignatureData { get; set; }
}

public class FormAnnotation
{
    public string Id { get; set; } = string.Empty;
    public string SubmissionId { get; set; } = string.Empty;
    public string FieldId { get; set; } = string.Empty;
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorRole { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public string Status { get; set; } = "open"; // open | resolved
    public DateTime CreatedAt { get; set; }
}
