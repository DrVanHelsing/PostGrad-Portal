namespace PostGrad.Api.Models;

public class DocumentVersion
{
    public string Id { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public int Version { get; set; }
    public List<VersionDocument> Documents { get; set; } = [];
    public List<VersionComment> Comments { get; set; } = [];
    public List<VersionFeedback> Feedback { get; set; } = [];
    public string Status { get; set; } = "submitted";
    public string SubmittedBy { get; set; } = string.Empty;
    public string SubmitterName { get; set; } = string.Empty;
    public string SubmitterRole { get; set; } = "student";
    public string? ChangeNotes { get; set; }
    public DateTime SubmittedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class VersionDocument
{
    public string Name { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? Type { get; set; }
    public long? Size { get; set; }
}

public class VersionComment
{
    public string Id { get; set; } = string.Empty;
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorRole { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class VersionFeedback
{
    public string Id { get; set; } = string.Empty;
    public string AuthorId { get; set; } = string.Empty;
    public string Section { get; set; } = string.Empty;
    public string Comment { get; set; } = string.Empty;
    public string Status { get; set; } = "open"; // open | resolved
    public DateTime CreatedAt { get; set; }
}

public class Annotation
{
    public string Id { get; set; } = string.Empty;
    public string VersionId { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public string? DocumentName { get; set; }
    public string? SelectedText { get; set; }
    public string Comment { get; set; } = string.Empty;
    public int? PageNumber { get; set; }
    public string AuthorId { get; set; } = string.Empty;
    public string AuthorName { get; set; } = string.Empty;
    public string AuthorRole { get; set; } = string.Empty;
    public string HighlightColor { get; set; } = "#ffd43b";
    public string Status { get; set; } = "draft"; // draft | published | resolved
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
