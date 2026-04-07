namespace PostGrad.Api.Models;

public class CalendarEvent
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Time { get; set; }
    public string Type { get; set; } = string.Empty; // deadline | meeting | event | reminder
    public string Scope { get; set; } = string.Empty; // personal | department | faculty | global
    public string? Description { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public List<string> TargetUserIds { get; set; } = [];
}

public class Milestone
{
    public string Id { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public string? Description { get; set; }
}

public class Notification
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = "info"; // info | success | warning | error
    public bool Read { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Link { get; set; }
}

public class AuditLog
{
    public string Id { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string UserId { get; set; } = string.Empty;
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? Details { get; set; }
}

public class StudentProfile
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string? StudentNumber { get; set; }
    public string? Programme { get; set; }
    public string? Degree { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public int YearsRegistered { get; set; }
    public string Status { get; set; } = "active"; // active | on_leave | completed | discontinued
    public string? SupervisorId { get; set; }
    public string? CoSupervisorId { get; set; }
    public string? NominalSupervisorId { get; set; }
    public string? ThesisTitle { get; set; }
    public string? ResearchTitle { get; set; }
    public List<SupervisorHistoryEntry> SupervisorHistory { get; set; } = [];
}

public class SupervisorHistoryEntry
{
    public string SupervisorId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = "primary";
    public DateTime From { get; set; }
    public DateTime? To { get; set; }
}
