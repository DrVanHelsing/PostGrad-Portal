namespace PostGrad.Api.Models;

public class User
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // student | supervisor | coordinator | admin
    public string? FirstName { get; set; }
    public string? Surname { get; set; }
    public string? Title { get; set; }
    public string? StudentNumber { get; set; }
    public string? Programme { get; set; }
    public string? ResearchTitle { get; set; }
    public string? Organization { get; set; }
    public string? Department { get; set; }
    public string? Faculty { get; set; }
    public List<string> Permissions { get; set; } = [];
    public string? LocalPassword { get; set; }
    public string? GeneratedPassword { get; set; }
    public bool MustChangePassword { get; set; }
    public Dictionary<string, object>? NotificationPrefs { get; set; }
    public DateTime? CreatedAt { get; set; }
}
