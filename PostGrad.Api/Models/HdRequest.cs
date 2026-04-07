namespace PostGrad.Api.Models;

public class HdRequest
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "draft";
    public string StudentId { get; set; } = string.Empty;
    public string StudentName { get; set; } = string.Empty;
    public string SupervisorId { get; set; } = string.Empty;
    public string? CoSupervisorId { get; set; }
    public string CoordinatorId { get; set; } = string.Empty;
    public string CurrentOwner { get; set; } = string.Empty;
    public bool Locked { get; set; }
    public string? AccessCode { get; set; }
    public DateTime? AccessCodeExpiry { get; set; }
    public DateTime? TimerStart { get; set; }
    public int? TimerHours { get; set; }
    public string? ReferredBackReason { get; set; }
    public string? ReferredBackBy { get; set; }
    public DateTime? ReferredBackDate { get; set; }
    public string? Notes { get; set; }
    public string? FhdOutcome { get; set; }
    public string? ShdOutcome { get; set; }
    public string? ReferenceNumber { get; set; }
    public List<HdRequestDocument> Documents { get; set; } = [];
    public List<HdRequestVersion> Versions { get; set; } = [];
    public List<HdRequestSignature> Signatures { get; set; } = [];
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public string? StudentDepartment { get; set; }
    public string? StudentFaculty { get; set; }
    public string? StudentProgramme { get; set; }
}

public class HdRequestDocument
{
    public string Name { get; set; } = string.Empty;
    public string? Url { get; set; }
    public string? Type { get; set; }
}

public class HdRequestVersion
{
    public int Version { get; set; }
    public DateTime Date { get; set; }
    public string Action { get; set; } = string.Empty;
    public string By { get; set; } = string.Empty;
}

public class HdRequestSignature
{
    public string Role { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DateTime Date { get; set; }
}
