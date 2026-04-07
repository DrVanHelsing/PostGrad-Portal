using Google.Cloud.Firestore;
using System.Text.Json;

namespace PostGrad.Api.Services;

public class FirestoreService : IFirestoreService
{
    public FirestoreDb Db { get; }

    public FirestoreService(FirestoreDb db)
    {
        Db = db;
    }

    // ─── Generic helpers ─────────────────────────

    public async Task<T?> GetDocAsync<T>(string collection, string id) where T : class
    {
        var docRef = Db.Collection(collection).Document(id);
        var snap = await docRef.GetSnapshotAsync();
        if (!snap.Exists) return null;
        var dict = snap.ToDictionary();
        dict["id"] = snap.Id;
        return DictToModel<T>(dict);
    }

    public async Task<List<T>> GetCollectionAsync<T>(string collection) where T : class
    {
        var snap = await Db.Collection(collection).GetSnapshotAsync();
        return snap.Documents
            .Select(d => { var dict = d.ToDictionary(); dict["id"] = d.Id; return DictToModel<T>(dict); })
            .Where(x => x != null)
            .Select(x => x!)
            .ToList();
    }

    public async Task<string> AddDocAsync(string collection, Dictionary<string, object> data)
    {
        var docRef = await Db.Collection(collection).AddAsync(data);
        return docRef.Id;
    }

    public async Task SetDocAsync(string collection, string id, Dictionary<string, object> data)
    {
        await Db.Collection(collection).Document(id).SetAsync(data);
    }

    public async Task UpdateDocAsync(string collection, string id, Dictionary<string, object> data)
    {
        var updates = data.Select(kv => new FieldPath(kv.Key))
            .Zip(data.Values, (path, val) => (path, val))
            .ToDictionary(t => t.path, t => t.val);

        var docRef = Db.Collection(collection).Document(id);
        await docRef.UpdateAsync(data.ToDictionary(k => k.Key, v => v.Value));
    }

    public async Task DeleteDocAsync(string collection, string id)
    {
        await Db.Collection(collection).Document(id).DeleteAsync();
    }

    public async Task<List<T>> QueryAsync<T>(string collection, params (string field, string op, object value)[] filters) where T : class
    {
        Query q = Db.Collection(collection);
        foreach (var (field, op, value) in filters)
        {
            q = op switch
            {
                "==" => q.WhereEqualTo(field, value),
                "!=" => q.WhereNotEqualTo(field, value),
                "<"  => q.WhereLessThan(field, value),
                "<=" => q.WhereLessThanOrEqualTo(field, value),
                ">"  => q.WhereGreaterThan(field, value),
                ">=" => q.WhereGreaterThanOrEqualTo(field, value),
                "array-contains" => q.WhereArrayContains(field, value),
                _ => q
            };
        }
        var snap = await q.GetSnapshotAsync();
        return snap.Documents
            .Select(d => { var dict = d.ToDictionary(); dict["id"] = d.Id; return DictToModel<T>(dict); })
            .Where(x => x != null)
            .Select(x => x!)
            .ToList();
    }

    // ─── Audit log ────────────────────────────────

    public async Task AddAuditLogAsync(string userId, string userName, string action, string entityType, string entityId, string? details)
    {
        await AddDocAsync(Collections.AuditLogs, new Dictionary<string, object>
        {
            { "timestamp", Timestamp.GetCurrentTimestamp() },
            { "userId", userId },
            { "userName", userName ?? userId },
            { "action", action },
            { "entityType", entityType },
            { "entityId", entityId },
            { "details", details ?? "" },
        });
    }

    // ─── Notification ──────────────────────────────

    public async Task AddNotificationAsync(string userId, string title, string message, string type = "info", string? link = null)
    {
        var data = new Dictionary<string, object>
        {
            { "userId", userId },
            { "title", title },
            { "message", message },
            { "type", type },
            { "read", false },
            { "createdAt", Timestamp.GetCurrentTimestamp() },
        };
        if (link != null) data["link"] = link;
        await AddDocAsync(Collections.Notifications, data);
    }

    // ─── Private: Firestore dict → model ──────────

    private static T? DictToModel<T>(Dictionary<string, object> dict) where T : class
    {
        try
        {
            // Serialize to JSON then deserialize with System.Text.Json for easy conversion
            var normalised = NormaliseDict(dict);
            var json = JsonSerializer.Serialize(normalised);
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            };
            return JsonSerializer.Deserialize<T>(json, options);
        }
        catch
        {
            return null;
        }
    }

    private static object NormaliseValue(object? value)
    {
        return value switch
        {
            Timestamp ts => ts.ToDateTime(),
            IDictionary<string, object> nested => NormaliseDict(nested),
            IList<object> list => list.Select(NormaliseValue).ToList(),
            null => "",
            _ => value,
        };
    }

    private static Dictionary<string, object> NormaliseDict(IDictionary<string, object> dict)
    {
        return dict.ToDictionary(
            kv => kv.Key,
            kv => NormaliseValue(kv.Value));
    }
}
