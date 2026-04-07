using Google.Cloud.Firestore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using PostGrad.Api.Models;
using PostGrad.Api.Services;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace PostGrad.Api.SmokeTests.Fixtures;

/// <summary>
/// Creates an in-memory test server with the full DI pipeline but a mocked
/// IFirestoreService so no real Firestore connection is needed.
/// </summary>
public class ApiFactory : WebApplicationFactory<Program>
{
    public Mock<IFirestoreService> Firestore { get; } = new(MockBehavior.Loose);
    public Mock<IAuthService> Auth { get; } = new(MockBehavior.Loose);
    public Mock<IHdRequestService> HdRequestSvc { get; } = new(MockBehavior.Loose);

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // Remove real Firestore registration
            var fsDescriptor = services.SingleOrDefault(s => s.ServiceType == typeof(FirestoreDb));
            if (fsDescriptor != null) services.Remove(fsDescriptor);

            var ifsDescriptor = services.SingleOrDefault(s => s.ServiceType == typeof(IFirestoreService));
            if (ifsDescriptor != null) services.Remove(ifsDescriptor);

            var authDescriptor = services.SingleOrDefault(s => s.ServiceType == typeof(IAuthService));
            if (authDescriptor != null) services.Remove(authDescriptor);

            var hdSvcDescriptor = services.SingleOrDefault(s => s.ServiceType == typeof(IHdRequestService));
            if (hdSvcDescriptor != null) services.Remove(hdSvcDescriptor);

            // Register mocks
            services.AddSingleton(Firestore.Object);
            services.AddSingleton<IFirestoreService>(_ => Firestore.Object);
            services.AddScoped<IAuthService>(_ => Auth.Object);
            services.AddScoped<IHdRequestService>(_ => HdRequestSvc.Object);
        });
    }

    public HttpClient CreateClientWithToken(string token)
    {
        var client = CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }
}

/// <summary>
/// Holds pre-configured seed data + JWT tokens for each portal role.
/// Call SetupDefaults() on the ApiFactory after construction.
/// </summary>
public static class SeedData
{
    // ── Users ────────────────────────────────────────────────────────────
    public static readonly User AdminUser = new()
    {
        Id = "admin-001", Email = "admin@univ.ac.za", Name = "Admin User",
        Role = "admin", LocalPassword = "Portal@2026"
    };

    public static readonly User SupervisorUser = new()
    {
        Id = "sup-001", Email = "supervisor@univ.ac.za", Name = "Dr Supervisor",
        Role = "supervisor", LocalPassword = "Portal@2026"
    };

    public static readonly User CoordUser = new()
    {
        Id = "coord-001", Email = "coordinator@univ.ac.za", Name = "Coordinator",
        Role = "coordinator", LocalPassword = "Portal@2026"
    };

    public static readonly User StudentUser = new()
    {
        Id = "stu-001", Email = "student@univ.ac.za", Name = "Test Student",
        Role = "student", LocalPassword = "Portal@2026"
    };

    public static readonly IReadOnlyList<User> AllUsers =
        [AdminUser, SupervisorUser, CoordUser, StudentUser];

    // ── HD Requests ───────────────────────────────────────────────────────
    public static readonly HdRequest DraftRequest = new()
    {
        Id = "req-001", Type = "HDR-001", Title = "Test Request",
        Status = "draft", StudentId = "stu-001", StudentName = "Test Student",
        SupervisorId = "sup-001", CoordinatorId = "coord-001",
    };

    public static readonly HdRequest SubmittedRequest = new()
    {
        Id = "req-002", Type = "HDR-001", Title = "Submitted Request",
        Status = "submitted_to_supervisor", StudentId = "stu-001",
        StudentName = "Test Student", SupervisorId = "sup-001", CoordinatorId = "coord-001",
    };

    // ── Calendar / Milestones / Notifications / Profiles ─────────────────
    public static readonly CalendarEvent CalEvent = new()
    {
        Id = "cal-001", Title = "Research Meeting", Date = DateTime.UtcNow.AddDays(7),
        Type = "meeting", Scope = "personal", CreatedBy = "sup-001"
    };

    public static readonly Milestone Mile = new()
    {
        Id = "mile-001", StudentId = "stu-001", Title = "Chapter 1 Draft",
        Type = "submission", Date = DateTime.UtcNow.AddDays(30)
    };

