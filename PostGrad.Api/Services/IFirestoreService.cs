using Google.Cloud.Firestore;
using PostGrad.Api.Models;

namespace PostGrad.Api.Services;

// ─── Collection name constants ─────────────────────
public static class Collections
{
    public const string Users = "users";
    public const string HdRequests = "hdRequests";
    public const string CalendarEvents = "calendarEvents";
    public const string Milestones = "milestones";
    public const string Notifications = "notifications";
    public const string StudentProfiles = "studentProfiles";
    public const string AuditLogs = "auditLogs";
    public const string DocumentVersions = "documentVersions";
    public const string Annotations = "annotations";
    public const string FormTemplates = "formTemplates";
    public const string FormSubmissions = "formSubmissions";
    public const string ThesisSubmissions = "thesisSubmissions";
    public const string FormAnnotations = "formAnnotations";
}

// ─── Interface ────────────────────────────────────
public interface IFirestoreService
{
    FirestoreDb Db { get; }

    // Generic helpers
    Task<T?> GetDocAsync<T>(string collection, string id) where T : class;
    Task<List<T>> GetCollectionAsync<T>(string collection) where T : class;
    Task<string> AddDocAsync(string collection, Dictionary<string, object> data);
    Task SetDocAsync(string collection, string id, Dictionary<string, object> data);
    Task UpdateDocAsync(string collection, string id, Dictionary<string, object> data);
    Task DeleteDocAsync(string collection, string id);
    Task<List<T>> QueryAsync<T>(string collection, params (string field, string op, object value)[] filters) where T : class;

    // Audit helper
    Task AddAuditLogAsync(string userId, string userName, string action, string entityType, string entityId, string? details);

    // Notification helper
    Task AddNotificationAsync(string userId, string title, string message, string type = "info", string? link = null);
}