    public static readonly Notification Notif = new()
    {
        Id = "notif-001", UserId = "stu-001", Title = "Reminder",
        Message = "Submit your draft", Type = "info", Read = false,
        CreatedAt = DateTime.UtcNow
    };

    public static readonly StudentProfile Profile = new()
    {
        Id = "prof-001", UserId = "stu-001", Programme = "PhD Computer Science",
        Status = "active", SupervisorId = "sup-001"
    };

    // ── Doc Versions / Annotations ────────────────────────────────────────
    public static readonly DocumentVersion DocVersion = new()
    {
        Id = "ver-001", RequestId = "req-001", Version = 1,
        Status = "submitted", SubmittedBy = "stu-001", SubmitterName = "Test Student",
        SubmitterRole = "student"
    };

    public static readonly Annotation Anno = new()
    {
        Id = "ann-001", VersionId = "ver-001", RequestId = "req-001",
        Comment = "Please revise section 2", AuthorId = "sup-001",
        AuthorName = "Dr Supervisor", AuthorRole = "supervisor",
        Status = "draft", CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
    };

    // ── Form Templates / Submissions / Annotations ────────────────────────
    public static readonly FormTemplate Template = new()
    {
        Id = "tmpl-001", Name = "HDR Form", Slug = "hdr-001",
        Status = "published", CreatedBy = "admin-001"
    };

    public static readonly FormSubmission Submission = new()
    {
        Id = "sub-001", TemplateId = "tmpl-001", TemplateName = "HDR Form",
        StudentId = "stu-001", Status = "draft"
    };

    public static readonly FormAnnotation FormAnno = new()
    {
        Id = "fanno-001", SubmissionId = "sub-001", FieldId = "field-1",
        AuthorId = "sup-001", AuthorName = "Dr Supervisor", AuthorRole = "supervisor",
        Comment = "Clarify this field", Status = "open", CreatedAt = DateTime.UtcNow
    };

    // ── Audit Logs ────────────────────────────────────────────────────────
    public static readonly AuditLog Log1 = new()
    {
        Id = "log-001", UserId = "admin-001", UserName = "Admin User",
        Action = "user_created", EntityType = "users", EntityId = "stu-001",
        Timestamp = DateTime.UtcNow.AddHours(-1)
    };
}

/// <summary>JWT helper — generates real signed tokens for test users.</summary>
public static class TokenHelper
{
    private const string Key = "PostGradPortal-SuperSecret-JWT-Key-2026!-ChangeInProd";
    private const string Issuer = "postgrad-portal";
    private const string Audience = "postgrad-portal";

    public static string GenerateFor(User user)
    {
        var secKey = new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(
            System.Text.Encoding.UTF8.GetBytes(Key));
        var creds = new Microsoft.IdentityModel.Tokens.SigningCredentials(
            secKey, Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, user.Id),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Email, user.Email),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, user.Name),
            new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, user.Role ?? "student"),
            new System.Security.Claims.Claim("mustChangePassword", "false"),
        };

        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds);

        return new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token);
    }

    public static string AdminToken => GenerateFor(SeedData.AdminUser);
    public static string SupervisorToken => GenerateFor(SeedData.SupervisorUser);
    public static string CoordinatorToken => GenerateFor(SeedData.CoordUser);
    public static string StudentToken => GenerateFor(SeedData.StudentUser);
}

/// <summary>Extension helpers for HttpClient in tests.</summary>
public static class HttpClientExtensions
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public static Task<HttpResponseMessage> PostJsonAsync<T>(this HttpClient client, string url, T body)
        => client.PostAsync(url, JsonContent.Create(body, options: JsonOpts));

    public static Task<HttpResponseMessage> PatchJsonAsync<T>(this HttpClient client, string url, T body)
    {
        var content = JsonContent.Create(body, options: JsonOpts);
        var req = new HttpRequestMessage(HttpMethod.Patch, url) { Content = content };
        return client.SendAsync(req);
    }

    public static async Task<T?> ReadJsonAsync<T>(this HttpResponseMessage resp)
        => await resp.Content.ReadFromJsonAsync<T>(JsonOpts);
}
